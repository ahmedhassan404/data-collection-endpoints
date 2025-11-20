# External API Endpoints Used in Data Collection Prototype

This document lists all real external API endpoints (outsource endpoints) that this project calls.

## Table of Contents
1. [npm Registry APIs](#npm-registry-apis)
2. [Vulnerability Databases](#vulnerability-databases)
3. [GitHub APIs](#github-apis)
4. [Research Datasets](#research-datasets)
5. [Status/Monitoring](#statusmonitoring)

---

## npm Registry APIs

### 1. npm Registry API
- **Base URL**: `https://registry.npmjs.org`
- **Endpoints Used**:
  - `GET https://registry.npmjs.org/{packageName}` - Get package metadata
  - `GET https://registry.npmjs.org/{packageName}/{version}` - Get specific version metadata
  - `GET https://registry.npmjs.org/{packageName}/-/{packageName}-{version}.tgz` - Download package tarball
- **Used In**:
  - `backend/services/metadataService.js`
  - `backend/services/dependenciesService.js`
  - `backend/services/registryService.js`
  - `backend/services/benignPackageService.js`
  - `backend/services/staticAnalysisService.js`
- **Rate Limit**: ~100 requests/minute
- **Authentication**: Not required for public packages

### 2. npm Downloads API
- **Base URL**: `https://api.npmjs.org`
- **Endpoints Used**:
  - `GET https://api.npmjs.org/downloads/point/last-month/{packageName}` - Last month downloads
  - `GET https://api.npmjs.org/downloads/point/last-week/{packageName}` - Last week downloads
  - `GET https://api.npmjs.org/downloads/point/last-day/{packageName}` - Last day downloads
  - `GET https://api.npmjs.org/downloads/range/{startDate}:{endDate}/{packageName}` - Date range downloads
- **Used In**:
  - `backend/services/metadataService.js`
  - `backend/services/registryService.js`
  - `backend/services/benignPackageService.js`
- **Rate Limit**: ~100 requests/minute
- **Authentication**: Not required

---

## Vulnerability Databases

### 3. National Vulnerability Database (NVD)
- **Base URL**: `https://services.nvd.nist.gov`
- **Endpoints Used**:
  - `GET https://services.nvd.nist.gov/rest/json/cves/2.0` - Query CVEs
  - `GET https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cveId}` - Get specific CVE
- **Used In**:
  - `backend/config/dataCollectionResources.js` (documented)
  - `frontend/src/config/resources.js` (documented)
- **Rate Limit**: 5 requests per 30 seconds
- **Authentication**: Optional (API key recommended for higher rate limits)
- **Documentation**: https://nvd.nist.gov/developers/vulnerabilities

### 4. Open Source Vulnerabilities (OSV)
- **Base URL**: `https://api.osv.dev`
- **Endpoints Used**:
  - `POST https://api.osv.dev/v1/query` - Query vulnerabilities for a package
  - `POST https://api.osv.dev/v1/querybatch` - Batch query vulnerabilities
  - `GET https://api.osv.dev/v1/vulns/{vulnId}` - Get specific vulnerability
- **Used In**:
  - `backend/services/vulnerabilitiesService.js`
  - `backend/services/maliciousPackageService.js`
- **Rate Limit**: 1000 requests/minute
- **Authentication**: Not required
- **Documentation**: https://google.github.io/osv.dev/

### 5. GitHub Security Advisories
- **Base URL**: `https://api.github.com`
- **Endpoints Used**:
  - `GET https://api.github.com/advisories` - List all advisories
  - `GET https://api.github.com/advisories?type=malware&ecosystem=npm` - Malware advisories for npm
  - `GET https://api.github.com/advisories/{ghsaId}` - Get specific advisory
  - `GET https://api.github.com/repos/{owner}/{repo}/security-advisories` - Repository security advisories
- **Used In**:
  - `backend/services/vulnerabilitiesService.js`
  - `backend/services/maliciousPackageService.js`
  - `backend/services/githubService.js`
- **Rate Limit**: 5000 requests/hour (when authenticated)
- **Authentication**: Required (GitHub Personal Access Token)
- **Documentation**: https://docs.github.com/en/rest/security-advisories

### 6. OSS Index (Sonatype)
- **Base URL**: `https://ossindex.sonatype.org`
- **Endpoints Used**:
  - `POST https://ossindex.sonatype.org/api/v3/component-report` - Component vulnerability report
- **Used In**:
  - `backend/config/dataCollectionResources.js` (documented)
  - `frontend/src/config/resources.js` (documented)
- **Rate Limit**: ~100 requests/minute
- **Authentication**: Required (Basic Auth with username and API token)
- **Documentation**: https://ossindex.sonatype.org/doc/rest-api-v3

---

## GitHub APIs

### 7. GitHub Repository API
- **Base URL**: `https://api.github.com`
- **Endpoints Used**:
  - `GET https://api.github.com/repos/{owner}/{repo}` - Repository metadata
  - `GET https://api.github.com/repos/{owner}/{repo}/stats/commit_activity` - Commit activity statistics
  - `GET https://api.github.com/repos/{owner}/{repo}/contributors` - Repository contributors
  - `GET https://api.github.com/repos/{owner}/{repo}/security-advisories` - Repository security advisories
  - `GET https://api.github.com/repos/{owner}/{repo}/commits` - Repository commits
  - `GET https://api.github.com/repos/{owner}/{repo}/issues` - Repository issues
  - `GET https://api.github.com/repos/{owner}/{repo}/pulls` - Pull requests
  - `GET https://api.github.com/repos/{owner}/{repo}/releases` - Releases
  - `GET https://api.github.com/repos/{owner}/{repo}/contents/{path}` - Repository contents
- **Used In**:
  - `backend/services/githubService.js`
  - `backend/services/registryService.js`
- **Rate Limit**: 5000 requests/hour (when authenticated)
- **Authentication**: Recommended (GitHub Personal Access Token)
- **Documentation**: https://docs.github.com/en/rest

---

## Research Datasets

### 8. Backstabber's Knife Collection
- **Base URL**: `https://raw.githubusercontent.com`
- **Endpoints Used**:
  - `GET https://raw.githubusercontent.com/backstabbers-knife-collection/backstabbers-knife-collection/main/README.md` - Malicious packages list
- **Used In**:
  - `backend/services/maliciousPackageService.js`
- **Rate Limit**: GitHub rate limits apply
- **Authentication**: Not required
- **Description**: Academic research dataset containing known malicious npm packages

---

## Status/Monitoring

### 9. npm Status
- **URL**: `https://status.npmjs.org/`
- **Used In**: `backend/config/dataCollectionResources.js` (documented for monitoring)
- **Purpose**: Health check and status monitoring

### 10. GitHub Status
- **URL**: `https://www.githubstatus.com/`
- **Used In**: `backend/config/dataCollectionResources.js` (documented for monitoring)
- **Purpose**: Health check and status monitoring

---

## Summary by Service File

### backend/services/metadataService.js
- `https://registry.npmjs.org/{packageName}`
- `https://api.npmjs.org/downloads/point/last-month/{packageName}`

### backend/services/vulnerabilitiesService.js
- `https://api.osv.dev/v1/query` (POST)
- `https://api.github.com/advisories` (GET)

### backend/services/maliciousPackageService.js
- `https://api.github.com/advisories?type=malware&ecosystem=npm` (GET)
- `https://api.osv.dev/v1/querybatch` (POST)
- `https://raw.githubusercontent.com/backstabbers-knife-collection/backstabbers-knife-collection/main/README.md` (GET)

### backend/services/githubService.js
- `https://api.github.com/repos/{owner}/{repo}` (GET)
- `https://api.github.com/repos/{owner}/{repo}/stats/commit_activity` (GET)
- `https://api.github.com/repos/{owner}/{repo}/contributors` (GET)
- `https://api.github.com/repos/{owner}/{repo}/security-advisories` (GET)

### backend/services/registryService.js
- `https://api.npmjs.org/downloads/point/last-month/{packageName}` (GET)
- `https://api.npmjs.org/downloads/point/last-week/{packageName}` (GET)
- `https://api.npmjs.org/downloads/point/last-day/{packageName}` (GET)

### backend/services/dependenciesService.js
- `https://registry.npmjs.org/{packageName}` (GET)
- `https://registry.npmjs.org/{depName}/-/{depName}-{depVersion}.tgz` (referenced in resolved URLs)

### backend/services/staticAnalysisService.js
- Package tarball URLs from npm registry (dynamic, based on package metadata)

### backend/services/benignPackageService.js
- `https://api.npmjs.org/downloads/point/last-month/{packageName}` (GET)
- `https://registry.npmjs.org/{packageName}` (GET)

---

## Environment Variables Required

- **GITHUB_TOKEN**: Required for GitHub API access (higher rate limits)
- **OSS_INDEX_USERNAME**: Optional, for OSS Index API
- **OSS_INDEX_TOKEN**: Optional, for OSS Index API
- **NVD_API_KEY**: Optional, recommended for NVD API (higher rate limits)

---

## Rate Limiting Summary

| Service | Rate Limit | Notes |
|---------|-----------|-------|
| npm Registry | ~100 req/min | No auth required |
| npm Downloads | ~100 req/min | No auth required |
| NVD | 5 req/30 sec | API key recommended |
| OSV | 1000 req/min | No auth required |
| GitHub API | 5000 req/hour | Auth required for higher limits |
| OSS Index | ~100 req/min | Auth required |

---

## Notes

1. All endpoints use HTTPS
2. Most services require proper User-Agent headers
3. Rate limiting is implemented in `backend/utils/rateLimiter.js`
4. Retry logic with exponential backoff is implemented via `apiCallWithRetry`
5. Some endpoints are documented but not actively used in the codebase (e.g., NVD, OSS Index)

---

**Last Updated**: Generated from codebase analysis
**Total External Endpoints**: 10+ unique base URLs with multiple endpoint paths

