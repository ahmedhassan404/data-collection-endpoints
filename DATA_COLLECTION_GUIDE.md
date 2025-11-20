# ChainGuard: Data Collection Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Data Collection Architecture](#data-collection-architecture)
3. [Phase 1: Package Metadata Collection](#phase-1-package-metadata-collection)
4. [Phase 2: Dependency Graph Collection](#phase-2-dependency-graph-collection)
5. [Phase 3: Vulnerability Database Collection](#phase-3-vulnerability-database-collection)
6. [Phase 4: Static Code Analysis Collection](#phase-4-static-code-analysis-collection)
7. [Phase 5: Labeled Training Data Collection](#phase-5-labeled-training-data-collection)
8. [Data Storage Schema](#data-storage-schema)
9. [Collection Scripts & Tools](#collection-scripts--tools)
10. [Data Quality & Validation](#data-quality--validation)
11. [Automated Collection Pipeline](#automated-collection-pipeline)

---

## Overview

This guide describes how to collect, structure, and store data required for training and running ChainGuard's machine learning models. The data collection process is the foundation of the ML pipeline and must be comprehensive, accurate, and up-to-date.

### Data Collection Goals

1. **Package Metadata**: Comprehensive information about npm packages
2. **Dependency Graphs**: Complete dependency relationships (direct + transitive)
3. **Vulnerability Data**: Known CVEs, security advisories, and threat intelligence
4. **Code Features**: Static analysis signals from package source code
5. **Behavioral Patterns**: Historical update patterns, maintainer activity

### Data Sources

| Source Type | Primary Sources | Update Frequency |
|------------|----------------|------------------|
| **Package Registry** | npm registry API | Real-time |
| **Vulnerability DBs** | NVD, OSV, GitHub Advisories, npm audit | Daily |
| **Code Repositories** | GitHub, npm package tarballs | On-demand |
| **Download Stats** | npm download API | Daily |
| **User Projects** | ChainGuard user uploads | Real-time |

---

## Data Collection Architecture

### High-Level Flow

The data collection pipeline operates through three primary collection strategies that feed into a unified normalization and validation layer. Data flows through feature extraction and storage layers before being assembled into ML training datasets.

### Collection Strategies

1. **Scheduled Collection**: Daily/weekly batch jobs for vulnerability databases
2. **Event-Driven**: Real-time collection when users upload projects
3. **On-Demand**: Fetch package metadata when needed for classification

---

## Phase 1: Package Metadata Collection

### Overview

Package metadata collection gathers comprehensive information about npm packages from the official npm registry. This includes basic package information, version history, maintainer details, and repository statistics.

### 1.1 npm Registry API

**Resource Overview:**
- **Endpoint**: `https://registry.npmjs.org/{packageName}`
- **Purpose**: Primary source for package metadata
- **Data Retrieved**: Package name, description, versions, dependencies, repository URLs, maintainer information, license, keywords, download statistics, and publication timestamps

**What to Collect:**
- Package name and description
- All published versions
- Latest version information
- Repository URL and homepage
- License information
- Maintainer names and emails
- Keywords and tags
- Creation and modification timestamps
- Download statistics (monthly counts)
- Package distribution information (tarball URLs, checksums)

**Collection Approach:**
The npm registry API provides JSON responses containing all package metadata. Collection involves making HTTP GET requests to the registry endpoint for each package, parsing the JSON response, and extracting relevant fields. Download statistics are collected separately from the npm downloads API endpoint.

### 1.2 Package Version History

**Overview:**
Version history collection tracks all published versions of a package, their release dates, and release patterns. This data helps identify suspicious update patterns, such as rapid-fire releases or unusual version jumps.

**What to Collect:**
- All published versions with timestamps
- Version release frequency and patterns
- Breaking changes indicators (semver major version bumps)
- Deprecation status for specific versions
- Time between releases
- Average days between version releases

**Collection Approach:**
Version history is extracted from the package metadata's `time` object, which contains timestamps for each version. The collection process involves sorting versions chronologically, calculating time intervals between releases, and identifying patterns that might indicate malicious activity (e.g., very frequent updates or long periods of inactivity followed by sudden activity).

### 1.3 Maintainer Information

**Overview:**
Maintainer information helps assess package trustworthiness by examining who maintains the package, their reputation, and their activity history.

**What to Collect:**
- Maintainer names and email addresses
- Number of maintainers per package
- Maintainer history (changes over time)
- Maintainer reputation metrics (other packages they maintain)
- Maintainer verification status
- Maintainer activity patterns

**Collection Approach:**
Maintainer data comes from the package metadata's `maintainers` array. Additional reputation data requires querying the npm registry for all packages maintained by each maintainer. This helps identify maintainers with suspicious patterns, such as maintaining many packages with similar names or packages that were later removed for security reasons.

### 1.4 Repository Information

**Overview:**
Repository information provides insights into package development activity, community engagement, and code quality through GitHub statistics and activity metrics.

**What to Collect:**
- GitHub repository URL (if available)
- Repository stars, forks, and watchers
- Open and closed issue counts
- Pull request activity and merge frequency
- Commit frequency and patterns
- Contributor count
- Repository age and last update time
- Primary programming language

**Collection Approach:**
Repository URLs are extracted from package metadata. For GitHub repositories, the GitHub API is used to fetch repository statistics, issue counts, and activity metrics. This data helps identify packages with suspicious characteristics, such as packages with no repository, very low activity, or repositories created recently with many stars (potential manipulation).

---

## Phase 2: Dependency Graph Collection

### Overview

Dependency graph collection builds complete dependency trees for packages, including both direct and transitive dependencies. This graph structure is essential for understanding package relationships and identifying supply chain risks.

### 2.1 Parsing Lock Files

**Resource Overview:**
- **Supported Formats**: `package-lock.json` (npm), `yarn.lock` (Yarn), `pnpm-lock.yaml` (pnpm)
- **Purpose**: Extract complete dependency information including resolved versions
- **Data Retrieved**: All dependencies with their exact versions, dependency types (direct/transitive), and dependency depth

**What to Collect:**
- Root package name and version
- All direct dependencies with resolved versions
- All transitive dependencies (dependencies of dependencies)
- Dependency depth information
- Version constraints and resolved versions
- Integrity hashes for package verification

**Collection Approach:**
Lock files contain the complete dependency tree with exact versions. The collection process involves parsing the lock file format (JSON for npm, YAML for pnpm, or custom format for Yarn), recursively traversing the dependency tree, and building a structured graph representation. Each package manager has different lock file formats, so separate parsers are needed for each format.

### 2.2 Building Dependency Graph

**Overview:**
The dependency graph is constructed as a directed graph where nodes represent packages and edges represent dependency relationships. This graph structure enables graph-based feature extraction and analysis.

**Graph Structure:**
- **Nodes**: Represent packages with metadata (name, version, type, depth)
- **Edges**: Represent dependency relationships (source → target) with type (direct/transitive)
- **Root Node**: The main package being analyzed
- **Depth Levels**: Track how many dependency levels deep each package is

**Collection Approach:**
The graph is built by processing lock file data, creating nodes for each unique package@version combination, and creating edges between dependent packages. The graph tracks depth levels, distinguishing between direct dependencies (depth 1) and transitive dependencies (depth > 1). Graph statistics are calculated including total nodes, edge counts, and maximum depth.

### 2.3 Graph Feature Extraction

**Overview:**
Graph features are extracted from the dependency graph structure to provide machine learning features that capture package relationships and positions in the dependency ecosystem.

**Features to Extract:**
- **Degree Features**: In-degree (how many packages depend on this), out-degree (how many packages this depends on), total degree
- **Depth Features**: Distance from root package, dependency depth level
- **Centrality Features**: Betweenness centrality (importance as a bridge), closeness centrality (average distance to other nodes)
- **Dependency Type**: Whether the package is a direct or transitive dependency
- **Reverse Dependencies**: Count of packages that depend on this package

**Collection Approach:**
Graph features are calculated using graph algorithms. Degree features are computed by counting edges, centrality measures use standard graph algorithms (e.g., shortest path calculations), and depth features come from the graph traversal. These features help identify packages that are critical to the ecosystem (high centrality) or packages that are rarely used (low reverse dependency count).

---

## Phase 3: Vulnerability Database Collection

### Overview

Vulnerability database collection gathers security information from multiple sources to identify known vulnerabilities, security advisories, and threat intelligence related to npm packages.

### 3.1 NVD (National Vulnerability Database)

**Resource Overview:**
- **API Endpoint**: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- **Purpose**: Official U.S. government database of known vulnerabilities
- **Update Frequency**: Daily updates with new CVEs
- **Rate Limits**: 5 requests per 30 seconds

**What to Collect:**
- CVE identifiers (CVE-YYYY-NNNNN)
- Published and last modified dates
- Vulnerability descriptions
- CVSS v2 and v3 scores and vectors
- Affected package information (extracted from CPE data)
- Vulnerability references and advisories
- Severity classifications

**Collection Approach:**
NVD data is collected via paginated API requests. The collection process involves querying for CVEs within date ranges, paginating through results (2000 per page), and extracting package information from CPE (Common Platform Enumeration) data. Rate limiting is critical due to NVD's strict limits. The data is filtered to focus on npm/JavaScript ecosystem vulnerabilities.

### 3.2 OSV (Open Source Vulnerabilities)

**Resource Overview:**
- **API Endpoint**: `https://api.osv.dev/v1/query`
- **Purpose**: Open source vulnerability database with ecosystem-specific data
- **Update Frequency**: Daily updates
- **Advantages**: Better npm ecosystem coverage than NVD

**What to Collect:**
- Vulnerability IDs (OSV format)
- Vulnerability summaries and detailed descriptions
- Severity information
- Affected version ranges for packages
- Fixed version information
- References to advisories and patches
- Database-specific metadata

**Collection Approach:**
OSV uses a query-based API where you query for vulnerabilities affecting specific packages. The collection process involves querying for each package of interest, receiving vulnerability information in a structured format optimized for package ecosystems. OSV provides better npm-specific data than NVD, including precise version range information.

### 3.3 GitHub Security Advisories

**Resource Overview:**
- **API Endpoint**: `https://api.github.com/advisories`
- **Purpose**: GitHub's security advisory database including malware reports
- **Update Frequency**: Real-time updates
- **Authentication**: Requires GitHub token

**What to Collect:**
- GHSA (GitHub Security Advisory) identifiers
- CVE identifiers (when available)
- Advisory summaries and descriptions
- Severity levels and CVSS scores
- CWE (Common Weakness Enumeration) identifiers
- Affected packages and version ranges
- Published, updated, and withdrawn dates
- Vulnerability references

**Collection Approach:**
GitHub advisories are collected via paginated API requests. The API requires authentication with a GitHub token. Collection involves paginating through all advisories, filtering for npm ecosystem packages, and extracting vulnerability details. GitHub advisories are particularly valuable for identifying malware and supply chain attacks.

### 3.4 npm Security Advisories

**Resource Overview:**
- **Source**: npm audit command and npm registry security data
- **Purpose**: npm's own security advisory system
- **Update Frequency**: Real-time as advisories are published

**What to Collect:**
- Vulnerability identifiers from npm audit
- Severity levels (critical, high, moderate, low)
- Affected package versions
- Fixed versions and update recommendations
- Vulnerability descriptions
- Advisory metadata

**Collection Approach:**
npm security data is collected by running `npm audit` programmatically or by querying npm's security advisory API (if available). This involves creating temporary package.json files with specific package versions, running npm audit, and parsing the JSON output. npm audit provides npm-specific vulnerability information that may not appear in other databases.

### 3.5 OSS Index

**Resource Overview:**
- **API Endpoint**: `https://ossindex.sonatype.org/api/v3/component-report`
- **Purpose**: Sonatype's open source vulnerability database
- **Authentication**: Requires username and API token
- **Update Frequency**: Daily updates

**What to Collect:**
- Vulnerability identifiers
- CVSS scores
- Vulnerability descriptions
- Affected version information
- Remediation recommendations

**Collection Approach:**
OSS Index uses a component-based query API where packages are queried using Package URL (purl) format (e.g., `pkg:npm/package-name@version`). The API requires authentication. Collection involves querying for each package@version combination and extracting vulnerability data from the response.

---

## Phase 4: Static Code Analysis Collection

### Overview

Static code analysis collection examines package source code to identify suspicious patterns, risky API usage, obfuscation, and other code-level indicators of malicious behavior.

### 4.1 Package Source Code Download

**Resource Overview:**
- **Source**: npm package tarballs from registry
- **Purpose**: Access to package source code for analysis
- **Format**: `.tgz` tarball files containing package source

**What to Collect:**
- Package tarball URL from registry metadata
- Complete source code files
- Package structure and file organization
- Package.json and configuration files

**Collection Approach:**
Package source code is downloaded from the tarball URL provided in package metadata. The collection process involves downloading the `.tgz` file, extracting it to a temporary directory, and making the source code available for analysis. The tarball contains the complete package source as published to npm.

### 4.2 Static Analysis Feature Extraction

**Overview:**
Static analysis examines source code without executing it to identify suspicious patterns, risky API usage, and code quality indicators that might suggest malicious intent.

**What to Extract:**
- **Risky API Usage**: Detection of dangerous APIs like `eval()`, `child_process.exec()`, `Function()` constructor, file system write operations, network requests
- **Obfuscation Indicators**: Signs of code obfuscation including base64-encoded strings, hex variable names, character code manipulation, minified single-line code
- **Install Scripts**: Presence of install, preinstall, or postinstall scripts in package.json
- **Remote Code Downloads**: Detection of code that downloads and executes remote JavaScript/JSON files
- **File Structure**: Analysis of package file organization and structure
- **Code Metrics**: Lines of code, complexity metrics, file counts

**Collection Approach:**
Static analysis involves parsing JavaScript/TypeScript files using AST (Abstract Syntax Tree) parsers, traversing the AST to identify risky patterns, and applying heuristics to detect obfuscation. The analysis examines package.json for install scripts, scans code for dangerous API calls, and checks for patterns indicating remote code execution or obfuscation. Code metrics are calculated to understand package complexity and size.

---

## Phase 5: Labeled Training Data Collection

### Overview

Labeled training data collection gathers known malicious and benign packages to create supervised learning datasets. This phase is critical for training machine learning models to distinguish between safe and malicious packages.

### 5.1 Overview

For supervised machine learning, we need labeled training data with both malicious and benign packages. This phase covers collecting known malicious packages, identifying benign packages, and creating a balanced training dataset.

### 5.2 Sources for Known Malicious Packages

**Primary Sources:**

| Source | Description | API/Endpoint | Update Frequency |
|--------|-------------|--------------|-------------------|
| **npm Security Advisories** | Official npm security reports | npm registry security API | Real-time |
| **GitHub Security Advisories** | Known malicious packages reported to GitHub | `https://api.github.com/advisories` | Daily |
| **OSV Database** | Open Source Vulnerabilities with malicious package indicators | `https://api.osv.dev/v1/query` | Daily |
| **Snyk Vulnerability DB** | Security research database | Snyk API | Daily |
| **npm Malware Reports** | Community-reported malicious packages | npm registry + manual curation | On-demand |
| **Research Datasets** | Academic malware datasets | Various research repositories | Static |
| **Typosquatting Databases** | Known typosquatting packages | Manual collection + heuristics | Weekly |

**Collection Approach:**
Malicious package collection involves aggregating data from multiple sources. npm security advisories provide packages removed for security reasons. GitHub advisories include malware-specific reports. OSV and Snyk databases contain vulnerability data that can indicate malicious packages. Research datasets like the Backstabber's Knife Collection provide curated lists of known malicious packages. The collection process involves deduplicating packages across sources, normalizing package names and versions, and assigning confidence levels based on the number of sources confirming malicious status.

### 5.3 Collecting Benign/Normal Packages

**Strategy for Benign Packages:**

1. **High-Reputation Packages**: Well-known, widely-used packages with long history
2. **Verified Maintainers**: Packages from verified npm organizations
3. **Popular Packages**: Top downloaded packages (low likelihood of being malicious)
4. **Manually Curated**: Known safe packages from trusted sources

**Collection Approach:**
Benign package collection focuses on packages with strong trust indicators. Top downloaded packages are collected from npm download statistics. Packages from verified organizations (e.g., @microsoft, @google, @facebook) are included due to their high trust level. Packages with long history (>2 years) and regular updates indicate stability. A manually curated list of known safe packages (core Node.js modules, popular frameworks) provides high-confidence benign examples. The collection process ensures diversity in package types, sizes, and purposes to create a representative benign dataset.

### 5.4 Labeling Strategy

**Overview:**
The labeling strategy defines how packages are classified and assigned confidence levels. Labels indicate whether a package is malicious, benign, suspicious, or unknown.

**Label Types:**
- **Malicious**: Confirmed or highly likely to be malicious
- **Benign**: Confirmed or highly likely to be safe
- **Suspicious**: Shows concerning indicators but needs review
- **Unknown**: Not yet labeled or insufficient information

**Confidence Levels:**
- **Very High**: Multiple independent sources confirm the label
- **High**: Strong indicators from reputable sources
- **Medium**: Moderate confidence based on available data
- **Low**: Weak indicators or conflicting information

**Collection Approach:**
Labeling can be automated or manual. Automated labeling checks all available sources (security advisories, vulnerability databases, reputation indicators) to determine the most likely label. Manual labeling involves security experts reviewing packages. The labeling process tracks the source of each label, confidence level, and reason for the classification. Labels are stored with metadata including who labeled it, when, and whether review is required.

### 5.5 Creating Balanced Training Dataset

**Overview:**
A balanced training dataset ensures the machine learning model has sufficient examples of both malicious and benign packages, preventing class imbalance issues that could bias the model.

**Dataset Balancing Strategy:**
- **Undersampling**: Randomly sample from the majority class (usually benign) to match the minority class size
- **Oversampling**: Duplicate or augment examples from the minority class (usually malicious) to match the majority class
- **Class Ratios**: Maintain appropriate ratios (e.g., 1:1, 1:2, or 1:3 malicious to benign) depending on available data

**Dataset Splits:**
- **Training Set**: 70% of data for model training
- **Validation Set**: 15% of data for hyperparameter tuning and model selection
- **Test Set**: 15% of data for final model evaluation (never used during training)

**Collection Approach:**
The dataset building process involves collecting malicious and benign packages, enriching each with all available features (metadata, dependencies, vulnerabilities, static analysis), balancing the classes using undersampling or oversampling techniques, and splitting into train/validation/test sets with proper shuffling. Statistics are calculated for each split to ensure balanced representation.

### 5.6 Label Quality Assurance

**Overview:**
Label quality assurance ensures the accuracy and consistency of package labels through validation, conflict detection, and review processes.

**Validation and Review Process:**
- **Conflict Detection**: Identify packages with conflicting labels from different sources
- **Low Confidence Review**: Flag labels with low or medium confidence for expert review
- **Outdated Label Review**: Review labels older than a threshold (e.g., 6 months) to ensure they're still accurate
- **Source Verification**: Verify that label sources are reputable and accurate

**Collection Approach:**
Quality assurance involves automated checks for label conflicts (same package labeled both malicious and benign), identification of low-confidence labels requiring review, and detection of outdated labels that may need updating. The process generates reports of issues requiring human review and tracks review status and outcomes.

---

## Data Storage Schema

### Overview

The data storage schema defines how collected data is structured and stored in the database. The schema supports efficient querying, feature extraction, and ML training dataset creation.

### 6.1 Database Tables

**Packages Table:**
Stores core package metadata including name, version, description, repository information, maintainer counts, creation/modification dates, download statistics, and denormalized label information for quick access.

**Dependencies Table:**
Stores dependency relationships between packages, including source and target package references, dependency type (direct/transitive), depth level, version constraints, and resolved versions.

**Vulnerabilities Table:**
Stores vulnerability information including CVE/GHSA identifiers, severity levels, CVSS scores, descriptions, affected version ranges, fixed versions, publication dates, source database, and references.

**Static Analysis Features Table:**
Stores static code analysis results including risky API detections, obfuscation flags, install script presence, remote code download indicators, code metrics, and file structure information.

**Package Labels Table:**
Stores package classification labels (malicious/benign/suspicious/unknown) with confidence levels, source information, labeling metadata (who, when, why), and review status.

**Training Dataset Tables:**
Store training dataset metadata and samples, including dataset names, versions, split types (train/validation/test), sample counts, and extracted features for ML training.

---

## Collection Scripts & Tools

### Overview

Collection scripts and tools orchestrate the data collection process, manage scheduled jobs, and coordinate collection from multiple sources.

### 7.1 Main Collection Orchestrator

**Overview:**
The main collection orchestrator coordinates collection of all data types for a given package. It manages the sequence of collection steps, handles errors, and ensures data consistency.

**Functionality:**
- Coordinates collection of package metadata, dependency graphs, vulnerabilities, and static analysis
- Manages collection sequence and dependencies
- Handles errors and retries
- Saves collected data to database
- Provides logging and progress tracking

**Collection Workflow:**
1. Collect package metadata from npm registry
2. Collect dependency graph from lock files or registry
3. Collect vulnerability data from multiple sources (OSV, npm audit, etc.)
4. Optionally collect static analysis features (if enabled)
5. Save all collected data to database

### 7.2 Scheduled Collection Jobs

**Overview:**
Scheduled collection jobs run automatically at specified intervals to keep data up-to-date and collect new information from vulnerability databases and package registries.

**Scheduled Jobs:**
- **Daily Vulnerability Database Sync**: Runs daily (e.g., 2 AM UTC) to collect new vulnerabilities from NVD, OSV, GitHub Advisories
- **Weekly Package Metadata Refresh**: Runs weekly (e.g., Sunday 3 AM UTC) to refresh metadata for top packages
- **Weekly Labeled Training Data Collection**: Runs weekly (e.g., Sunday 4 AM UTC) to collect new malicious and benign packages for training datasets

**Collection Approach:**
Scheduled jobs use cron-like scheduling to trigger collection at specified times. Jobs handle rate limiting, error recovery, and progress tracking. They can be configured to collect incremental updates (only new data since last run) or full refreshes.

---

## Data Quality & Validation

### Overview

Data quality and validation ensure collected data is accurate, complete, and suitable for machine learning. Validation rules check data integrity, and completeness checks ensure all required data is present.

### 8.1 Validation Rules

**Package Metadata Validation:**
- Verify required fields are present (name, version)
- Validate data types and formats
- Check for logical consistency (e.g., download counts are non-negative)
- Validate timestamps are reasonable

**Vulnerability Data Validation:**
- Verify vulnerability identifiers are present (CVE ID or GHSA ID)
- Validate severity levels are from allowed set (critical, high, medium, low)
- Check CVSS scores are in valid range (0-10)
- Verify version ranges are properly formatted

**Collection Approach:**
Validation rules are applied automatically during data collection. Invalid data is flagged, logged, and either corrected (if possible) or rejected. Validation results are tracked to monitor data quality over time.

### 8.2 Data Completeness Checks

**Overview:**
Data completeness checks verify that all required data types have been collected for a package and that data is recent enough to be useful.

**Completeness Criteria:**
- **Metadata**: Must be present and collected within last 7 days
- **Dependencies**: Must have at least basic dependency information
- **Vulnerabilities**: Always considered complete (empty array is valid)
- **Static Analysis**: Optional but should be present for training data

**Collection Approach:**
Completeness checks are performed after collection to identify missing data. Packages with incomplete data can be flagged for re-collection or excluded from training datasets. Completeness scores are calculated as the percentage of required data types that are present and up-to-date.

---

## Automated Collection Pipeline

### Overview

The automated collection pipeline orchestrates all collection activities through scheduled, event-driven, and on-demand collectors. Data flows through validation, feature extraction, and storage layers before being assembled into ML training datasets.

### 9.1 Pipeline Architecture

The pipeline consists of three collection types (scheduled, event-based, on-demand) that feed into a unified data validation and quality check layer. Validated data flows through feature extraction and normalization, then to database storage, and finally to ML training dataset assembly.

### 9.2 Pipeline Components

**Collection Layer:**
- **Scheduled Collectors**: Run on fixed schedules (daily, weekly) for vulnerability databases and metadata refreshes
- **Event-Based Collectors**: Triggered by user actions (e.g., project upload) to collect data on-demand
- **On-Demand Collectors**: Manual or API-triggered collection for specific packages

**Processing Layer:**
- **Data Validation**: Applies validation rules and quality checks
- **Feature Extraction**: Extracts ML features from raw data
- **Normalization**: Standardizes data formats and structures

**Storage Layer:**
- **Database Storage**: Saves validated and processed data
- **Training Dataset Assembly**: Creates balanced, split datasets for ML training

**Collection Approach:**
The pipeline uses a queue-based system where collection tasks are added to queues with priorities. High-priority tasks (e.g., user-requested packages) are processed first. The pipeline handles rate limiting, error recovery, and progress tracking. Event emitters notify about collection status (started, completed, failed) for monitoring and logging.

---

## Summary

This guide provides comprehensive instructions for collecting all data required for the ChainGuard ML pipeline:

1. **Package Metadata**: From npm registry API
2. **Dependency Graphs**: From lock files (package-lock.json, yarn.lock, pnpm-lock.yaml)
3. **Vulnerability Data**: From NVD, OSV, GitHub Advisories, npm audit, OSS Index
4. **Static Analysis**: From package source code
5. **Labeled Training Data**: Malicious and benign packages from multiple sources for supervised learning
6. **Behavioral Patterns**: From historical data analysis

**Key Components for Training Data:**
- **Malicious Package Sources**: npm security advisories, GitHub advisories, OSV database, research datasets, typosquatting databases
- **Benign Package Sources**: Top downloaded packages, verified organizations, stable packages with long history, manually curated safe packages
- **Labeling Strategy**: Automated and manual labeling with confidence levels
- **Dataset Balancing**: Undersampling/oversampling techniques to handle class imbalance
- **Quality Assurance**: Label validation, conflict detection, and review processes

**Next Steps:**
- Set up database schema (including package_labels and training_datasets tables)
- Implement collection scripts for both malicious and benign packages
- Set up labeling pipeline and quality assurance processes
- Configure scheduled jobs for continuous data collection
- Build balanced training datasets with proper train/validation/test splits
- Set up monitoring and alerting
- Begin data collection for training dataset
