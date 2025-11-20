import express from 'express';
import { getPackageMetadata } from '../controllers/metadataController.js';

const router = express.Router();

/**
 * GET /api/metadata
 * 
 * Query params:
 * - packageName: string (required) - Name of the npm package
 * - version: string (optional) - Specific version, defaults to latest
 * 
 * Example: /api/metadata?packageName=express&version=4.18.2
 */
router.get('/', getPackageMetadata);

export default router;

