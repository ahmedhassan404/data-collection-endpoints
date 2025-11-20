/**
 * Service for collecting known malicious packages
 */

import axios from "axios";
import { apiCallWithRetry, rateLimiters } from "../utils/rateLimiter.js";

const GITHUB_API_BASE = "https://api.github.com";
const OSV_API_BASE = "https://api.osv.dev";

export const maliciousPackageService = {
  /**
   * Collect malicious packages from GitHub Security Advisories
   */
  async collectFromGitHubAdvisories() {
    const maliciousPackages = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 10;

    try {
      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "ChainGuard-DataCollector/1.0",
      };

      if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
      }

      while (page <= maxPages) {
        const response = await rateLimiters.github.makeRequest(() =>
          apiCallWithRetry(
            () =>
              axios.get(`${GITHUB_API_BASE}/advisories`, {
                params: {
                  page,
                  per_page: perPage,
                  type: "malware",
                  ecosystem: "npm",
                },
                headers,
              }),
            { maxRetries: 3 }
          )
        );

        if (!response?.data || !Array.isArray(response.data)) break;
        if (response.data.length === 0) break;

        response.data.forEach((adv) => {
          if (Array.isArray(adv.vulnerabilities)) {
            adv.vulnerabilities.forEach((vuln) => {
              if (
                vuln.package &&
                vuln.package.ecosystem === "npm" &&
                vuln.package.name
              ) {
                maliciousPackages.push({
                  name: vuln.package.name,
                  version:
                    vuln.first_patched_version?.identifier ||
                    vuln.vulnerable_version_range ||
                    "all",
                  label: "malicious",
                  source: "github-advisory",
                  ghsaId: adv.ghsa_id,
                  cveId: adv.cve_id,
                  summary: adv.summary || "",
                  severity: adv.severity || "unknown",
                  reportedAt: adv.published_at || adv.updated_at,
                  confidence: "high",
                });
              }
            });
          }
        });

        if (response.data.length < perPage) break;
        page++;
      }
    } catch (error) {
      console.error(
        "Error collecting GitHub malicious packages:",
        error.message
      );
    }

    return maliciousPackages;
  },

  /**
   * Collect malicious packages from OSV
   */
  async collectFromOSV(packageNames = []) {
    const maliciousPackages = [];

    if (packageNames.length === 0) {
      try {
        const research = await this.collectFromResearchDatasets();
        packageNames = research.map((p) => p.name).slice(0, 50);
      } catch {
        return [];
      }
    }

    if (packageNames.length === 0) return [];

    try {
      const batchSize = 100;

      for (let i = 0; i < packageNames.length; i += batchSize) {
        const batch = packageNames.slice(i, i + batchSize);

        const response = await rateLimiters.osv.makeRequest(() =>
          apiCallWithRetry(
            () =>
              axios.post(
                `${OSV_API_BASE}/v1/querybatch`,
                {
                  queries: batch.map((name) => ({
                    package: { name, ecosystem: "npm" },
                  })),
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "ChainGuard-DataCollector/1.0",
                  },
                }
              ),
            { maxRetries: 3 }
          )
        );

        const results = response?.data?.results || [];

        results.forEach((result, index) => {
          const vulns = result?.vulns || [];
          vulns.forEach((vuln) => {
            const summary = (vuln.summary || "").toLowerCase();
            const details = (vuln.details || "").toLowerCase();

            const isMalware =
              summary.includes("malware") ||
              summary.includes("malicious") ||
              summary.includes("typosquat") ||
              summary.includes("dependency confusion") ||
              details.includes("malware") ||
              details.includes("malicious") ||
              vuln.database_specific?.malicious === true;

            if (isMalware) {
              maliciousPackages.push({
                name: batch[index],
                version: "all",
                label: "malicious",
                source: "osv",
                vulnId: vuln.id,
                summary: vuln.summary || "",
                reportedAt: vuln.published || vuln.modified,
                confidence: "medium",
              });
            }
          });
        });
      }
    } catch (error) {
      console.error("Error collecting OSV malicious packages:", error.message);
    }

    return maliciousPackages;
  },

  /**
   * Collect from research datasets
   */
  async collectFromResearchDatasets() {
    const maliciousPackages = [];

    const researchSources = [
      {
        name: "backstabbers-knife-collection",
        url: "https://raw.githubusercontent.com/backstabbers-knife-collection/backstabbers-knife-collection/main/README.md",
        parser: this.parseBackstabbersCollection.bind(this),
      },
    ];

    for (const source of researchSources) {
      try {
        const response = await apiCallWithRetry(
          () =>
            axios.get(source.url, {
              headers: { "User-Agent": "ChainGuard-DataCollector/1.0" },
            }),
          { maxRetries: 3 }
        );

        if (response.data) {
          const extracted = source.parser(response.data);
          extracted.forEach((pkg) =>
            maliciousPackages.push({
              ...pkg,
              source: `research-${source.name}`,
              confidence: "high",
            })
          );
        }
      } catch (error) {
        console.warn(`Research source failed (${source.name}):`, error.message);
      }
    }

    return maliciousPackages;
  },

  /**
   * Parse backstabber malicious list
   */
  parseBackstabbersCollection(content) {
    const packages = [];
    const seen = new Set();

    const patterns = [
      /`([^`\s@]+)`/g,
      /\*\*([^*\s@]+)\*\*/g,
      /\[([^\]]+)\]\([^\)]+\)/g,
      /npm\s+install\s+([^\s@]+)/gi,
      /package[:\s]+([^\s@]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let name = match[1].trim().toLowerCase();

        name = name.replace(/[^\w\-@/]/g, "");

        if (
          name.length > 0 &&
          name.length <= 214 &&
          !name.startsWith("http") &&
          !seen.has(name)
        ) {
          seen.add(name);
          packages.push({
            name,
            version: "all",
            label: "malicious",
          });
        }
      }
    }

    return packages;
  },

  /**
   * Deduplicate malicious packages
   */
  deduplicatePackages(packages) {
    const map = new Map();

    for (const pkg of packages) {
      const key = `${pkg.name}@${pkg.version}`;
      if (!map.has(key)) {
        map.set(key, { ...pkg, sources: [pkg.source] });
      } else {
        const existing = map.get(key);
        if (!existing.sources.includes(pkg.source)) {
          existing.sources.push(pkg.source);
        }
        if (existing.sources.length > 1) {
          existing.confidence = "high";
        }
      }
    }

    return Array.from(map.values());
  },

  /**
   * Collect from all sources
   */
  async collectAllMaliciousPackages() {
    console.log("Collecting malicious packages from all sources...");

    const [github, osv, research] = await Promise.all([
      this.collectFromGitHubAdvisories(),
      this.collectFromOSV([]),
      this.collectFromResearchDatasets(),
    ]);

    const combined = [...github, ...osv, ...research];
    const dedup = this.deduplicatePackages(combined);

    console.log(`Collected ${dedup.length} unique malicious packages`);

    return dedup;
  },
};
