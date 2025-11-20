/**
 * Service for fetching package metadata
 * 
 * Fetches from npm registry API: https://registry.npmjs.org/{packageName}
 */

import axios from 'axios';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';

const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';
const NPM_DOWNLOADS_BASE = 'https://api.npmjs.org';

export const metadataService = {
  /**
   * Fetch metadata from npm registry
   */
  async fetchFromNpmRegistry(packageName, version = 'latest') {
    try {
      const response = await rateLimiters.npm.makeRequest(() =>
        apiCallWithRetry(
          () => axios.get(`${NPM_REGISTRY_BASE}/${packageName}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'ChainGuard-DataCollector/1.0'
            }
          }),
          { maxRetries: 3 }
        )
      );

      const packageData = response.data;
      
      // Determine version to use
      let targetVersion = version;
      if (version === 'latest' || !version) {
        targetVersion = packageData['dist-tags']?.latest || Object.keys(packageData.versions || {})[0];
      }

      // Get version-specific data
      const versionData = packageData.versions?.[targetVersion];
      if (!versionData && version !== 'latest') {
        throw new Error(`Version ${version} not found for package ${packageName}`);
      }

      // Get download stats
      let downloadStats = { lastMonth: 0, lastWeek: 0, lastDay: 0 };
      try {
        const statsResponse = await rateLimiters.npm.makeRequest(() =>
          apiCallWithRetry(
            () => axios.get(`${NPM_DOWNLOADS_BASE}/downloads/point/last-month/${packageName}`, {
              headers: {
                'User-Agent': 'ChainGuard-DataCollector/1.0'
              }
            }),
            { maxRetries: 2 }
          )
        );
        downloadStats.lastMonth = statsResponse.data.downloads || 0;
      } catch (error) {
        // Download stats are optional, continue without them
      }

      // Normalize license field (can be string, object, or array)
      let license = null;
      if (versionData?.license) {
        if (typeof versionData.license === 'string') {
          license = versionData.license;
        } else if (versionData.license.type) {
          license = versionData.license.type;
        } else if (Array.isArray(versionData.license)) {
          license = versionData.license.map(l => typeof l === 'string' ? l : l.type).join(', ');
        }
      }

      return {
        name: packageData.name,
        version: targetVersion,
        description: versionData?.description || packageData.description || '',
        main: versionData?.main || 'index.js',
        repository: versionData?.repository || packageData.repository,
        homepage: versionData?.homepage || packageData.homepage,
        license: license || packageData.license || 'UNKNOWN',
        keywords: versionData?.keywords || packageData.keywords || [],
        author: versionData?.author || packageData.author,
        maintainers: packageData.maintainers || [],
        versions: packageData.versions || {},
        'dist-tags': packageData['dist-tags'] || {},
        time: packageData.time || {},
        downloadStats,
        readme: packageData.readme || '',
        readmeFilename: packageData.readmeFilename || 'README.md'
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Package ${packageName} not found`);
      }
      throw error;
    }
  },

  /**
   * Get metadata (alias for fetchFromNpmRegistry for backward compatibility)
   */
  async getMetadata(packageName, version = 'latest') {
    return this.fetchFromNpmRegistry(packageName, version);
  }
};

