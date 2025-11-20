import { metadataService } from '../services/metadataService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for package metadata endpoints
 * 
 * Real implementation would:
 * - Fetch from npm registry API: https://registry.npmjs.org/{packageName}
 * - Cache responses to reduce API calls
 * - Handle rate limiting
 * - Parse and normalize data
 */
export const getPackageMetadata = async (req, res, next) => {
  try {
    const { packageName, version } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/metadata?packageName=express&version=4.18.2'
      });
    }

    logger.info(`Fetching metadata for ${packageName}${version ? `@${version}` : ''}`);

    const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);

    res.json({
      success: true,
      data: metadata,
      source: 'npm-registry-api',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching metadata:', error);
    next(error);
  }
};

