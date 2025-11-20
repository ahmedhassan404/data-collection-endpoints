/**
 * ChainGuard Data Collection Resources Configuration
 * 
 * This file documents all data sources, APIs, and endpoints used for data collection
 * in the ChainGuard ML pipeline.
 */

export const dataCollectionResources = {
  /**
   * Package Registry & Metadata Sources
   */
  packageRegistry: {
    npmRegistry: {
      name: 'npm Registry API',
      baseUrl: 'https://registry.npmjs.org',
      endpoints: {
        packageMetadata: '{baseUrl}/{packageName}',
        packageVersion: '{baseUrl}/{packageName}/{version}',
        search: '{baseUrl}/-/v1/search'
      },
      rateLimit: {
        requestsPerMinute: 100,
        description: 'npm registry allows ~100 requests/minute'
      },
      authentication: {
        required: false,
        note: 'No authentication required for public packages'
      },
      updateFrequency: 'Real-time',
      documentation: 'https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md'
    },
    npmDownloads: {
      name: 'npm Download Statistics API',
      baseUrl: 'https://api.npmjs.org',
      endpoints: {
        lastMonth: '{baseUrl}/downloads/point/last-month/{packageName}',
        lastWeek: '{baseUrl}/downloads/point/last-week/{packageName}',
        lastDay: '{baseUrl}/downloads/point/last-day/{packageName}',
        range: '{baseUrl}/downloads/range/{startDate}:{endDate}/{packageName}'
      },
      rateLimit: {
        requestsPerMinute: 100
      },
      authentication: {
        required: false
      },
      updateFrequency: 'Daily',
      documentation: 'https://github.com/npm/registry/blob/master/docs/download-counts.md'
    }
  },

  /**
   * Vulnerability Database Sources
   */
  vulnerabilityDatabases: {
    nvd: {
      name: 'National Vulnerability Database (NVD)',
      baseUrl: 'https://services.nvd.nist.gov',
      endpoints: {
        cves: '{baseUrl}/rest/json/cves/2.0',
        cve: '{baseUrl}/rest/json/cves/2.0?cveId={cveId}'
      },
      rateLimit: {
        requestsPer30Seconds: 5,
        description: 'NVD allows 5 requests per 30 seconds'
      },
      authentication: {
        required: false,
        note: 'API key recommended for higher rate limits'
      },
      updateFrequency: 'Daily',
      documentation: 'https://nvd.nist.gov/developers/vulnerabilities'
    },
    osv: {
      name: 'Open Source Vulnerabilities (OSV)',
      baseUrl: 'https://api.osv.dev',
      endpoints: {
        query: '{baseUrl}/v1/query',
        queryBatch: '{baseUrl}/v1/querybatch',
        vuln: '{baseUrl}/v1/vulns/{vulnId}'
      },
      rateLimit: {
        requestsPerMinute: 1000,
        description: 'OSV has generous rate limits'
      },
      authentication: {
        required: false
      },
      updateFrequency: 'Real-time',
      documentation: 'https://google.github.io/osv.dev/'
    },
    githubAdvisories: {
      name: 'GitHub Security Advisories',
      baseUrl: 'https://api.github.com',
      endpoints: {
        advisories: '{baseUrl}/advisories',
        repositoryAdvisories: '{baseUrl}/repos/{owner}/{repo}/security-advisories',
        advisory: '{baseUrl}/advisories/{ghsaId}'
      },
      rateLimit: {
        requestsPerHour: 5000,
        description: '5000 requests/hour when authenticated'
      },
      authentication: {
        required: true,
        type: 'GitHub Personal Access Token',
        note: 'Token required for higher rate limits and access to private advisories'
      },
      updateFrequency: 'Real-time',
      documentation: 'https://docs.github.com/en/rest/security-advisories'
    },
    npmAudit: {
      name: 'npm Audit',
      type: 'command',
      command: 'npm audit --json',
      description: 'Run npm audit programmatically using child_process',
      rateLimit: {
        note: 'Limited by npm registry rate limits'
      },
      authentication: {
        required: false
      },
      updateFrequency: 'Real-time',
      documentation: 'https://docs.npmjs.com/cli/v8/commands/npm-audit'
    },
    ossIndex: {
      name: 'OSS Index (Sonatype)',
      baseUrl: 'https://ossindex.sonatype.org',
      endpoints: {
        componentReport: '{baseUrl}/api/v3/component-report'
      },
      rateLimit: {
        requestsPerMinute: 100,
        description: 'Rate limits apply, check documentation'
      },
      authentication: {
        required: true,
        type: 'Basic Auth',
        note: 'Requires username and API token'
      },
      updateFrequency: 'Daily',
      documentation: 'https://ossindex.sonatype.org/doc/rest-api-v3'
    }
  },

  /**
   * Code Repository & Source Analysis Sources
   */
  codeRepositories: {
    github: {
      name: 'GitHub API',
      baseUrl: 'https://api.github.com',
      endpoints: {
        repository: '{baseUrl}/repos/{owner}/{repo}',
        commits: '{baseUrl}/repos/{owner}/{repo}/commits',
        commitActivity: '{baseUrl}/repos/{owner}/{repo}/stats/commit_activity',
        contributors: '{baseUrl}/repos/{owner}/{repo}/contributors',
        issues: '{baseUrl}/repos/{owner}/{repo}/issues',
        pulls: '{baseUrl}/repos/{owner}/{repo}/pulls',
        releases: '{baseUrl}/repos/{owner}/{repo}/releases',
        contents: '{baseUrl}/repos/{owner}/{repo}/contents/{path}'
      },
      rateLimit: {
        requestsPerHour: 5000,
        description: '5000 requests/hour when authenticated'
      },
      authentication: {
        required: true,
        type: 'GitHub Personal Access Token',
        note: 'Recommended for higher rate limits'
      },
      updateFrequency: 'Real-time',
      documentation: 'https://docs.github.com/en/rest'
    },
    packageTarballs: {
      name: 'npm Package Tarballs',
      baseUrl: 'https://registry.npmjs.org',
      endpoint: '{baseUrl}/{packageName}/-/{packageName}-{version}.tgz',
      description: 'Direct download of package source code tarballs',
      rateLimit: {
        requestsPerMinute: 100
      },
      authentication: {
        required: false
      },
      updateFrequency: 'Real-time',
      documentation: 'https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md'
    }
  },

  /**
   * Malicious Package Sources (Training Data)
   */
  maliciousPackageSources: {
    npmSecurityAdvisories: {
      name: 'npm Security Advisories',
      description: 'Official npm security reports and removed packages',
      source: 'npm registry security API',
      updateFrequency: 'Real-time',
      note: 'Monitor npm registry for package removals with security reasons'
    },
    githubMalwareAdvisories: {
      name: 'GitHub Security Advisories (Malware)',
      baseUrl: 'https://api.github.com',
      endpoint: '{baseUrl}/advisories?type=malware',
      description: 'Known malicious packages reported to GitHub',
      updateFrequency: 'Daily',
      authentication: {
        required: true,
        type: 'GitHub Personal Access Token'
      }
    },
    osvMalware: {
      name: 'OSV Database (Malware Indicators)',
      baseUrl: 'https://api.osv.dev',
      endpoint: '{baseUrl}/v1/query',
      description: 'OSV may have packages marked as malicious or with specific vulnerability types',
      updateFrequency: 'Daily',
      authentication: {
        required: false
      }
    },
    researchDatasets: {
      name: 'Research Datasets',
      sources: [
        {
          name: 'Backstabber\'s Knife Collection',
          url: 'https://github.com/backstabbers-knife-collection/backstabbers-knife-collection',
          description: 'Collection of known malicious npm packages'
        }
      ],
      updateFrequency: 'Static/On-demand',
      note: 'Academic malware research papers and datasets'
    },
    communityReports: {
      name: 'Community Security Reports',
      description: 'Security researcher blogs, npm security team announcements, dependency security mailing lists',
      updateFrequency: 'On-demand',
      note: 'Requires manual curation'
    }
  },

  /**
   * Benign Package Sources (Training Data)
   */
  benignPackageSources: {
    topDownloaded: {
      name: 'Top Downloaded Packages',
      source: 'npm download statistics API',
      description: 'Most popular packages (low likelihood of being malicious)',
      endpoint: 'https://api.npmjs.org/downloads/point/last-month/{packageName}',
      updateFrequency: 'Daily'
    },
    verifiedOrganizations: {
      name: 'Verified Organization Packages',
      organizations: [
        '@microsoft',
        '@google',
        '@facebook',
        '@aws',
        '@google-cloud',
        '@angular',
        '@nestjs',
        '@types',
        '@babel',
        '@eslint'
      ],
      description: 'Packages from verified npm organizations',
      updateFrequency: 'On-demand'
    },
    stablePackages: {
      name: 'Stable Packages',
      criteria: {
        age: '>2 years',
        updateFrequency: 'Regular updates',
        maintainers: 'Multiple maintainers'
      },
      description: 'Packages with long history and regular updates',
      updateFrequency: 'Weekly'
    },
    curatedSafePackages: {
      name: 'Manually Curated Safe Packages',
      examples: [
        'lodash', 'underscore', 'ramda',
        'express', 'koa', 'fastify',
        'fs', 'path', 'http', 'https', 'crypto', 'util', 'events'
      ],
      description: 'Core Node.js ecosystem and well-known utility packages',
      updateFrequency: 'Manual'
    }
  },

  /**
   * Collection Tools & Libraries
   */
  tools: {
    httpClients: {
      axios: {
        name: 'axios',
        description: 'HTTP requests with retry logic',
        npm: 'axios'
      },
      nodeFetch: {
        name: 'node-fetch',
        description: 'Lightweight HTTP client',
        npm: 'node-fetch'
      },
      got: {
        name: 'got',
        description: 'Advanced HTTP client',
        npm: 'got'
      }
    },
    packageAnalysis: {
      babelParser: {
        name: '@babel/parser',
        description: 'JavaScript code parsing',
        npm: '@babel/parser'
      },
      babelTraverse: {
        name: '@babel/traverse',
        description: 'AST traversal for static analysis',
        npm: '@babel/traverse'
      },
      tar: {
        name: 'tar',
        description: 'Tarball extraction',
        npm: 'tar'
      },
      jsYaml: {
        name: 'js-yaml',
        description: 'YAML parsing for pnpm lock files',
        npm: 'js-yaml'
      }
    },
    scheduling: {
      nodeCron: {
        name: 'node-cron',
        description: 'Scheduled collection jobs',
        npm: 'node-cron'
      },
      bull: {
        name: 'bull',
        description: 'Job queues for processing',
        npm: 'bull'
      },
      agenda: {
        name: 'agenda',
        description: 'Job queues for processing',
        npm: 'agenda'
      },
      pm2: {
        name: 'pm2',
        description: 'Process management',
        npm: 'pm2'
      }
    },
    database: {
      postgresql: {
        name: 'PostgreSQL',
        description: 'Primary data storage',
        npm: 'pg'
      },
      redis: {
        name: 'Redis',
        description: 'Caching and job queues',
        npm: 'redis'
      },
      elasticsearch: {
        name: 'Elasticsearch',
        description: 'Search and analytics (optional)',
        npm: '@elastic/elasticsearch'
      }
    }
  },

  /**
   * Rate Limiting & Best Practices
   */
  rateLimiting: {
    strategies: {
      exponentialBackoff: {
        description: 'Implement retry with exponential backoff',
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000
      },
      requestQueue: {
        description: 'Queue requests to respect rate limits',
        implementation: 'Use job queue (bull/agenda)'
      },
      caching: {
        description: 'Cache responses when possible',
        ttl: 'Varies by data source'
      }
    },
    respectfulCollection: {
      userAgent: 'Add proper User-Agent headers',
      scheduling: 'Schedule intensive collections during off-peak hours',
      monitoring: 'Monitor your own API usage'
    }
  },

  /**
   * Monitoring & Health Checks
   */
  monitoring: {
    healthChecks: {
      npmStatus: 'https://status.npmjs.org/',
      githubStatus: 'https://www.githubstatus.com/',
      nvdStatus: 'Monitor response times and error rates'
    },
    metrics: {
      successFailureRates: 'Track per data source',
      dataFreshness: 'Last collection timestamp',
      apiQuotaUsage: 'Monitor API quota consumption',
      processingTime: 'Time per package collection'
    }
  },

  /**
   * Environment Variables Required
   */
  environmentVariables: {
    GITHUB_TOKEN: {
      description: 'GitHub Personal Access Token for API access',
      required: true,
      note: 'Required for GitHub API and Security Advisories'
    },
    OSS_INDEX_USERNAME: {
      description: 'OSS Index username',
      required: false,
      note: 'Required for OSS Index API'
    },
    OSS_INDEX_TOKEN: {
      description: 'OSS Index API token',
      required: false,
      note: 'Required for OSS Index API'
    },
    NVD_API_KEY: {
      description: 'NVD API key (optional)',
      required: false,
      note: 'Recommended for higher rate limits'
    },
    COLLECT_STATIC_ANALYSIS: {
      description: 'Enable static code analysis collection',
      required: false,
      default: 'false',
      note: 'Set to "true" to enable (can be expensive)'
    }
  }
};

