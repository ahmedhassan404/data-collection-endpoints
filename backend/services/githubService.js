/**
 * Service for fetching data from GitHub API
 * 
 * Real implementation fetches:
 * - Repository metadata (stars, forks, issues)
 * - Commit activity
 * - Contributor information
 * - Security advisories
 */

import axios from 'axios';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Extract GitHub repository path from npm package repository URL
 */
function extractRepoPath(repositoryUrl) {
  if (!repositoryUrl) return null;

  // Handle different repository URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/
  ];

  for (const pattern of patterns) {
    const match = repositoryUrl.match(pattern);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }

  return null;
}

export const githubService = {
  /**
   * Fetch repository metadata
   */
  async fetchRepositoryInfo(repoPath) {
    if (!repoPath) {
      return { hasRepository: false };
    }

    try {
      const response = await apiCallWithRetry(
        () => axios.get(`${GITHUB_API_BASE}/repos/${repoPath}`, {
          headers: {
            'Authorization': process.env.GITHUB_TOKEN 
              ? `token ${process.env.GITHUB_TOKEN}` 
              : undefined,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          }
        }),
        { maxRetries: 3 }
      );

      return {
        hasRepository: true,
        repository: {
          url: response.data.html_url,
          path: repoPath,
          stars: response.data.stargazers_count,
          forks: response.data.forks_count,
          watchers: response.data.watchers_count,
          openIssues: response.data.open_issues_count,
          language: response.data.language,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          pushedAt: response.data.pushed_at,
          description: response.data.description,
          homepage: response.data.homepage,
          license: response.data.license?.name
        }
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { hasRepository: false, error: 'Repository not found' };
      }
      throw error;
    }
  },

  /**
   * Fetch commit activity statistics
   */
  async fetchCommitActivity(repoPath) {
    if (!repoPath) return null;

    try {
      const response = await apiCallWithRetry(
        () => axios.get(`${GITHUB_API_BASE}/repos/${repoPath}/stats/commit_activity`, {
          headers: {
            'Authorization': process.env.GITHUB_TOKEN 
              ? `token ${process.env.GITHUB_TOKEN}` 
              : undefined,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          }
        }),
        { maxRetries: 3 }
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        const totalCommits = response.data.reduce((sum, week) => sum + week.total, 0);
        const averageCommitsPerWeek = totalCommits / response.data.length;

        return {
          totalCommits: totalCommits,
          averageCommitsPerWeek: averageCommitsPerWeek,
          weeks: response.data.length,
          lastWeekCommits: response.data[response.data.length - 1]?.total || 0
        };
      }

      return null;
    } catch (error) {
      console.warn(`Error fetching commit activity for ${repoPath}:`, error.message);
      return null;
    }
  },

  /**
   * Fetch contributor information
   */
  async fetchContributors(repoPath) {
    if (!repoPath) return null;

    try {
      const response = await apiCallWithRetry(
        () => axios.get(`${GITHUB_API_BASE}/repos/${repoPath}/contributors`, {
          headers: {
            'Authorization': process.env.GITHUB_TOKEN 
              ? `token ${process.env.GITHUB_TOKEN}` 
              : undefined,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          },
          params: {
            per_page: 100
          }
        }),
        { maxRetries: 3 }
      );

      return {
        contributorCount: response.data.length,
        contributors: response.data.map(contributor => ({
          username: contributor.login,
          contributions: contributor.contributions
        }))
      };
    } catch (error) {
      console.warn(`Error fetching contributors for ${repoPath}:`, error.message);
      return null;
    }
  },

  /**
   * Fetch security advisories for a repository
   */
  async fetchSecurityAdvisories(repoPath) {
    if (!repoPath || !process.env.GITHUB_TOKEN) {
      return [];
    }

    try {
      const response = await apiCallWithRetry(
        () => axios.get(`${GITHUB_API_BASE}/repos/${repoPath}/security-advisories`, {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ChainGuard-DataCollector/1.0'
          }
        }),
        { maxRetries: 3 }
      );

      return response.data.map(advisory => ({
        ghsaId: advisory.ghsa_id,
        cveId: advisory.cve_id,
        summary: advisory.summary,
        severity: advisory.severity,
        publishedAt: advisory.published_at,
        updatedAt: advisory.updated_at
      }));
    } catch (error) {
      console.warn(`Error fetching security advisories for ${repoPath}:`, error.message);
      return [];
    }
  },

  /**
   * Extract repository path from package metadata
   */
  extractRepoPathFromPackage(repository) {
    if (!repository) return null;

    const url = typeof repository === 'string' 
      ? repository 
      : repository.url;

    return extractRepoPath(url);
  },

  /**
   * Get comprehensive GitHub data for a package
   */
  async getPackageGitHubData(packageMetadata) {
    const repoPath = this.extractRepoPathFromPackage(packageMetadata.repository);

    if (!repoPath) {
      return { hasRepository: false };
    }

    const [repoInfo, commitActivity, contributors, advisories] = await Promise.all([
      this.fetchRepositoryInfo(repoPath),
      this.fetchCommitActivity(repoPath),
      this.fetchContributors(repoPath),
      this.fetchSecurityAdvisories(repoPath)
    ]);

    return {
      ...repoInfo,
      activity: {
        commitActivity,
        contributors
      },
      securityAdvisories: advisories
    };
  }
};

