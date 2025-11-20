/**
 * Service for building dependency graphs
 * 
 * Fetches dependencies from npm registry and builds dependency tree
 */

import { metadataService } from './metadataService.js';
import { apiCallWithRetry, rateLimiters } from '../utils/rateLimiter.js';
import axios from 'axios';

const NPM_REGISTRY_BASE = 'https://registry.npmjs.org';

export const dependenciesService = {
  /**
   * Fetch direct dependencies from npm registry
   */
  async fetchDependencies(packageName, version = 'latest') {
    const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
    const versionData = metadata.versions?.[metadata.version];
    
    if (!versionData) {
      throw new Error(`Version ${metadata.version} not found for package ${packageName}`);
    }

    const dependencies = [];
    const devDependencies = [];

    // Process dependencies
    if (versionData.dependencies) {
      for (const [depName, depVersion] of Object.entries(versionData.dependencies)) {
        dependencies.push({
          name: depName,
          version: depVersion,
          type: 'direct',
          resolved: `https://registry.npmjs.org/${depName}/-/${depName}-${depVersion}.tgz`
        });
      }
    }

    // Process devDependencies
    if (versionData.devDependencies) {
      for (const [depName, depVersion] of Object.entries(versionData.devDependencies)) {
        devDependencies.push({
          name: depName,
          version: depVersion,
          type: 'dev'
        });
      }
    }

    return {
      package: {
        name: packageName,
        version: metadata.version
      },
      dependencies,
      devDependencies,
      statistics: {
        totalDependencies: dependencies.length,
        totalDevDependencies: devDependencies.length,
        directDependencies: dependencies.length,
        transitiveDependencies: 0
      }
    };
  },

  /**
   * Build transitive dependency tree
   */
  async buildDependencyTree(packageName, version = 'latest', maxDepth = 5, currentDepth = 0, visited = new Set()) {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const key = `${packageName}@${version}`;
    if (visited.has(key)) {
      return []; // Circular dependency detected
    }
    visited.add(key);

    try {
      const deps = await this.fetchDependencies(packageName, version);
      const transitiveDeps = [];

      for (const dep of deps.dependencies) {
        // Resolve version from range (simplified - in production use semver)
        const resolvedVersion = await this.resolveVersion(dep.name, dep.version);
        
        transitiveDeps.push({
          name: dep.name,
          version: resolvedVersion,
          type: 'transitive',
          depth: currentDepth + 1,
          parent: packageName
        });

        // Recursively get transitive dependencies
        if (currentDepth + 1 < maxDepth) {
          const subDeps = await this.buildDependencyTree(
            dep.name,
            resolvedVersion,
            maxDepth,
            currentDepth + 1,
            new Set(visited)
          );
          transitiveDeps.push(...subDeps);
        }
      }

      return transitiveDeps;
    } catch (error) {
      console.warn(`Error fetching dependencies for ${packageName}@${version}:`, error.message);
      return [];
    }
  },

  /**
   * Resolve version from semver range (simplified)
   */
  async resolveVersion(packageName, versionRange) {
    try {
      const metadata = await metadataService.fetchFromNpmRegistry(packageName, 'latest');
      // In production, use semver library to resolve ranges
      // For now, return latest if range is not exact
      if (versionRange.match(/^\d+\.\d+\.\d+$/)) {
        return versionRange;
      }
      return metadata.version;
    } catch (error) {
      return versionRange;
    }
  },

  /**
   * Get direct dependencies (alias for backward compatibility)
   */
  async getDependencies(packageName, version = 'latest') {
    return this.fetchDependencies(packageName, version);
  },

  /**
   * Get indirect/transitive dependencies
   */
  async getIndirectDependencies(packageName, version = 'latest', maxDepth = 5) {
    const metadata = await metadataService.fetchFromNpmRegistry(packageName, version);
    const transitiveDeps = await this.buildDependencyTree(packageName, metadata.version, parseInt(maxDepth));

    // Build graph structure
    const nodes = [
      { id: `${packageName}@${metadata.version}`, name: packageName, version: metadata.version, depth: 0, type: 'root' }
    ];
    const edges = [];

    // Group dependencies by depth and build graph
    const depsByDepth = {};
    transitiveDeps.forEach(dep => {
      if (!depsByDepth[dep.depth]) {
        depsByDepth[dep.depth] = [];
      }
      depsByDepth[dep.depth].push(dep);
      
      nodes.push({
        id: `${dep.name}@${dep.version}`,
        name: dep.name,
        version: dep.version,
        depth: dep.depth,
        type: 'transitive'
      });

      edges.push({
        source: `${dep.parent}@*`,
        target: `${dep.name}@${dep.version}`,
        type: 'depends_on'
      });
    });

    const depths = Object.keys(depsByDepth).map(Number);
    const maxDepthReached = depths.length > 0 ? Math.max(...depths) : 0;
    const avgDepth = depths.length > 0 
      ? depths.reduce((sum, d) => sum + d * depsByDepth[d].length, 0) / transitiveDeps.length 
      : 0;

    return {
      package: {
        name: packageName,
        version: metadata.version
      },
      dependencyGraph: {
        nodes,
        edges
      },
      transitiveDependencies: transitiveDeps,
      statistics: {
        totalTransitiveDependencies: transitiveDeps.length,
        maxDepth: maxDepthReached,
        averageDepth: avgDepth,
        maxDepthReached: parseInt(maxDepth)
      }
    };
  }
};

