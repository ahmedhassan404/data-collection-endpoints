import express from 'express';
import { getRegistryData } from '../controllers/registryController.js';

const router = express.Router();

/**
 * GET /api/package-registry
 * 
 * Query params:
 * - packageName: string (required)
 * 
 * Example: /api/package-registry?packageName=express
 * 
 * Returns comprehensive registry data including:
 * - All versions
 * - Download statistics
 * - Maintainer information
 * - Repository information
 * - Time-based metadata
 */
router.get('/', getRegistryData);

export default router;

