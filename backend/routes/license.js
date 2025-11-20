import express from 'express';
import { getLicenseInfo } from '../controllers/licenseController.js';

const router = express.Router();

/**
 * GET /api/license-info
 * 
 * Query params:
 * - packageName: string (required)
 * - version: string (optional) - defaults to latest
 * - includeTransitive: boolean (optional) - include transitive dependencies licenses
 * 
 * Example: /api/license-info?packageName=express&includeTransitive=true
 */
router.get('/', getLicenseInfo);

export default router;

