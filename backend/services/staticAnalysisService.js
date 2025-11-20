/**
 * Service for static code analysis of npm packages
 * 
 * Real implementation would:
 * - Download package tarball
 * - Extract and analyze source code
 * - Detect risky APIs, obfuscation, suspicious patterns
 * - Extract code metrics
 */

import axios from 'axios';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tar from 'tar';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const staticAnalysisService = {
  /**
   * Download package tarball
   */
  async downloadPackageSource(packageName, version, tarballUrl) {
    const tempDir = path.join(__dirname, '../temp', `${packageName}-${version}`);
    
    try {
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });

      // Download tarball
      const tarballPath = path.join(tempDir, 'package.tgz');
      
      const response = await apiCallWithRetry(
        () => axios.get(tarballUrl, {
          responseType: 'stream',
          headers: {
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          }
        }),
        { maxRetries: 3 }
      );

      const writer = createWriteStream(tarballPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Extract tarball
      await tar.extract({
        file: tarballPath,
        cwd: tempDir
      });

      return path.join(tempDir, 'package');
    } catch (error) {
      // Cleanup on error
      await this.cleanupTempDirectory(tempDir).catch(() => {});
      throw error;
    }
  },

  /**
   * Cleanup temporary directory
   */
  async cleanupTempDirectory(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Error cleaning up temp directory ${dirPath}:`, error.message);
    }
  },

  /**
   * Find all JavaScript files in directory
   */
  async findJavaScriptFiles(dirPath, fileList = []) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip node_modules and other common directories
        if (entry.name === 'node_modules' || 
            entry.name === '.git' || 
            entry.name === 'dist' ||
            entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.findJavaScriptFiles(fullPath, fileList);
        } else if (entry.isFile() && 
                   (entry.name.endsWith('.js') || 
                    entry.name.endsWith('.jsx') ||
                    entry.name.endsWith('.ts') ||
                    entry.name.endsWith('.tsx'))) {
          fileList.push(fullPath);
        }
      }

      return fileList;
    } catch (error) {
      console.warn(`Error finding JavaScript files in ${dirPath}:`, error.message);
      return fileList;
    }
  },

  /**
   * Analyze JavaScript file for risky patterns
   */
  analyzeJavaScriptFile(filePath, fileContent) {
    const features = {
      riskyAPIs: [],
      obfuscated: false,
      downloadsRemote: false,
      suspiciousPatterns: []
    };

    // Risky API patterns
    const riskyPatterns = [
      { pattern: /child_process\.(exec|spawn|fork)/, type: 'process_execution', severity: 'high' },
      { pattern: /eval\(/, type: 'eval_usage', severity: 'high' },
      { pattern: /Function\(/, type: 'function_constructor', severity: 'high' },
      { pattern: /require\(['"]https?:\/\//, type: 'remote_require', severity: 'critical' },
      { pattern: /fetch\(|axios\(|request\(/, type: 'network_request', severity: 'medium' },
      { pattern: /fs\.(writeFile|writeFileSync|unlink)/, type: 'file_modification', severity: 'medium' },
      { pattern: /Buffer\.from\(.*base64\)/, type: 'base64_decoding', severity: 'medium' }
    ];

    // Check for risky patterns
    riskyPatterns.forEach(({ pattern, type, severity }) => {
      const matches = fileContent.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        features.riskyAPIs.push({
          type,
          severity,
          count: matches.length,
          file: path.basename(filePath)
        });
      }
    });

    // Check for obfuscation indicators
    features.obfuscated = this.detectObfuscation(fileContent);

    // Check for remote code downloads
    features.downloadsRemote = /https?:\/\/.*\.(js|json)/.test(fileContent);

    return features;
  },

  /**
   * Detect code obfuscation
   */
  detectObfuscation(code) {
    const obfuscationIndicators = [
      /[a-zA-Z]{1,2}\s*=\s*['"][a-zA-Z0-9+/=]{50,}['"]/, // Long base64-like strings
      /_0x[a-f0-9]+/, // Hex variable names
      /\.charCodeAt\(|\.fromCharCode\(/, // Character code manipulation
      code.length > 10000 && code.split('\n').length < 10, // Very long single lines
      /eval\(.*atob\(|btoa\(.*eval\(/ // Base64 + eval combination
    ];

    return obfuscationIndicators.some(indicator => 
      typeof indicator === 'boolean' ? indicator : indicator.test(code)
    );
  },

  /**
   * Analyze package.json for suspicious scripts
   */
  async analyzePackageJson(packageSourcePath) {
    const packageJsonPath = path.join(packageSourcePath, 'package.json');
    
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      const features = {
        hasInstallScripts: false,
        installScripts: [],
        suspiciousScripts: []
      };

      if (packageJson.scripts) {
        const installScripts = ['install', 'postinstall', 'preinstall'];
        
        installScripts.forEach(scriptName => {
          if (packageJson.scripts[scriptName]) {
            features.hasInstallScripts = true;
            features.installScripts.push({
              name: scriptName,
              content: packageJson.scripts[scriptName]
            });

            // Check for suspicious patterns in install scripts
            const scriptContent = packageJson.scripts[scriptName];
            if (/curl|wget|fetch|download/i.test(scriptContent)) {
              features.suspiciousScripts.push({
                script: scriptName,
                reason: 'Downloads external content'
              });
            }
          }
        });
      }

      return features;
    } catch (error) {
      return {
        hasInstallScripts: false,
        installScripts: [],
        suspiciousScripts: [],
        error: error.message
      };
    }
  },

  /**
   * Calculate code metrics
   */
  async calculateCodeMetrics(packageSourcePath) {
    const jsFiles = await this.findJavaScriptFiles(packageSourcePath);
    
    let totalLines = 0;
    let totalFiles = jsFiles.length;
    let totalSize = 0;

    for (const filePath of jsFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const stats = await fs.stat(filePath);
        
        totalLines += content.split('\n').length;
        totalSize += stats.size;
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return {
      totalFiles,
      totalLines,
      totalSize,
      averageLinesPerFile: totalFiles > 0 ? totalLines / totalFiles : 0,
      averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0
    };
  },

  /**
   * Extract static analysis features for a package
   */
  async extractStaticAnalysisFeatures(packageName, version, tarballUrl) {
    let packageSourcePath = null;

    try {
      // Download and extract package
      packageSourcePath = await this.downloadPackageSource(packageName, version, tarballUrl);

      // Analyze package.json
      const packageJsonAnalysis = await this.analyzePackageJson(packageSourcePath);

      // Find and analyze JavaScript files
      const jsFiles = await this.findJavaScriptFiles(packageSourcePath);
      const fileAnalyses = [];

      for (const filePath of jsFiles.slice(0, 100)) { // Limit to first 100 files
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const analysis = this.analyzeJavaScriptFile(filePath, content);
          fileAnalyses.push(analysis);
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Aggregate file analyses
      const aggregatedFeatures = {
        riskyAPIs: [],
        obfuscatedCode: false,
        downloadsRemoteCode: false,
        suspiciousPatterns: []
      };

      fileAnalyses.forEach(analysis => {
        aggregatedFeatures.riskyAPIs.push(...analysis.riskyAPIs);
        if (analysis.obfuscated) aggregatedFeatures.obfuscatedCode = true;
        if (analysis.downloadsRemote) aggregatedFeatures.downloadsRemoteCode = true;
      });

      // Calculate code metrics
      const codeMetrics = await this.calculateCodeMetrics(packageSourcePath);

      return {
        ...packageJsonAnalysis,
        ...aggregatedFeatures,
        codeMetrics,
        filesAnalyzed: jsFiles.length,
        collectedAt: new Date().toISOString()
      };
    } finally {
      // Cleanup
      if (packageSourcePath) {
        await this.cleanupTempDirectory(path.dirname(packageSourcePath));
      }
    }
  }
};

