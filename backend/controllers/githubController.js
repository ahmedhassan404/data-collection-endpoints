import { githubService } from '../services/githubService.js';
import { metadataService } from '../services/metadataService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for GitHub data endpoints
 */
export const getGitHubData = async (req, res, next) => {
  try {
    const { packageName, version } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/github?packageName=express&version=4.18.2'
      });
    }

    logger.info(`Fetching GitHub data for ${packageName}${version ? `@${version}` : ''}`);

    // Get package metadata first to extract repository info
    const metadata = await metadataService.getMetadata(packageName, version);
    
    // Get GitHub data
    const githubData = await githubService.getPackageGitHubData(metadata);

    res.json({
      success: true,
      data: githubData,
      source: 'github-api',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching GitHub data:', error);
    next(error);
  }
};



