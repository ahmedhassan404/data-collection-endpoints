import express from 'express';
import { getBenignPackages, collectBenignPackages } from '../controllers/benignPackageController.js';

const router = express.Router();

/**
 * GET /api/benign-packages
 * 
 * Query params:
 * - source: string (optional) - Filter by source (top-downloaded, verified-org, curated, all)
 * - limit: number (optional) - Limit number of results (default: 100)
 * 
 * Example: /api/benign-packages?source=top-downloaded&limit=50
 * 
 * Returns list of known benign/safe packages from various sources
 */
router.get('/', getBenignPackages);

/**
 * POST /api/benign-packages/collect
 * 
 * Triggers collection of benign packages from all sources
 * 
 * Body params:
 * - count: number (optional) - Number of packages to collect (default: 10000)
 */
router.post('/collect', collectBenignPackages);

export default router;

