import express from 'express';
import { 
  collectPackageData, 
  collectVulnerabilityDatabases,
  collectLabeledTrainingData,
  batchCollectPackages
} from '../controllers/collectionController.js';

const router = express.Router();

/**
 * POST /api/collection/package
 * 
 * Collect comprehensive data for a single package
 * 
 * Body params:
 * - packageName: string (required)
 * - version: string (optional, default: 'latest')
 * - includeStaticAnalysis: boolean (optional, default: false)
 * - includeGitHubData: boolean (optional, default: true)
 * - includeVulnerabilities: boolean (optional, default: true)
 * - includeDependencies: boolean (optional, default: true)
 */
router.post('/package', collectPackageData);

/**
 * POST /api/collection/vulnerability-databases
 * 
 * Collect vulnerability databases (NVD, GitHub, etc.)
 * 
 * Body params:
 * - daysBack: number (optional, default: 30)
 * - sources: array (optional, default: ['nvd', 'github'])
 */
router.post('/vulnerability-databases', collectVulnerabilityDatabases);

/**
 * POST /api/collection/training-data
 * 
 * Collect labeled training data (malicious + benign packages)
 * 
 * Body params:
 * - maliciousCount: number (optional, default: 1000)
 * - benignCount: number (optional, default: 10000)
 */
router.post('/training-data', collectLabeledTrainingData);

/**
 * POST /api/collection/batch
 * 
 * Batch collect multiple packages
 * 
 * Body params:
 * - packages: array of {name, version} objects (required)
 * - concurrency: number (optional, default: 5)
 * - includeStaticAnalysis: boolean (optional, default: false)
 * - includeGitHubData: boolean (optional, default: true)
 * - includeVulnerabilities: boolean (optional, default: true)
 */
router.post('/batch', batchCollectPackages);

export default router;

