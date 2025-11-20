import { benignPackageService } from '../services/benignPackageService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for benign package endpoints
 */
export const getBenignPackages = async (req, res, next) => {
  try {
    const { source = 'all', limit = 100 } = req.query;

    logger.info(`Fetching benign packages from source: ${source}, limit: ${limit}`);

    let packages = [];

    if (source === 'all' || source === 'top-downloaded') {
      const topPackages = await benignPackageService.getTopDownloadedPackages(parseInt(limit));
      packages.push(...topPackages);
    }

    if (source === 'all' || source === 'verified-org') {
      const orgPackages = await benignPackageService.getVerifiedOrgPackages(parseInt(limit));
      packages.push(...orgPackages);
    }

    if (source === 'all' || source === 'curated') {
      const curatedPackages = await benignPackageService.getCuratedSafePackages();
      packages.push(...curatedPackages);
    }

    // Deduplicate and limit
    const seen = new Set();
    const deduplicated = packages.filter(pkg => {
      const key = `${pkg.name}@${pkg.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: deduplicated,
      source,
      count: deduplicated.length,
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching benign packages:', error);
    next(error);
  }
};

export const collectBenignPackages = async (req, res, next) => {
  try {
    const { count = 10000 } = req.body;

    logger.info(`Triggering benign package collection (count: ${count})...`);

    const packages = await benignPackageService.collectAllBenignPackages(parseInt(count));

    res.json({
      success: true,
      message: 'Benign package collection completed',
      data: packages,
      count: packages.length,
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error collecting benign packages:', error);
    next(error);
  }
};

