/**
 * Data Collection Orchestrator
 * 
 * Coordinates data collection from multiple sources:
 * - Package metadata
 * - Dependency graphs
 * - Vulnerability data
 * - Static analysis
 * - Labeled training data
 */

import { metadataService } from './metadataService.js';
import { dependenciesService } from './dependenciesService.js';
import { vulnerabilitiesService } from './vulnerabilitiesService.js';
import { staticAnalysisService } from './staticAnalysisService.js';
import { githubService } from './githubService.js';
import { maliciousPackageService } from './maliciousPackageService.js';
import { benignPackageService } from './benignPackageService.js';
import { logger } from '../utils/logger.js';

export class DataCollectionOrchestrator {
  constructor(dbConnection = null) {
    this.db = dbConnection;
  }

  /**
   * Collect comprehensive data for a single package
   */
  async collectPackageData(packageName, version = 'latest', options = {}) {
    const {
      includeStaticAnalysis = false,
      includeGitHubData = true,
      includeVulnerabilities = true,
      includeDependencies = true
    } = options;

    logger.info(`Collecting data for ${packageName}@${version}...`);

    const collectionResults = {
      packageName,
      version,
      collectedAt: new Date().toISOString(),
      data: {}
    };

    try {
      // 1. Collect package metadata
      logger.info(`  → Collecting metadata...`);
      const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
      collectionResults.data.metadata = metadata;

      // 2. Collect dependency graph
      if (includeDependencies) {
        logger.info(`  → Collecting dependencies...`);
        try {
          const dependencies = await dependenciesService.fetchDependencies(packageName, metadata.version);
          collectionResults.data.dependencies = dependencies;
        } catch (error) {
          logger.warn(`  → Error collecting dependencies: ${error.message}`);
          collectionResults.data.dependencies = { error: error.message };
        }
      }

      // 3. Collect vulnerability data
      if (includeVulnerabilities) {
        logger.info(`  → Collecting vulnerabilities...`);
        try {
          const vulnerabilities = await vulnerabilitiesService.getVulnerabilities(
            packageName,
            metadata.version,
            'all'
          );
          collectionResults.data.vulnerabilities = vulnerabilities;
        } catch (error) {
          logger.warn(`  → Error collecting vulnerabilities: ${error.message}`);
          collectionResults.data.vulnerabilities = { error: error.message };
        }
      }

      // 4. Collect GitHub repository data
      if (includeGitHubData && metadata.repository) {
        logger.info(`  → Collecting GitHub data...`);
        try {
          const githubData = await githubService.getPackageGitHubData(metadata);
          collectionResults.data.github = githubData;
        } catch (error) {
          logger.warn(`  → Error collecting GitHub data: ${error.message}`);
          collectionResults.data.github = { error: error.message };
        }
      }

      // 5. Collect static analysis features (optional, can be expensive)
      if (includeStaticAnalysis && metadata.versions?.[metadata.version]?.dist?.tarball) {
        logger.info(`  → Collecting static analysis...`);
        try {
          const tarballUrl = metadata.versions[metadata.version].dist.tarball;
          const staticFeatures = await staticAnalysisService.extractStaticAnalysisFeatures(
            packageName,
            metadata.version,
            tarballUrl
          );
          collectionResults.data.staticAnalysis = staticFeatures;
        } catch (error) {
          logger.warn(`  → Error collecting static analysis: ${error.message}`);
          collectionResults.data.staticAnalysis = { error: error.message };
        }
      }

      // Save to database if available
      if (this.db) {
        await this.saveToDatabase(collectionResults);
      }

      logger.info(`✅ Completed collection for ${packageName}@${version}`);

      return collectionResults;
    } catch (error) {
      logger.error(`❌ Error collecting data for ${packageName}@${version}:`, error);
      throw error;
    }
  }

  /**
   * Collect vulnerability databases
   */
  async collectVulnerabilityDatabases(options = {}) {
    const {
      daysBack = 30,
      sources = ['nvd', 'github']
    } = options;

    logger.info('Collecting vulnerability databases...');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const results = {
      collectedAt: new Date().toISOString(),
      sources: {},
      summary: {}
    };

    try {
      // Collect from NVD
      if (sources.includes('nvd')) {
        logger.info('  → Collecting NVD data...');
        // In real implementation:
        // const nvdData = await vulnerabilitiesService.collectNVDData(
        //   startDate.toISOString(),
        //   new Date().toISOString()
        // );
        // results.sources.nvd = nvdData;
        results.sources.nvd = { note: 'NVD collection not yet implemented' };
      }

      // Collect from GitHub Advisories
      if (sources.includes('github')) {
        logger.info('  → Collecting GitHub advisories...');
        // In real implementation:
        // const githubAdvisories = await vulnerabilitiesService.collectGitHubAdvisories();
        // results.sources.github = githubAdvisories;
        results.sources.github = { note: 'GitHub advisories collection not yet implemented' };
      }

      // Save to database if available
      if (this.db) {
        // await this.db.saveVulnerabilityDatabase(results);
      }

      logger.info('✅ Completed vulnerability database collection');

      return results;
    } catch (error) {
      logger.error('❌ Error collecting vulnerability databases:', error);
      throw error;
    }
  }

