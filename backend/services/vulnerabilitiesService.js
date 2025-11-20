/**
 * Service for fetching vulnerability data from multiple sources
 * 
 * Fetches from:
 * - OSV API: https://api.osv.dev/v1/query
 * - GitHub Advisories: https://api.github.com/advisories
 * - npm audit: Run programmatically using child_process
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';

const execAsync = promisify(exec);
const OSV_API_BASE = 'https://api.osv.dev';
const GITHUB_API_BASE = 'https://api.github.com';

export const vulnerabilitiesService = {
    /**
     * Fetch vulnerabilities from OSV API
     */
    async fetchFromOSV(packageName, version = 'latest') {
        try {
            const response = await rateLimiters.osv.makeRequest(() =>
                apiCallWithRetry(
                    () => axios.post(`${OSV_API_BASE}/v1/query`, {
                        package: {
                            name: packageName,
                            ecosystem: 'npm'
                        },
                        version: version === 'latest' ? undefined : version
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'ChainGuard-DataCollector/1.0'
                        }
                    }), { maxRetries: 3 }
                )
            );

            const vulnerabilities = [];
            if (response.data.vulns) {
                for (const vuln of response.data.vulns) {
                    vulnerabilities.push({
                        id: vuln.id,
                        source: 'OSV',
                        severity: vuln.database_specific?.severity || 'unknown',
                        summary: vuln.summary || '',
                        details: vuln.details || '',
                        affected: vuln.affected || [],
                        references: vuln.references || [],
                        publishedDate: vuln.published || vuln.modified || new Date().toISOString(),
                        modifiedDate: vuln.modified
                    });
                }
            }

            return vulnerabilities;
        } catch (error) {
            console.warn(`Error fetching OSV vulnerabilities for ${packageName}:`, error.message);
            return [];
        }
    },

    /**
     * Fetch vulnerabilities from GitHub Advisories
     */
    async fetchFromGitHub(packageName, version = 'latest') {
        if (!process.env.GITHUB_TOKEN) {
            return [];
        }

        try {
            const vulnerabilities = [];
            let page = 1;
            const perPage = 100;

            while (page <= 5) { // Limit to 5 pages
                const response = await rateLimiters.github.makeRequest(() =>
                    apiCallWithRetry(
                        () => axios.get(`${GITHUB_API_BASE}/advisories`, {
                            params: {
                                page,
                                per_page: perPage,
                                ecosystem: 'npm',
                                package: packageName
                            },
                            headers: {
                                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                                'Accept': 'application/vnd.github+json',
                                'User-Agent': 'ChainGuard-DataCollector/1.0'
                            }
                        }), { maxRetries: 3 }
                    )
                );

                if (!response.data || response.data.length === 0) break;

                for (const advisory of response.data) {
                    if (advisory.vulnerabilities) {
                        for (const vuln of advisory.vulnerabilities) {
                            if (vuln.package?.name === packageName) {
                                vulnerabilities.push({
                                    id: advisory.ghsa_id,
                                    source: 'GitHub',
                                    severity: advisory.severity || vuln.severity || 'unknown',
                                    summary: advisory.summary || '',
                                    description: advisory.description || '',
                                    cvss: advisory.cvss,
                                    cwes: advisory.cwes || [],
                                    publishedAt: advisory.published_at,
                                    updatedAt: advisory.updated_at,
                                    vulnerableVersionRange: vuln.vulnerable_version_range,
                                    firstPatchedVersion: vuln.first_patched_version
                                });
                            }
                        }
                    }
                }

                if (response.data.length < perPage) break;
                page++;
            }

            return vulnerabilities;
        } catch (error) {
            console.warn(`Error fetching GitHub advisories for ${packageName}:`, error.message);
            return [];
        }
    },

    /**
     * Run npm audit for a package
     */
    async runNpmAudit(packageName, version = 'latest') {
        try {
            // Create a temporary package.json and run npm audit
            const tempDir = `/tmp/npm-audit-${Date.now()}`;
            const packageJson = {
                name: 'temp-audit',
                version: '1.0.0',
                dependencies: {
                    [packageName]: version === 'latest' ? '*' : version
                }
            };

            // Note: This requires npm to be installed and may not work in all environments
            // For production, consider using a library like @npmcli/audit-report
            const { stdout } = await execAsync(
                `cd ${tempDir} && echo '${JSON.stringify(packageJson)}' > package.json && npm audit --json || true`, { timeout: 30000 }
            );

            const auditResult = JSON.parse(stdout);
            const vulnerabilities = [];

            if (auditResult.vulnerabilities) {
                for (const [depName, vuln] of Object.entries(auditResult.vulnerabilities)) {
                    if (depName === packageName || depName.startsWith(`${packageName}/`)) {
                        vulnerabilities.push({
                            id: vuln.id || `npm-audit-${depName}`,
                            source: 'npm-audit',
                            severity: vuln.severity || 'unknown',
                            title: vuln.title || '',
                            description: vuln.description || '',
                            recommendation: vuln.recommendation || '',
                            dependency: depName,
                            path: vuln.path || depName,
                            moreInfo: vuln.url || `https://npmjs.com/advisories/${vuln.id}`
                        });
                    }
                }
            }

            return vulnerabilities;
        } catch (error) {
            // npm audit may not be available or may fail
            console.warn(`Error running npm audit for ${packageName}:`, error.message);
            return [];
        }
    },

    /**
     * Fetch vulnerabilities from all sources
     */
    async getVulnerabilities(packageName, version = 'latest', source = 'all') {
        const vulnerabilities = [];
        const sources = [];

        // Fetch from OSV
        if (source === 'all' || source === 'osv') {
            const osvVulns = await this.fetchFromOSV(packageName, version);
            vulnerabilities.push(...osvVulns);
            if (osvVulns.length > 0) sources.push('OSV');
        }

        // Fetch from GitHub
        if (source === 'all' || source === 'github') {
            const githubVulns = await this.fetchFromGitHub(packageName, version);
            vulnerabilities.push(...githubVulns);
            if (githubVulns.length > 0) sources.push('GitHub');
        }

        // Fetch from npm audit
        if (source === 'all' || source === 'npm') {
            const npmVulns = await this.runNpmAudit(packageName, version);
            vulnerabilities.push(...npmVulns);
            if (npmVulns.length > 0) sources.push('npm-audit');
        }

        // Get actual version
        const { metadataService } = await import('./metadataService.js');
        let actualVersion = version;
        try {
            const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
            actualVersion = metadata.version;
        } catch (error) {
            // Use provided version if metadata fetch fails
        }

        return {
            package: {
                name: packageName,
                version: actualVersion
            },
            vulnerabilities,
            summary: {
                total: vulnerabilities.length,
                critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                high: vulnerabilities.filter(v => v.severity === 'high').length,
                medium: vulnerabilities.filter(v => v.severity === 'medium' || v.severity === 'moderate').length,
                low: vulnerabilities.filter(v => v.severity === 'low').length
            },
            sources: sources.length > 0 ? sources : (source === 'all' ? ['OSV', 'GitHub', 'npm-audit'] : [source])
        };
    }
};