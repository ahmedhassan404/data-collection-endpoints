import { DataCollectionOrchestrator } from '../services/collectionOrchestrator.js';
import { logger } from '../utils/logger.js';

const orchestrator = new DataCollectionOrchestrator();

/**
 * Controller for collection orchestrator endpoints
 */
export const collectPackageData = async (req, res, next) => {
  try {
    const { 
      packageName, 
      version = 'latest',
      includeStaticAnalysis = false,
      includeGitHubData = true,
      includeVulnerabilities = true,
      includeDependencies = true
    } = req.body;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName is required in request body',
        example: { packageName: 'express', version: '4.18.2' }
      });
    }

    logger.info(`Collecting data for ${packageName}@${version}...`);

    const result = await orchestrator.collectPackageData(packageName, version, {
      includeStaticAnalysis,
      includeGitHubData,
      includeVulnerabilities,
      includeDependencies
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error collecting package data:', error);
    next(error);
  }
};

export const collectVulnerabilityDatabases = async (req, res, next) => {
  try {
    const { daysBack = 30, sources = ['nvd', 'github'] } = req.body;

    logger.info('Collecting vulnerability databases...');

    const result = await orchestrator.collectVulnerabilityDatabases({
      daysBack,
      sources
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error collecting vulnerability databases:', error);
    next(error);
  }
};

export const collectLabeledTrainingData = async (req, res, next) => {
  try {
    const { maliciousCount = 1000, benignCount = 10000 } = req.body;

    logger.info('Collecting labeled training data...');

    const result = await orchestrator.collectLabeledTrainingData({
      maliciousCount,
      benignCount
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error collecting labeled training data:', error);
    next(error);
  }
};

export const batchCollectPackages = async (req, res, next) => {
  try {
    const { 
      packages, 
      concurrency = 5,
      includeStaticAnalysis = false,
      includeGitHubData = true,
      includeVulnerabilities = true
    } = req.body;

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({
        error: 'packages array is required in request body',
        example: { packages: [{ name: 'express', version: '4.18.2' }] }
      });
    }

    logger.info(`Batch collecting ${packages.length} packages...`);

    const result = await orchestrator.batchCollectPackages(packages, {
      concurrency,
      includeStaticAnalysis,
      includeGitHubData,
      includeVulnerabilities
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error batch collecting packages:', error);
    next(error);
  }
};

