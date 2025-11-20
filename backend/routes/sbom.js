import express from 'express';
import { generateSBOM } from '../controllers/sbomController.js';

const router = express.Router();

/**
 * GET /api/sbom
 * 
 * Query params:
 * - packageName: string (required)
 * - version: string (optional) - defaults to latest
 * - format: string (optional) - 'spdx', 'cyclonedx', 'json' (default: 'json')
 * 
 * Example: /api/sbom?packageName=express&format=spdx
 * 
 * Generates a Software Bill of Materials (SBOM) for the package
 * including all dependencies and metadata
 */
router.get('/', generateSBOM);

export default router;

