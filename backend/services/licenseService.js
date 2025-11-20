/**
 * Service for fetching license information
 * 
 * Fetches license info from npm registry and analyzes transitive dependencies
 */

import { metadataService } from './metadataService.js';
import { dependenciesService } from './dependenciesService.js';

export const licenseService = {
  /**
   * Normalize license field (can be string, object, or array)
   */
  normalizeLicense(licenseField) {
    if (!licenseField) return 'UNKNOWN';
    
    if (typeof licenseField === 'string') {
      return licenseField;
    }
    
    if (licenseField.type) {
      return licenseField.type;
    }
    
    if (Array.isArray(licenseField)) {
      return licenseField.map(l => typeof l === 'string' ? l : l.type).join(' OR ');
    }
    
    return 'UNKNOWN';
  },

  /**
   * Get license compatibility info
   */
  getLicenseCompatibility(license) {
    const mitLicenses = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0'];
    const gplLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0'];
    const proprietary = ['UNLICENSED', 'PROPRIETARY'];
    
    const normalized = license.toUpperCase();
    
    return {
      isOSIApproved: !proprietary.includes(normalized),
      isFSFLibre: !proprietary.includes(normalized),
      allowsCommercialUse: !gplLicenses.some(gpl => normalized.includes(gpl)),
      allowsModification: !proprietary.includes(normalized),
      requiresSourceCode: gplLicenses.some(gpl => normalized.includes(gpl)),
      requiresSameLicense: gplLicenses.some(gpl => normalized.includes(gpl))
    };
  },

  /**
   * Fetch license information
   */
  async getLicenseInfo(packageName, version = 'latest', includeTransitive = false) {
    const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
    const versionData = metadata.versions?.[metadata.version];
    
    const licenseType = this.normalizeLicense(versionData?.license || metadata.license);
    const compatibility = this.getLicenseCompatibility(licenseType);

    const licenseInfo = {
      package: {
        name: packageName,
        version: metadata.version
      },
      license: {
        type: licenseType,
        spdxId: licenseType,
        text: null, // Would need to fetch from repository
        url: metadata.repository?.url ? 
          `${metadata.repository.url.replace('.git', '')}/blob/master/LICENSE` : 
          null
      },
      licenseFile: {
        exists: null, // Would need to check repository
        path: 'LICENSE',
        content: null
      },
      compatibility
    };

    if (includeTransitive) {
      const deps = await dependenciesService.fetchDependencies(packageName, metadata.version);
      const transitiveLicenses = [];

      for (const dep of deps.dependencies) {
        try {
          const depMetadata = await metadataService.fetchFromNpmRegistry(dep.name, dep.version);
          const depLicense = this.normalizeLicense(depMetadata.license);
          
          transitiveLicenses.push({
            package: `${dep.name}@${dep.version}`,
            license: depLicense,
            spdxId: depLicense,
            compatibility: 'compatible' // Simplified
          });
        } catch (error) {
          // Skip if can't fetch dependency license
        }
      }

      licenseInfo.transitiveLicenses = transitiveLicenses;

      // Build license summary
      const licenseCounts = {};
      transitiveLicenses.forEach(tl => {
        licenseCounts[tl.license] = (licenseCounts[tl.license] || 0) + 1;
      });

      licenseInfo.licenseSummary = {
        totalPackages: transitiveLicenses.length + 1,
        uniqueLicenses: [...new Set([licenseType, ...transitiveLicenses.map(tl => tl.license)])],
        licenseDistribution: {
          [licenseType]: 1,
          ...licenseCounts
        },
        conflicts: [], // Would need more sophisticated analysis
        riskLevel: 'low' // Simplified
      };
    }

    return licenseInfo;
  }
};

