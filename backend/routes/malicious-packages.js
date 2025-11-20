import express from 'express';
import { getMaliciousPackages, collectMaliciousPackages } from '../controllers/maliciousPackageController.js';

const router = express.Router();

/**
 * GET /api/malicious-packages
 * 
 * Query params:
 * - source: string (optional) - Filter by source (github, osv, research, all)
 * 
 * Example: /api/malicious-packages?source=github
 * 
 * Returns list of known malicious packages from various sources
 */
router.get('/', getMaliciousPackages);

/**
 * POST /api/malicious-packages/collect
 * 
 * Triggers collection of malicious packages from all sources
 * 
 * Body params:
 * - force: boolean (optional) - Force re-collection even if data exists
 */
router.post('/collect', collectMaliciousPackages);

export default router;






