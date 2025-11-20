import express from 'express';
import { getStaticAnalysis } from '../controllers/staticAnalysisController.js';

const router = express.Router();

/**
 * GET /api/static-analysis
 * 
 * Query params:
 * - packageName: string (required)
 * - version: string (required)
 * 
 * Example: /api/static-analysis?packageName=express&version=4.18.2
 * 
 * Returns static analysis features including:
 * - Risky API detections
 * - Obfuscation detection
 * - Suspicious patterns
 * - Code metrics
 * 
 * Note: This endpoint requires COLLECT_STATIC_ANALYSIS=true and can be expensive
 */
router.get('/', getStaticAnalysis);

export default router;






