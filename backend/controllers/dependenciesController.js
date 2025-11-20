import { dependenciesService } from '../services/dependenciesService.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for dependency graph endpoints
 * 
 * Real implementation would:
 * - Parse package-lock.json, yarn.lock, or pnpm-lock.yaml
 * - Build dependency graph using graph algorithms
 * - Calculate graph metrics (depth, centrality, etc.)
 * - Store graph structure for analysis
 */
export const getDependencies = async (req, res, next) => {
  try {
    const { packageName, version } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/dependencies?packageName=express&version=4.18.2'
      });
    }

    logger.info(`Fetching dependencies for ${packageName}${version ? `@${version}` : ''}`);

    const dependencies = await dependenciesService.fetchDependencies(packageName, version);

    res.json({
      success: true,
      data: dependencies,
      source: 'package-json-parsing',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dependencies:', error);
    next(error);
  }
};

export const getIndirectDependencies = async (req, res, next) => {
  try {
    const { packageName, version, depth = 5 } = req.query;

    if (!packageName) {
      return res.status(400).json({
        error: 'packageName query parameter is required',
        example: '/api/dependencies/indirect?packageName=express&depth=3'
      });
    }

    logger.info(`Fetching indirect dependencies for ${packageName} (depth: ${depth})`);

    const indirectDeps = await dependenciesService.getIndirectDependencies(
      packageName,
      version,
      parseInt(depth)
    );

    res.json({
      success: true,
      data: indirectDeps,
      source: 'dependency-graph-traversal',
      collectedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching indirect dependencies:', error);
    next(error);
  }
};

