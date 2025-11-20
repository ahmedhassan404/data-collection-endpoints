import express from 'express';
import { getVulnerabilities } from '../controllers/vulnerabilitiesController.js';

const router = express.Router();

/**
 * GET /api/vulnerabilities
 * 
 * Query params:
 * - packageName: string (required)
 * - version: string (optional) - defaults to latest
 * - source: string (optional) - filter by source: 'nvd', 'osv', 'github', 'npm', 'all'
 * 
 * Example: /api/vulnerabilities?packageName=express&source=all
 */
router.get('/', getVulnerabilities);

export default router;

