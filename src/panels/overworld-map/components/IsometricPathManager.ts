/**
 * IsometricPathManager - Manages dynamic path updates during sprite drag
 *
 * This helper class handles:
 * - Tracking node-to-path relationships
 * - Updating only affected paths during drag
 * - Reusing Graphics objects for efficiency
 */

import type { Graphics } from 'pixi.js';
import type { GridPoint } from '../types';
import type { IsometricRenderer } from './IsometricRenderer';

export interface PathConnectionData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  graphics: Graphics;
}

export class IsometricPathManager {
  private pathConnections: PathConnectionData[];
  private nodePositions: Map<string, GridPoint>;
  private renderer: IsometricRenderer;

  // Index for quick lookup: nodeId -> paths connected to that node
  private nodeToPathsIndex: Map<string, PathConnectionData[]> = new Map();

  constructor(
    pathConnections: PathConnectionData[],
    nodePositions: Map<string, GridPoint>,
    renderer: IsometricRenderer
  ) {
    this.pathConnections = pathConnections;
    this.nodePositions = nodePositions;
    this.renderer = renderer;

    // Build index
    this.buildIndex();
  }

  /**
   * Build index of node-to-paths relationships for fast lookup
   */
  private buildIndex(): void {
    for (const path of this.pathConnections) {
      // Add to fromNode's paths
      if (!this.nodeToPathsIndex.has(path.fromNodeId)) {
        this.nodeToPathsIndex.set(path.fromNodeId, []);
      }
      this.nodeToPathsIndex.get(path.fromNodeId)!.push(path);

      // Add to toNode's paths
      if (!this.nodeToPathsIndex.has(path.toNodeId)) {
        this.nodeToPathsIndex.set(path.toNodeId, []);
      }
      this.nodeToPathsIndex.get(path.toNodeId)!.push(path);
    }
  }

  /**
   * Update paths connected to a moving node
   * Extracted from OverworldMapPanel.tsx lines 569, 636, 739
   */
  updateNodePosition(nodeId: string, gridX: number, gridY: number): void {
    // Update node position in map
    this.nodePositions.set(nodeId, { gridX, gridY });

    // Get all paths connected to this node
    const connectedPaths = this.getConnectedPaths(nodeId);

    // Redraw each connected path
    for (const path of connectedPaths) {
      const fromPos = this.nodePositions.get(path.fromNodeId);
      const toPos = this.nodePositions.get(path.toNodeId);

      if (fromPos && toPos) {
        this.renderer.updatePath(path.graphics, fromPos, toPos);
      }
    }
  }

  /**
   * Get all paths connected to a node
   */
  getConnectedPaths(nodeId: string): PathConnectionData[] {
    return this.nodeToPathsIndex.get(nodeId) || [];
  }

  /**
   * Add a new path (for dynamic path creation)
   */
  addPath(path: PathConnectionData): void {
    this.pathConnections.push(path);

    // Update index
    if (!this.nodeToPathsIndex.has(path.fromNodeId)) {
      this.nodeToPathsIndex.set(path.fromNodeId, []);
    }
    this.nodeToPathsIndex.get(path.fromNodeId)!.push(path);

    if (!this.nodeToPathsIndex.has(path.toNodeId)) {
      this.nodeToPathsIndex.set(path.toNodeId, []);
    }
    this.nodeToPathsIndex.get(path.toNodeId)!.push(path);
  }

  /**
   * Remove a path (for dynamic path removal)
   */
  removePath(pathId: string): void {
    const pathIndex = this.pathConnections.findIndex((p) => p.id === pathId);
    if (pathIndex === -1) return;

    const path = this.pathConnections[pathIndex];
    this.pathConnections.splice(pathIndex, 1);

    // Update index
    const fromPaths = this.nodeToPathsIndex.get(path.fromNodeId);
    if (fromPaths) {
      const fromIndex = fromPaths.findIndex((p) => p.id === pathId);
      if (fromIndex !== -1) {
        fromPaths.splice(fromIndex, 1);
      }
    }

    const toPaths = this.nodeToPathsIndex.get(path.toNodeId);
    if (toPaths) {
      const toIndex = toPaths.findIndex((p) => p.id === pathId);
      if (toIndex !== -1) {
        toPaths.splice(toIndex, 1);
      }
    }

    // Destroy graphics
    path.graphics.destroy();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.nodeToPathsIndex.clear();
    this.pathConnections = [];
    this.nodePositions.clear();
  }
}
