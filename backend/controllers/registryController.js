import { registryService } from '../services/registryService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for npm registry data endpoints
 * 
 * Real implementation would:
 * - Fetch from npm registry API: https://registry.npmjs.org/{packageName}
 * - Get download statistics: https://api.npmjs.org/downloads/point/last-month/{packageName}
 * - Fetch GitHub repository data if available
 * - Collect maintainer information
 * - Track version history
 */
export const getRegistryData = async (req, res, next) => {
  try {
    const { packageName } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/package-registry?packageName=express'
      });
    }

    logger.info(`Fetching registry data for ${packageName}`);

    const registryData = await registryService.getRegistryData(packageName);

    res.json({
      success: true,
      data: registryData,
      source: 'npm-registry-api',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching registry data:', error);
    next(error);
  }
};

