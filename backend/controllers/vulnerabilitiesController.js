import { vulnerabilitiesService } from '../services/vulnerabilitiesService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for vulnerability data endpoints
 * 
 * Real implementation would:
 * - Query NVD API: https://services.nvd.nist.gov/rest/json/cves/2.0
 * - Query OSV API: https://api.osv.dev/v1/query
 * - Query GitHub Advisories API
 * - Run npm audit programmatically
 * - Query OSS Index API
 * - Aggregate and normalize data from all sources
 */
export const getVulnerabilities = async (req, res, next) => {
  try {
    const { packageName, version, source = 'all' } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/vulnerabilities?packageName=express&source=all'
      });
    }

    logger.info(`Fetching vulnerabilities for ${packageName}${version ? `@${version}` : ''} from ${source}`);

    const vulnerabilities = await vulnerabilitiesService.getVulnerabilities(
      packageName,
      version,
      source
    );

    res.json({
      success: true,
      data: vulnerabilities,
      sources: source === 'all' 
        ? ['NVD', 'OSV', 'GitHub', 'npm-audit', 'OSS-Index']
        : [source],
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching vulnerabilities:', error);
    next(error);
  }
};

