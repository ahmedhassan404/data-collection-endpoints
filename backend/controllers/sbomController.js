import { sbomService } from '../services/sbomService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for SBOM (Software Bill of Materials) generation
 * 
 * Real implementation would:
 * - Build complete dependency tree
 * - Include all package metadata
 * - Format according to SPDX or CycloneDX standards
 * - Include vulnerability information
 * - Include license information
 */
export const generateSBOM = async (req, res, next) => {
  try {
    const { packageName, version, format = 'json' } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/sbom?packageName=express&format=spdx'
      });
    }

    if (!['json', 'spdx', 'cyclonedx'].includes(format)) {
      return res.status(400).json({
        error: 'format must be one of: json, spdx, cyclonedx'
      });
    }

    logger.info(`Generating SBOM for ${packageName}${version ? `@${version}` : ''} in ${format} format`);

    const sbom = await sbomService.generateSBOM(packageName, version, format);

    res.json({
      success: true,
      data: sbom,
      format,
      source: 'dependency-graph-analysis',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating SBOM:', error);
    next(error);
  }
};