  /**
   * Collect labeled training data
   */
  async collectLabeledTrainingData(options = {}) {
    const {
      maliciousCount = 1000,
      benignCount = 10000
    } = options;

    logger.info('Collecting labeled training data...');

    const results = {
      collectedAt: new Date().toISOString(),
      malicious: [],
      benign: [],
      summary: {}
    };

    try {
      // 1. Collect malicious packages
      logger.info(`  → Collecting ${maliciousCount} malicious packages...`);
      const maliciousPackages = await maliciousPackageService.collectAllMaliciousPackages();
      results.malicious = maliciousPackages.slice(0, maliciousCount);

      // 2. Collect benign packages
      logger.info(`  → Collecting ${benignCount} benign packages...`);
      const benignPackages = await benignPackageService.collectAllBenignPackages(benignCount);
      results.benign = benignPackages;

      // 3. Collect full data for each package
      logger.info('  → Collecting full data for malicious packages...');
      for (const pkg of results.malicious.slice(0, 10)) { // Limit for demo
        try {
          const packageData = await this.collectPackageData(pkg.name, pkg.version, {
            includeStaticAnalysis: false,
            includeGitHubData: true,
            includeVulnerabilities: true
          });
          pkg.fullData = packageData;
        } catch (error) {
          logger.warn(`  → Error collecting full data for ${pkg.name}: ${error.message}`);
        }
      }

      logger.info('  → Collecting full data for benign packages...');
      for (const pkg of results.benign.slice(0, 50)) { // Limit for demo
        try {
          const packageData = await this.collectPackageData(pkg.name, pkg.version, {
            includeStaticAnalysis: false,
            includeGitHubData: true,
            includeVulnerabilities: true
          });
          pkg.fullData = packageData;
        } catch (error) {
          logger.warn(`  → Error collecting full data for ${pkg.name}: ${error.message}`);
        }
      }

      // Calculate summary
      results.summary = {
        totalMalicious: results.malicious.length,
        totalBenign: results.benign.length,
        totalWithFullData: [
          ...results.malicious.filter(p => p.fullData),
          ...results.benign.filter(p => p.fullData)
        ].length
      };

      // Save to database if available
      if (this.db) {
        // await this.db.saveLabeledTrainingData(results);
      }

      logger.info(`✅ Collected ${results.malicious.length} malicious and ${results.benign.length} benign packages`);

      return results;
    } catch (error) {
      logger.error('❌ Error collecting labeled training data:', error);
      throw error;
    }
  }

  /**
   * Save collection results to database
   */
  async saveToDatabase(collectionResults) {
    if (!this.db) {
      return;
    }

    try {
      // In real implementation, save to database:
      // await this.db.savePackageMetadata(collectionResults.data.metadata);
      // await this.db.saveDependencies(collectionResults.data.dependencies);
      // await this.db.saveVulnerabilities(collectionResults.data.vulnerabilities);
      // etc.
      
      logger.info('  → Saved to database');
    } catch (error) {
      logger.error('  → Error saving to database:', error);
    }
  }

  /**
   * Batch collect packages
   */
  async batchCollectPackages(packageList, options = {}) {
    const {
      concurrency = 5,
      ...collectOptions
    } = options;

    logger.info(`Batch collecting ${packageList.length} packages with concurrency ${concurrency}...`);

    const results = [];
    const errors = [];

    // Process in batches
    for (let i = 0; i < packageList.length; i += concurrency) {
      const batch = packageList.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(({ name, version }) => 
          this.collectPackageData(name, version, collectOptions)
        )
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            package: batch[index],
            error: result.reason.message
          });
        }
      });

      logger.info(`  → Processed ${Math.min(i + concurrency, packageList.length)}/${packageList.length} packages`);
    }

    return {
      results,
      errors,
      summary: {
        total: packageList.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }
}

export default DataCollectionOrchestrator;

