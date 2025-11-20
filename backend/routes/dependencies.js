import express from 'express';
import { getDependencies, getIndirectDependencies } from '../controllers/dependenciesController.js';

const router = express.Router();

/**
 * GET /api/dependencies
 * 
 * Query params:
 * - packageName: string (required)
 * - version: string (optional) - defaults to latest
 * 
 * Example: /api/dependencies?packageName=express&version=4.18.2
 */
router.get('/', getDependencies);

/**
 * GET /api/dependencies/indirect
 * 
 * Query params:
 * - packageName: string (required)
 * - version: string (optional)
 * - depth: number (optional) - max depth to traverse, defaults to 5
 * 
 * Example: /api/dependencies/indirect?packageName=express&depth=3
 */
router.get('/indirect', getIndirectDependencies);

export default router;

