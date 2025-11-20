import { maliciousPackageService } from '../services/maliciousPackageService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for malicious package endpoints
 */
export const getMaliciousPackages = async (req, res, next) => {
  try {
    const { source = 'all' } = req.query;

    logger.info(`Fetching malicious packages from source: ${source}`);

    let packages = [];

    if (source === 'all' || source === 'github') {
      const githubPackages = await maliciousPackageService.collectFromGitHubAdvisories();
      packages.push(...githubPackages);
    }

    if (source === 'all' || source === 'osv') {
      const osvPackages = await maliciousPackageService.collectFromOSV([]);
      packages.push(...osvPackages);
    }

    if (source === 'all' || source === 'research') {
      const researchPackages = await maliciousPackageService.collectFromResearchDatasets();
      packages.push(...researchPackages);
    }

    // Deduplicate
    const deduplicated = maliciousPackageService.deduplicatePackages(packages);

    res.json({
      success: true,
      data: deduplicated,
      source,
      count: deduplicated.length,
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching malicious packages:', error);
    next(error);
  }
};

export const collectMaliciousPackages = async (req, res, next) => {
  try {
    logger.info('Triggering malicious package collection...');

    const packages = await maliciousPackageService.collectAllMaliciousPackages();

    res.json({
      success: true,
      message: 'Malicious package collection completed',
      data: packages,
      count: packages.length,
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error collecting malicious packages:', error);
    next(error);
  }
};


