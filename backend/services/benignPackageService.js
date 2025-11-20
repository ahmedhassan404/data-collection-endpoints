/**
 * Service for collecting known benign/safe packages
 * 
 * Sources:
 * - Top downloaded packages
 * - Verified organization packages
 * - Stable packages with long history
 * - Manually curated safe packages
 */

import axios from 'axios';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';

const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';
const NPM_DOWNLOADS_BASE = 'https://api.npmjs.org';

export const benignPackageService = {
  /**
   * Popular packages list (top downloaded)
   */
  popularPackages: [
    'lodash', 'express', 'react', 'axios', 'moment', 'async',
    'chalk', 'commander', 'debug', 'fs-extra', 'glob', 'inquirer',
    'minimist', 'mkdirp', 'rimraf', 'semver', 'uuid', 'yargs',
    'winston', 'dotenv', 'cors', 'body-parser', 'cookie-parser',
    'helmet', 'morgan', 'compression', 'serve-static'
  ],

  /**
   * Verified organizations
   */
  verifiedOrganizations: [
    '@microsoft', '@google', '@facebook', '@aws', '@google-cloud',
    '@angular', '@nestjs', '@types', '@babel', '@eslint'
  ],

  /**
   * Manually curated safe packages
   */
  curatedSafePackages: [
    // Core Node.js (built-in)
    'fs', 'path', 'http', 'https', 'crypto', 'util', 'events', 'stream',
    // Well-known utilities
    'lodash', 'underscore', 'ramda',
    // Popular frameworks
    'express', 'koa', 'fastify', 'hapi',
    // Popular libraries
    'axios', 'node-fetch', 'request'
  ],

  /**
   * Get top downloaded packages
   */
  async getTopDownloadedPackages(limit = 100) {
    const packages = [];

    // Use known popular packages list
    for (const packageName of this.popularPackages.slice(0, limit)) {
      try {
        const downloadStats = await this.getDownloadStats(packageName);
        const latestVersion = await this.getLatestVersion(packageName);

        packages.push({
          name: packageName,
          version: latestVersion,
          label: 'benign',
          source: 'top-downloaded',
          downloadCount: downloadStats.lastMonth || 0,
          confidence: 'high'
        });
      } catch (error) {
        console.warn(`Error getting data for ${packageName}:`, error.message);
      }
    }

    return packages;
  },

  /**
   * Get download statistics for a package
   */
  async getDownloadStats(packageName) {
    try {
      const response = await apiCallWithRetry(
        () => axios.get(`${NPM_DOWNLOADS_BASE}/downloads/point/last-month/${packageName}`, {
          headers: {
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          }
        }),
        { maxRetries: 3 }
      );

      return {
        lastMonth: response.data.downloads || 0,
        collectedAt: new Date().toISOString()
      };
    } catch (error) {
      return { lastMonth: 0, error: error.message };
    }
  },

  /**
   * Get latest version of a package
   */
  async getLatestVersion(packageName) {
    try {
      const response = await apiCallWithRetry(
        () => axios.get(`${NPM_REGISTRY_BASE}/${packageName}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          }
        }),
        { maxRetries: 3 }
      );

      return response.data['dist-tags']?.latest || 'latest';
    } catch (error) {
      return 'latest';
    }
  },

  /**
   * Get packages from verified organizations
   */
  async getVerifiedOrgPackages(limit = 50) {
    const packages = [];

    for (const org of this.verifiedOrganizations) {
      try {
        // Note: npm registry doesn't have a direct API for org packages
        // This would require using npm search or maintaining a list
        // For now, we'll use known packages from these orgs
        
        const orgPackages = this.getKnownOrgPackages(org);
        
        for (const packageName of orgPackages.slice(0, limit / this.verifiedOrganizations.length)) {
          const latestVersion = await this.getLatestVersion(packageName);
          
          packages.push({
            name: packageName,
            version: latestVersion,
            label: 'benign',
            source: 'verified-org',
            organization: org,
            confidence: 'high'
          });
        }
      } catch (error) {
        console.warn(`Error getting packages for org ${org}:`, error.message);
      }
    }

    return packages.slice(0, limit);
  },

  /**
   * Get known packages from organizations
   */
  getKnownOrgPackages(org) {
    const orgPackagesMap = {
      '@microsoft': ['typescript', '@microsoft/typescript'],
      '@google': ['angular', '@angular/core'],
      '@facebook': ['react', 'react-dom'],
      '@aws': ['aws-sdk', '@aws-sdk/client-s3'],
      '@types': ['@types/node', '@types/express'],
      '@babel': ['@babel/core', '@babel/preset-env'],
      '@eslint': ['eslint', '@eslint/js']
    };

    return orgPackagesMap[org] || [];
  },

  /**
   * Get manually curated safe packages
   */
  async getCuratedSafePackages() {
    const packages = [];

    for (const packageName of this.curatedSafePackages) {
      try {
        const latestVersion = await this.getLatestVersion(packageName);
        
        packages.push({
          name: packageName,
          version: latestVersion,
          label: 'benign',
          source: 'manually-curated',
          confidence: 'very-high'
        });
      } catch (error) {
        console.warn(`Error getting curated package ${packageName}:`, error.message);
      }
    }

    return packages;
  },

  /**
   * Collect all benign packages from all sources
   */
  async collectAllBenignPackages(count = 10000) {
    console.log(`Collecting ${count} benign packages from all sources...`);

    const [topPackages, orgPackages, curatedPackages] = await Promise.all([
      this.getTopDownloadedPackages(Math.floor(count * 0.4)),
      this.getVerifiedOrgPackages(Math.floor(count * 0.2)),
      this.getCuratedSafePackages()
    ]);

    // Fill remaining with more top packages if needed
    const remaining = count - topPackages.length - orgPackages.length - curatedPackages.length;
    const additionalTopPackages = remaining > 0 
      ? await this.getTopDownloadedPackages(remaining)
      : [];

    const allPackages = [
      ...topPackages,
      ...orgPackages,
      ...curatedPackages,
      ...additionalTopPackages
    ];

    // Deduplicate
    const seen = new Set();
    const deduplicated = allPackages.filter(pkg => {
      const key = `${pkg.name}@${pkg.version}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    console.log(`Collected ${deduplicated.length} unique benign packages`);

    return deduplicated.slice(0, count);
  }
};

