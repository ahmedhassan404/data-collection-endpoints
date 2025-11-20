import express from 'express';
import { getGitHubData } from '../controllers/githubController.js';

const router = express.Router();

/**
 * GET /api/github
 * 
 * Query params:
 * - packageName: string (required) - Name of the npm package
 * - version: string (optional) - Specific version, defaults to latest
 * 
 * Example: /api/github?packageName=express&version=4.18.2
 * 
 * Returns GitHub repository data including:
 * - Repository metadata (stars, forks, issues)
 * - Commit activity
 * - Contributor information
 * - Security advisories
 */
router.get('/', getGitHubData);

export default router;

