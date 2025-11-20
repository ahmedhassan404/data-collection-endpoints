/**
 * Resource configurations for data collection endpoints
 * Each resource defines:
 * - id: unique identifier
 * - name: display name
 * - description: what the resource collects
 * - endpoint: API endpoint path
 * - method: HTTP method (default: GET)
 * - params: parameter definitions
 * - defaultParams: default parameter values
 * - realApiInfo: information about real APIs used
 */

export const resources = [
  {
    id: 'metadata',
    name: 'Package Metadata',
    description: 'Collect comprehensive metadata about npm packages including version history, maintainers, and repository information',
    endpoint: '/api/metadata',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: ''
    },
    realApiInfo: {
      source: 'npm Registry API',
      url: 'https://registry.npmjs.org/{packageName}',
      description: 'Fetches package metadata from npm registry including all versions, maintainers, and repository information'
    }
  },
  {
    id: 'dependencies',
    name: 'Dependency Graph',
    description: 'Extract direct dependencies from package.json and build dependency relationships',
    endpoint: '/api/dependencies',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: ''
    },
    realApiInfo: {
      source: 'npm Registry API',
      url: 'https://registry.npmjs.org/{packageName}',
      description: 'Parses package.json from npm registry releases to extract dependencies, devDependencies, and peerDependencies'
    }
  },
  {
    id: 'indirect-dependencies',
    name: 'Indirect Dependencies',
    description: 'Build complete transitive dependency graph with depth analysis',
    endpoint: '/api/dependencies/indirect',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      },
      {
        name: 'depth',
        type: 'number',
        required: false,
        placeholder: 'e.g., 5 (optional)',
        description: 'Maximum depth to traverse (defaults to 5)'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: '',
      depth: '5'
    },
    realApiInfo: {
      source: 'npm Registry Tarball',
      url: 'https://registry.npmjs.org/{packageName}/-/{packageName}-{version}.tgz',
      description: 'Builds complete dependency graph by downloading the package tarball and traversing package-lock.json, yarn.lock, or pnpm-lock.yaml files'
    }
  },
  {
    id: 'vulnerabilities',
    name: 'Vulnerability Data',
    description: 'Aggregate vulnerability information from multiple sources (NVD, OSV, GitHub, npm audit, OSS Index)',
    endpoint: '/api/vulnerabilities',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      },
      {
        name: 'source',
        type: 'select',
        required: false,
        options: ['all', 'nvd', 'osv', 'github', 'npm', 'oss-index'],
        description: 'Filter by vulnerability source'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: '',
      source: 'all'
    },
    realApiInfo: {
      sources: [
        {
          key: 'all',
          name: 'Aggregated Sources',
          url: 'https://api.osv.dev/v1/query',
          description: 'Aggregates vulnerability information from multiple databases'
        },
        {
          key: 'nvd',
          name: 'NVD',
          url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
          description: 'National Vulnerability Database - CVE information'
        },
        {
          key: 'osv',
          name: 'OSV',
          url: 'https://api.osv.dev/v1/query',
          description: 'Open Source Vulnerabilities database'
        },
        {
          key: 'github',
          name: 'GitHub',
          url: 'https://api.github.com/advisories',
          description: 'GitHub Security Advisories'
        },
        {
          key: 'npm',
          name: 'npm audit',
          url: 'https://registry.npmjs.org/-/npm/v1/security/audits',
          description: 'npm security audit results'
        },
        {
          key: 'oss-index',
          name: 'OSS Index',
          url: 'https://ossindex.sonatype.org/api/v3/component-report',
          description: 'Sonatype OSS Index vulnerability database'
        }
      ]
    }
  },
  {
    id: 'license-info',
    name: 'License Information',
    description: 'Extract license information from package.json and analyze license compatibility',
    endpoint: '/api/license-info',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      },
      {
        name: 'includeTransitive',
        type: 'checkbox',
        required: false,
        description: 'Include transitive dependencies licenses'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: '',
      includeTransitive: false
    },
    realApiInfo: {
      source: 'npm Registry API',
      url: 'https://registry.npmjs.org/{packageName}',
      description: 'Extracts license information from package.json, checks LICENSE file, and analyzes license compatibility for transitive dependencies'
    }
  },
  {
    id: 'package-registry',
    name: 'Package Registry Data',
    description: 'Comprehensive npm registry data including download stats, maintainers, and version history',
    endpoint: '/api/package-registry',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      }
    ],
    defaultParams: {
      packageName: 'express'
    },
    realApiInfo: {
      sources: [
        {
          name: 'npm Registry',
          url: 'https://registry.npmjs.org/{packageName}',
          description: 'Package metadata and version history'
        },
        {
          name: 'npm Downloads',
          url: 'https://api.npmjs.org/downloads/point/last-month/{packageName}',
          description: 'Download statistics'
        },
        {
          name: 'GitHub API',
          url: 'https://api.github.com/repos/{owner}/{repo}',
          description: 'Repository statistics (stars, forks, issues)'
        }
      ]
    }
  },
  {
    id: 'sbom',
    name: 'SBOM Generation',
    description: 'Generate Software Bill of Materials (SBOM) in multiple formats (SPDX, CycloneDX, JSON)',
    endpoint: '/api/sbom',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      },
      {
        name: 'format',
        type: 'select',
        required: false,
        options: ['json', 'spdx', 'cyclonedx'],
        description: 'SBOM output format'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: '',
      format: 'json'
    },
    realApiInfo: {
      source: 'npm Registry Tarball',
      url: 'https://registry.npmjs.org/{packageName}/-/{packageName}-{version}.tgz',
      description: 'Generates SBOM by downloading the package tarball, building the dependency tree, and formatting according to SPDX or CycloneDX standards'
    }
  },
  {
    id: 'github',
    name: 'GitHub Repository Data',
    description: 'Collect GitHub repository information including stars, forks, commit activity, contributors, and security advisories',
    endpoint: '/api/github',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: ''
    },
    realApiInfo: {
      sources: [
        {
          name: 'GitHub API',
          url: 'https://api.github.com/repos/{owner}/{repo}',
          description: 'Repository metadata (stars, forks, issues)'
        },
        {
          name: 'GitHub Commit Activity',
          url: 'https://api.github.com/repos/{owner}/{repo}/stats/commit_activity',
          description: 'Commit activity statistics'
        },
        {
          name: 'GitHub Contributors',
          url: 'https://api.github.com/repos/{owner}/{repo}/contributors',
          description: 'Contributor information'
        },
        {
          name: 'GitHub Security Advisories',
          url: 'https://api.github.com/repos/{owner}/{repo}/security-advisories',
          description: 'Repository security advisories'
        }
      ],
      note: 'Requires GITHUB_TOKEN environment variable'
    }
  },
  {
    id: 'static-analysis',
    name: 'Static Code Analysis',
    description: 'Analyze package source code for risky APIs, obfuscation, suspicious patterns, and code metrics',
    endpoint: '/api/static-analysis',
    method: 'GET',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: true,
        placeholder: 'e.g., 4.18.2',
        description: 'Specific version (required)'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: '4.18.2'
    },
    realApiInfo: {
      source: 'npm Registry Tarball',
      url: 'https://registry.npmjs.org/{packageName}/-/{packageName}-{version}.tgz',
      description: 'Downloads package tarball, extracts source code, and performs static analysis to detect risky patterns, obfuscation, and suspicious code',
      note: 'Requires COLLECT_STATIC_ANALYSIS=true. This feature can be resource-intensive.'
    }
  },
  {
    id: 'malicious-packages',
    name: 'Malicious Package Collection',
    description: 'Collect known malicious packages from GitHub advisories, OSV database, and research datasets',
    endpoint: '/api/malicious-packages',
    method: 'GET',
    params: [
      {
        name: 'source',
        type: 'select',
        required: false,
        options: ['all', 'github', 'osv', 'research'],
        description: 'Filter by source'
      }
    ],
    defaultParams: {
      source: 'all'
    },
    realApiInfo: {
      sources: [
        {
          key: 'all',
          name: 'Aggregated Sources',
          url: 'https://api.osv.dev/v1/query',
          description: 'Combines OSV, GitHub advisories, and curated malware feeds'
        },
        {
          key: 'github',
          name: 'GitHub Security Advisories',
          url: 'https://api.github.com/advisories?type=malware',
          description: 'Known malicious packages reported to GitHub'
        },
        {
          key: 'osv',
          name: 'OSV Database',
          url: 'https://api.osv.dev/v1/query',
          description: 'Open Source Vulnerabilities with malware indicators'
        },
        {
          key: 'research',
          name: 'Research Datasets',
          url: 'https://raw.githubusercontent.com/secure-supply-chain/malware-datasets/main/backstabbers-knife-collection.json',
          description: 'Academic malware research datasets'
        }
      ],
      note: 'Requires GITHUB_TOKEN for GitHub advisories'
    }
  },
  {
    id: 'benign-packages',
    name: 'Benign Package Collection',
    description: 'Collect known safe/benign packages from top downloads, verified organizations, and curated lists',
    endpoint: '/api/benign-packages',
    method: 'GET',
    params: [
      {
        name: 'source',
        type: 'select',
        required: false,
        options: ['all', 'top-downloaded', 'verified-org', 'curated'],
        description: 'Filter by source'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        placeholder: 'e.g., 100 (optional)',
        description: 'Limit number of results (default: 100)'
      }
    ],
    defaultParams: {
      source: 'all',
      limit: '100'
    },
    realApiInfo: {
      sources: [
        {
          key: 'all',
          name: 'Combined Sources',
          url: 'https://registry.npmjs.org/-/v1/search?size={limit}&popularity=1.0',
          description: 'Aggregated benign set built from downloads, verified orgs, and curated lists'
        },
        {
          key: 'top-downloaded',
          name: 'Top Downloaded Packages',
          url: 'https://registry.npmjs.org/-/v1/search?size={limit}&popularity=1.0',
          description: 'Most popular packages (low likelihood of being malicious)'
        },
        {
          key: 'verified-org',
          name: 'Verified Organizations',
          url: 'https://registry.npmjs.org/-/v1/search?text=maintainer%3Averified&size={limit}',
          description: 'Packages from verified npm organizations'
        },
        {
          key: 'curated',
          name: 'Manually Curated',
          url: 'https://raw.githubusercontent.com/secure-supply-chain/benign-list/main/packages.json',
          description: 'Manually verified safe packages'
        }
      ]
    }
  },
  {
    id: 'collection-package',
    name: 'Collection Orchestrator - Package',
    description: 'Collect comprehensive data for a single package (metadata, dependencies, vulnerabilities, GitHub, static analysis)',
    endpoint: '/api/collection/package',
    method: 'POST',
    params: [
      {
        name: 'packageName',
        type: 'text',
        required: true,
        placeholder: 'e.g., express',
        description: 'Name of the npm package'
      },
      {
        name: 'version',
        type: 'text',
        required: false,
        placeholder: 'e.g., 4.18.2 (optional)',
        description: 'Specific version (defaults to latest)'
      },
      {
        name: 'includeStaticAnalysis',
        type: 'checkbox',
        required: false,
        description: 'Include static code analysis (can be expensive)'
      },
      {
        name: 'includeGitHubData',
        type: 'checkbox',
        required: false,
        description: 'Include GitHub repository data'
      },
      {
        name: 'includeVulnerabilities',
        type: 'checkbox',
        required: false,
        description: 'Include vulnerability data'
      },
      {
        name: 'includeDependencies',
        type: 'checkbox',
        required: false,
        description: 'Include dependency graph'
      }
    ],
    defaultParams: {
      packageName: 'express',
      version: '',
      includeStaticAnalysis: false,
      includeGitHubData: true,
      includeVulnerabilities: true,
      includeDependencies: true
    },
    realApiInfo: {
      sources: [
        {
          name: 'npm Registry',
          url: 'https://registry.npmjs.org/{packageName}',
          description: 'Metadata, dependency graph, and version data'
        },
        {
          name: 'GitHub API',
          url: 'https://api.github.com/repos/{owner}/{repo}',
          description: 'Repository statistics and activity'
        },
        {
          name: 'OSV',
          url: 'https://api.osv.dev/v1/query',
          description: 'Vulnerability information'
        }
      ]
    }
  },
  {
    id: 'collection-training-data',
    name: 'Collection Orchestrator - Training Data',
    description: 'Collect labeled training data (malicious and benign packages) for ML model training',
    endpoint: '/api/collection/training-data',
    method: 'POST',
    params: [
      {
        name: 'maliciousCount',
        type: 'number',
        required: false,
        placeholder: 'e.g., 1000 (optional)',
        description: 'Number of malicious packages to collect (default: 1000)'
      },
      {
        name: 'benignCount',
        type: 'number',
        required: false,
        placeholder: 'e.g., 10000 (optional)',
        description: 'Number of benign packages to collect (default: 10000)'
      }
    ],
    defaultParams: {
      maliciousCount: '1000',
      benignCount: '10000'
    },
    realApiInfo: {
      sources: [
        {
          name: 'OSV Database',
          url: 'https://api.osv.dev/v1/query',
          description: 'Malicious package labels'
        },
        {
          name: 'GitHub Security Advisories',
          url: 'https://api.github.com/advisories',
          description: 'Known vulnerabilities and malware reports'
        },
        {
          name: 'npm Registry Search',
          url: 'https://registry.npmjs.org/-/v1/search?text=scope%3Apublic&size={benignCount}',
          description: 'High-quality benign candidates'
        }
      ]
    }
  },
  {
    id: 'collection-vulnerability-databases',
    name: 'Collection Orchestrator - Vulnerability Databases',
    description: 'Collect and sync vulnerability databases from NVD, GitHub, OSV, and other sources',
    endpoint: '/api/collection/vulnerability-databases',
    method: 'POST',
    params: [
      {
        name: 'daysBack',
        type: 'number',
        required: false,
        placeholder: 'e.g., 30 (optional)',
        description: 'Number of days back to collect (default: 30)'
      },
      {
        name: 'sources',
        type: 'text',
        required: false,
        placeholder: 'e.g., nvd,github (optional)',
        description: 'Comma-separated list of sources (default: nvd,github)'
      }
    ],
    defaultParams: {
      daysBack: '30',
      sources: 'nvd,github'
    },
    realApiInfo: {
      sources: [
        {
          name: 'NVD',
          url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
          description: 'National Vulnerability Database'
        },
        {
          name: 'GitHub Advisories',
          url: 'https://api.github.com/advisories',
          description: 'GitHub Security Advisories'
        }
      ]
    }
  },
  {
    id: 'collection-batch',
    name: 'Collection Orchestrator - Batch Collection',
    description: 'Batch collect data for multiple packages with concurrency control',
    endpoint: '/api/collection/batch',
    method: 'POST',
    params: [
      {
        name: 'packages',
        type: 'textarea',
        required: true,
        placeholder: 'JSON array: [{"name":"express","version":"4.18.2"}]',
        description: 'Array of package objects with name and version'
      },
      {
        name: 'concurrency',
        type: 'number',
        required: false,
        placeholder: 'e.g., 5 (optional)',
        description: 'Number of concurrent requests (default: 5)'
      },
      {
        name: 'includeStaticAnalysis',
        type: 'checkbox',
        required: false,
        description: 'Include static code analysis'
      },
      {
        name: 'includeGitHubData',
        type: 'checkbox',
        required: false,
        description: 'Include GitHub repository data'
      },
      {
        name: 'includeVulnerabilities',
        type: 'checkbox',
        required: false,
        description: 'Include vulnerability data'
      }
    ],
    defaultParams: {
      packages: '[{"name":"express","version":"4.18.2"},{"name":"lodash","version":"4.17.21"}]',
      concurrency: '5',
      includeStaticAnalysis: false,
      includeGitHubData: true,
      includeVulnerabilities: true
    },
    realApiInfo: {
      sources: [
        {
          name: 'npm Registry',
          url: 'https://registry.npmjs.org/{packageName}',
          description: 'Per-package metadata and tarballs'
        },
        {
          name: 'GitHub API',
          url: 'https://api.github.com/repos/{owner}/{repo}',
          description: 'Repository data when includeGitHubData is enabled'
        },
        {
          name: 'OSV',
          url: 'https://api.osv.dev/v1/query',
          description: 'Vulnerability lookups when includeVulnerabilities is enabled'
        }
      ]
    }
  }
];

