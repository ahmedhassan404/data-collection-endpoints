/**
 * Service for generating Software Bill of Materials (SBOM)
 * 
 * Builds SBOM from real dependency data in SPDX or CycloneDX formats
 */

import { metadataService } from './metadataService.js';
import { dependenciesService } from './dependenciesService.js';
import { licenseService } from './licenseService.js';

export const sbomService = {
  /**
   * Generate SBOM in various formats
   */
  async generateSBOM(packageName, version = 'latest', format = 'json') {
    const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
    const deps = await dependenciesService.fetchDependencies(packageName, metadata.version);
    
    // Build dependency list with licenses
    const dependencies = [];
    for (const dep of deps.dependencies) {
      try {
        const depMetadata = await metadataService.fetchFromNpmRegistry(dep.name, dep.version);
        const license = licenseService.normalizeLicense(depMetadata.license);
        dependencies.push({
          name: dep.name,
          version: dep.version,
          type: 'direct',
          license: license,
          purl: `pkg:npm/${dep.name}@${dep.version}`
        });
      } catch (error) {
        // Include without license if can't fetch
        dependencies.push({
          name: dep.name,
          version: dep.version,
          type: 'direct',
          license: 'UNKNOWN',
          purl: `pkg:npm/${dep.name}@${dep.version}`
        });
      }
    }

    const baseSBOM = {
      package: {
        name: packageName,
        version: metadata.version,
        description: metadata.description || ''
      },
      dependencies,
      metadata: {
        tool: 'ChainGuard Data Collector',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        format
      }
    };

    const packageLicense = licenseService.normalizeLicense(metadata.license);

    if (format === 'spdx') {
      return {
        spdxVersion: 'SPDX-2.3',
        dataLicense: 'CC0-1.0',
        SPDXID: 'SPDXRef-DOCUMENT',
        name: `SBOM for ${packageName}@${metadata.version}`,
        documentNamespace: `https://chainguard.io/sbom/${packageName}/${metadata.version}`,
        creationInfo: {
          created: new Date().toISOString(),
          creators: ['Tool: ChainGuard-DataCollector-1.0']
        },
        packages: [
          {
            SPDXID: `SPDXRef-${packageName}`,
            name: packageName,
            versionInfo: metadata.version,
            downloadLocation: metadata.versions?.[metadata.version]?.dist?.tarball || 'NOASSERTION',
            filesAnalyzed: false,
            licenseDeclared: packageLicense,
            copyrightText: 'NOASSERTION'
          },
          ...baseSBOM.dependencies.map(dep => ({
            SPDXID: `SPDXRef-${dep.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: dep.name,
            versionInfo: dep.version,
            downloadLocation: `https://registry.npmjs.org/${dep.name}/-/${dep.name}-${dep.version}.tgz`,
            filesAnalyzed: false,
            licenseDeclared: dep.license,
            copyrightText: 'NOASSERTION'
          }))
        ],
        relationships: baseSBOM.dependencies.map(dep => ({
          spdxElementId: `SPDXRef-${packageName}`,
          relationshipType: 'DEPENDS_ON',
          relatedSpdxElement: `SPDXRef-${dep.name.replace(/[^a-zA-Z0-9]/g, '_')}`
        }))
      };
    }

    if (format === 'cyclonedx') {
      return {
        bomFormat: 'CycloneDX',
        specVersion: '1.5',
        version: 1,
        metadata: {
          timestamp: new Date().toISOString(),
          tools: [
            {
              name: 'ChainGuard Data Collector',
              version: '1.0.0'
            }
          ],
          component: {
            type: 'application',
            name: packageName,
            version: metadata.version
          }
        },
        components: [
          {
            type: 'library',
            name: packageName,
            version: metadata.version,
            purl: `pkg:npm/${packageName}@${metadata.version}`,
            licenses: [{ license: { id: packageLicense } }]
          },
          ...baseSBOM.dependencies.map(dep => ({
            type: 'library',
            name: dep.name,
            version: dep.version,
            purl: dep.purl,
            licenses: [{ license: { id: dep.license } }]
          }))
        ]
      };
    }

    // Default JSON format
    return baseSBOM;
  }
};