/**
 * Helper function to get endpoint URL
 */
export function getEndpoint(resource, endpointKey, params = {}) {
  const resourceConfig = findResource(resource);
  if (!resourceConfig || !resourceConfig.endpoints || !resourceConfig.endpoints[endpointKey]) {
    throw new Error(`Endpoint ${endpointKey} not found in resource ${resource}`);
  }

  let url = resourceConfig.endpoints[endpointKey];
  
  // Replace baseUrl placeholder
  if (resourceConfig.baseUrl) {
    url = url.replace('{baseUrl}', resourceConfig.baseUrl);
  }
  
  // Replace parameter placeholders
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });

  return url;
}

/**
 * Helper function to find resource configuration
 */
function findResource(resourcePath) {
  const parts = resourcePath.split('.');
  let current = dataCollectionResources;
  
  for (const part of parts) {
    if (current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Get all API endpoints for a resource category
 */
export function getResourceEndpoints(category) {
  const categoryData = dataCollectionResources[category];
  if (!categoryData) {
    return [];
  }

  const endpoints = [];
  
  Object.entries(categoryData).forEach(([key, resource]) => {
    if (resource.endpoints) {
      Object.entries(resource.endpoints).forEach(([endpointKey, endpoint]) => {
        endpoints.push({
          resource: key,
          endpoint: endpointKey,
          url: endpoint,
          baseUrl: resource.baseUrl,
          rateLimit: resource.rateLimit,
          authentication: resource.authentication
        });
      });
    }
  });

  return endpoints;
}

export default dataCollectionResources;

