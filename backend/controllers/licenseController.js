import { licenseService } from '../services/licenseService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for license information endpoints
 * 
 * Real implementation would:
 * - Parse package.json for license field
 * - Check LICENSE file in repository
 * - Analyze transitive dependencies for license compatibility
 * - Use SPDX license identifiers
 * - Detect license conflicts
 */
export const getLicenseInfo = async (req, res, next) => {
  try {
    const { packageName, version, includeTransitive = 'false' } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/license-info?packageName=express&includeTransitive=true'
      });
    }

    logger.info(`Fetching license info for ${packageName}${version ? `@${version}` : ''}`);

    const licenseInfo = await licenseService.getLicenseInfo(
      packageName,
      version,
      includeTransitive === 'true'
    );

    res.json({
      success: true,
      data: licenseInfo,
      source: 'package-json-license-field',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching license info:', error);
    next(error);
  }
};

