/**
 * Service for fetching comprehensive npm registry data
 * 
 * Fetches from npm registry API and GitHub API
 */

import { metadataService } from './metadataService.js';
import { githubService } from './githubService.js';
import axios from 'axios';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';

const NPM_DOWNLOADS_BASE = 'https://api.npmjs.org';

export const registryService = {
  /**
   * Fetch comprehensive registry data
   */
  async fetchFromNpmRegistry(packageName) {
    return metadataService.fetchFromNpmRegistry(packageName, 'latest');
  },

  /**
   * Fetch download statistics
   */
  async fetchDownloadStats(packageName) {
    try {
      const [lastMonth, lastWeek, lastDay] = await Promise.all([
        rateLimiters.npm.makeRequest(() =>
          apiCallWithRetry(
            () => axios.get(`${NPM_DOWNLOADS_BASE}/downloads/point/last-month/${packageName}`, {
              headers: { 'User-Agent': 'ChainGuard-DataCollector/1.0' }
            }),
            { maxRetries: 2 }
          )
        ).catch(() => ({ data: { downloads: 0 } })),
        rateLimiters.npm.makeRequest(() =>
          apiCallWithRetry(
            () => axios.get(`${NPM_DOWNLOADS_BASE}/downloads/point/last-week/${packageName}`, {
              headers: { 'User-Agent': 'ChainGuard-DataCollector/1.0' }
            }),
            { maxRetries: 2 }
          )
        ).catch(() => ({ data: { downloads: 0 } })),
        rateLimiters.npm.makeRequest(() =>
          apiCallWithRetry(
            () => axios.get(`${NPM_DOWNLOADS_BASE}/downloads/point/last-day/${packageName}`, {
              headers: { 'User-Agent': 'ChainGuard-DataCollector/1.0' }
            }),
            { maxRetries: 2 }
          )
        ).catch(() => ({ data: { downloads: 0 } }))
      ]);

      return {
        lastDay: lastDay.data.downloads || 0,
        lastWeek: lastWeek.data.downloads || 0,
        lastMonth: lastMonth.data.downloads || 0,
        total: null // Not available from this API
      };
    } catch (error) {
      return { lastDay: 0, lastWeek: 0, lastMonth: 0, total: null };
    }
  },

  /**
   * Get comprehensive registry data
   */
  async getRegistryData(packageName) {
    const metadata = await this.fetchFromNpmRegistry(packageName);
    const downloadStats = await this.fetchDownloadStats(packageName);
    
    // Get GitHub data if repository is available
    let githubData = null;
    if (metadata.repository) {
      try {
        const githubInfo = await githubService.getPackageGitHubData(metadata);
        if (githubInfo.hasRepository && githubInfo.repository) {
          githubData = githubInfo.repository;
        }
      } catch (error) {
        // GitHub data is optional
      }
    }

    // Extract version list and release history
    const allVersions = Object.keys(metadata.versions || {}).sort((a, b) => {
      const timeA = metadata.time?.[a];
      const timeB = metadata.time?.[b];
      return timeB ? timeA ? new Date(timeB) - new Date(timeA) : 1 : -1;
    });

    const releaseHistory = allVersions.slice(0, 10).map(version => ({
      version,
      published: metadata.time?.[version] || metadata.time?.modified
    }));

    return {
      package: {
        name: packageName,
        latestVersion: metadata.version,
        description: metadata.description
      },
      versions: {
        total: allVersions.length,
        latest: metadata.version,
        all: allVersions.slice(0, 50), // Limit to first 50
        releaseHistory
      },
      downloadStats,
      repository: {
        type: metadata.repository?.type || 'git',
        url: typeof metadata.repository === 'string' 
          ? metadata.repository 
          : metadata.repository?.url,
        github: githubData
      },
      maintainers: metadata.maintainers || [],
      metadata: {
        created: metadata.time?.created,
        modified: metadata.time?.modified,
        keywords: metadata.keywords || [],
        homepage: metadata.homepage,
        bugs: metadata.bugs || {},
        license: metadata.license
      },
      time: metadata.time || {}
    };
  }
};

