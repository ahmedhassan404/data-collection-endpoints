import { staticAnalysisService } from '../services/staticAnalysisService.js';
import { metadataService } from '../services/metadataService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for static analysis endpoints
 */
export const getStaticAnalysis = async (req, res, next) => {
  try {
    const { packageName, version = 'latest' } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/static-analysis?packageName=express&version=4.18.2'
      });
    }

    if (process.env.COLLECT_STATIC_ANALYSIS !== 'true') {
      return res.status(503).json({
        error: 'Static analysis collection is disabled',
        message: 'Set COLLECT_STATIC_ANALYSIS=true in environment variables to enable',
        note: 'This feature can be resource-intensive'
      });
    }

    logger.info(`Fetching static analysis for ${packageName}@${version}`);

    // Get package metadata to get tarball URL
    const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
    const actualVersion = metadata.version;
    const versionData = metadata.versions?.[actualVersion];
    
    if (!versionData?.dist?.tarball) {
      return res.status(404).json({
        error: 'Tarball URL not found for this package version',
        packageName,
        version: actualVersion
      });
    }

    // Extract static analysis features
    const staticFeatures = await staticAnalysisService.extractStaticAnalysisFeatures(
      packageName,
      actualVersion,
      versionData.dist.tarball
    );

    res.json({
      success: true,
      data: staticFeatures,
      source: 'static-analysis',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching static analysis:', error);
    next(error);
  }
};

