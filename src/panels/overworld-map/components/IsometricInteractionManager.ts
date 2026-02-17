/**
 * IsometricInteractionManager - Manages all sprite interactions
 *
 * This component handles:
 * - Sprite drag-and-drop with viewport pause/resume
 * - Grid snapping on release
 * - Hover state management
 * - Intersection detection with visual feedback
 * - Region boundary constraints
 * - Event callbacks for React integration
 */

import type { Viewport } from 'pixi-viewport';
import type { Container, FederatedPointerEvent } from 'pixi.js';
import type { SpriteInstance } from './IsometricRenderer';
import type { GridPoint, MapRegion } from '../types';

export interface IsometricInteractionConfig {
  viewport: Viewport | null; // Optional - if null, uses worldContainer for events
  worldContainer: Container;
  tileWidth?: number;
  tileHeight?: number;
  regionSize?: number;
  highlightColor?: number;
  intersectionColor?: number;
  containerOffset?: { x: number; y: number };
  mapBounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface IsometricInteractionEvents {
  onDragStart?: (nodeId: string) => void;
  onDragMove?: (nodeId: string, gridX: number, gridY: number) => void;
  onDragEnd?: (nodeId: string, gridX: number, gridY: number) => void;
  onHover?: (nodeId: string) => void;
  onHoverEnd?: (nodeId: string) => void;
  onRegionChange?: (region: MapRegion | null) => void;
}

interface DragState {
  nodeId: string;
  instance: SpriteInstance;
  isDragging: boolean;
  dragStartPos: { x: number; y: number };
  spriteStartPos: { gridX: number; gridY: number };
  nearbySprites: Set<string>; // Track which sprites have visible highlights due to proximity
}

export class IsometricInteractionManager {
  private viewport: Viewport | null;
  private worldContainer: Container;
  private config: IsometricInteractionConfig;
  private events: IsometricInteractionEvents;

  private sprites: Map<string, SpriteInstance> = new Map();
  private dragState: DragState | null = null;
  private hoveredNodeId: string | null = null;
  private draggingEnabled = true;
  private mapBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  constructor(config: IsometricInteractionConfig, events: IsometricInteractionEvents = {}) {
    this.viewport = config.viewport;
    this.worldContainer = config.worldContainer;
    this.config = config;
    this.events = events;
    this.mapBounds = config.mapBounds || null;
  }

  /**
   * Register a sprite for interaction
   * Extracted from IsometricGridTest.tsx lines 172-243
   */
  registerSprite(id: string, instance: SpriteInstance): void {
    this.sprites.set(id, instance);

    // Make both sprite AND highlight interactive
    // (Users click on the yellow diamond, not the small sprite)
    instance.sprite.eventMode = 'static';
    instance.sprite.cursor = 'pointer';
    instance.highlight.eventMode = 'static';
    instance.highlight.cursor = 'pointer';

    // Set up event handlers on BOTH objects
    const setupHandlers = (target: typeof instance.sprite | typeof instance.highlight) => {
      target.on('pointerdown', (event: FederatedPointerEvent) => {
        this.onPointerDown(id, instance, event);
      });

      target.on('pointerover', () => {
        this.onPointerOver(id, instance);
      });

      target.on('pointerout', () => {
        this.onPointerOut(id, instance);
      });
    };

    setupHandlers(instance.sprite);
    setupHandlers(instance.highlight);
  }

  /**
   * Unregister a sprite
   */
  unregisterSprite(id: string): void {
    const instance = this.sprites.get(id);
    if (instance) {
      // Remove handlers from both sprite and highlight
      instance.sprite.off('pointerdown');
      instance.sprite.off('pointerover');
      instance.sprite.off('pointerout');
      instance.highlight.off('pointerdown');
      instance.highlight.off('pointerover');
      instance.highlight.off('pointerout');
      this.sprites.delete(id);
    }
  }

  /**
   * Clear all sprite registrations
   * Used when scene is recreated but interaction manager persists
   */
  clearSprites(): void {
    for (const id of Array.from(this.sprites.keys())) {
      this.unregisterSprite(id);
    }
  }

  /**
   * Handle pointer down - start dragging
   */
  private onPointerDown(
    nodeId: string,
    instance: SpriteInstance,
    event: FederatedPointerEvent
  ): void {
    if (!this.draggingEnabled) return;

    event.stopPropagation(); // Prevent viewport from dragging

    this.dragState = {
      nodeId,
      instance,
      isDragging: true,
      dragStartPos: { x: event.global.x, y: event.global.y },
      spriteStartPos: { gridX: instance.gridPosition.gridX, gridY: instance.gridPosition.gridY },
      nearbySprites: new Set(),
    };

    instance.sprite.cursor = 'grabbing';
    instance.highlight.cursor = 'grabbing';

    // Show highlight
    instance.highlight.visible = true;

    // Pause viewport dragging while sprite is being dragged (if using pixi-viewport)
    if (this.viewport) {
      this.viewport.plugins.pause('drag');
    }

    // Emit drag start event
    this.events.onDragStart?.(nodeId);

    // Set up global move and up handlers
    // Use viewport if available, otherwise use worldContainer
    const eventTarget = this.viewport || this.worldContainer;
    eventTarget.on('globalpointermove', this.onGlobalPointerMove);
    eventTarget.on('pointerup', this.onPointerUp);
    eventTarget.on('pointerupoutside', this.onPointerUpOutside);
  }

  /**
   * Clamp grid position to map bounds, accounting for sprite boundary size
   */
  private clampToMapBounds(gridX: number, gridY: number, spriteSize?: number): { gridX: number; gridY: number } {
    if (!this.mapBounds) {
      return { gridX, gridY };
    }

    // Account for boundary radius (boundary extends 2 × size in each direction)
    const boundaryRadius = spriteSize ? 2 * spriteSize : 0;

    const clamped = {
      gridX: Math.max(
        this.mapBounds.minX + boundaryRadius,
        Math.min(this.mapBounds.maxX - boundaryRadius, gridX)
      ),
      gridY: Math.max(
        this.mapBounds.minY + boundaryRadius,
        Math.min(this.mapBounds.maxY - boundaryRadius, gridY)
      ),
    };

    return clamped;
  }

  /**
   * Handle global pointer move - update drag
   * Extracted from IsometricGridTest.tsx lines 192-211
   */
  private onGlobalPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.dragState || !this.dragState.isDragging) return;

    event.stopPropagation();

    // Convert screen coordinates to world coordinates (relative to worldContainer)
    // Use viewport.toWorld() if available, otherwise use worldContainer.toLocal()
    const worldPos = this.viewport
      ? this.viewport.toWorld(event.global.x, event.global.y)
      : this.worldContainer.toLocal(event.global);
    const worldStartPos = this.viewport
      ? this.viewport.toWorld(this.dragState.dragStartPos.x, this.dragState.dragStartPos.y)
      : this.worldContainer.toLocal(this.dragState.dragStartPos);

    // Account for worldContainer offset
    const containerOffsetX = this.worldContainer.x || 0;
    const containerOffsetY = this.worldContainer.y || 0;

    const deltaX = (worldPos.x - worldStartPos.x);
    const deltaY = (worldPos.y - worldStartPos.y);

    // Convert world delta to grid delta (reverse isometric transformation)
    const tileWidth = this.config.tileWidth ?? 64;
    const tileHeight = this.config.tileHeight ?? 32;

    const deltaGridX = (deltaX / (tileWidth / 2) + deltaY / (tileHeight / 2)) / 2;
    const deltaGridY = (deltaY / (tileHeight / 2) - deltaX / (tileWidth / 2)) / 2;

    let newGridX = this.dragState.spriteStartPos.gridX + deltaGridX;
    let newGridY = this.dragState.spriteStartPos.gridY + deltaGridY;

    // Clamp to map bounds (accounting for sprite boundary size)
    const clamped = this.clampToMapBounds(newGridX, newGridY, this.dragState.instance.size);
    newGridX = clamped.gridX;
    newGridY = clamped.gridY;

    // Check for collisions - if collision, don't update position
    if (this.wouldCollide(this.dragState.nodeId, { gridX: newGridX, gridY: newGridY })) {
      // Keep current position, don't move
      return;
    }

    // Update sprite position
    this.dragState.instance.update(newGridX, newGridY);

    // Update nearby sprite highlights
    this.updateNearbyHighlights(this.dragState.nodeId, { gridX: newGridX, gridY: newGridY });

    // Emit drag move event
    this.events.onDragMove?.(this.dragState.nodeId, newGridX, newGridY);
  };

  /**
   * Handle pointer up - end dragging and snap to grid
   * Extracted from IsometricGridTest.tsx lines 221-231
   */
  private onPointerUp = (event: FederatedPointerEvent): void => {
    if (!this.dragState) return;

    event.stopPropagation();

    this.finishDrag();
  };

  /**
   * Handle pointer up outside - end dragging
   */
  private onPointerUpOutside = (event: FederatedPointerEvent): void => {
    if (!this.dragState) return;

    event.stopPropagation();

    this.finishDrag();
  };

  /**
   * Update highlights for sprites near the dragged sprite
   * Shows highlights for sprites within 1 tile of the dragged sprite's boundary
   */
  private updateNearbyHighlights(draggedId: string, position: GridPoint): void {
    if (!this.dragState) return;

    const draggedInstance = this.sprites.get(draggedId);
    if (!draggedInstance) return;

    const draggedRadius = 2 * draggedInstance.size;
    const proximityThreshold = 1; // Show highlights within 1 tile of boundary

    const currentNearby = new Set<string>();

    for (const [id, instance] of this.sprites.entries()) {
      if (id === draggedId) continue;

      const otherRadius = 2 * instance.size;
      const distance = Math.sqrt(
        Math.pow(position.gridX - instance.gridPosition.gridX, 2) +
          Math.pow(position.gridY - instance.gridPosition.gridY, 2)
      );

      // Show highlight if within 1 tile of boundaries touching
      if (distance < draggedRadius + otherRadius + proximityThreshold) {
        currentNearby.add(id);
        instance.highlight.visible = true;
      } else {
        // Hide if it was previously shown as nearby (but not if it's being hovered)
        if (this.dragState.nearbySprites.has(id) && this.hoveredNodeId !== id) {
          instance.highlight.visible = false;
        }
      }
    }

    this.dragState.nearbySprites = currentNearby;
  }

  /**
   * Finish dragging - snap to grid and cleanup
   */
  private finishDrag(): void {
    if (!this.dragState) return;

    const { nodeId, instance, nearbySprites } = this.dragState;

    // Snap to grid
    let snappedGridX = Math.round(instance.gridPosition.gridX);
    let snappedGridY = Math.round(instance.gridPosition.gridY);

    // Clamp to map bounds (accounting for sprite boundary size)
    const clamped = this.clampToMapBounds(snappedGridX, snappedGridY, instance.size);
    snappedGridX = clamped.gridX;
    snappedGridY = clamped.gridY;

    // Check if snapped position would cause collision
    // If so, revert to start position
    if (this.wouldCollide(nodeId, { gridX: snappedGridX, gridY: snappedGridY })) {
      snappedGridX = this.dragState.spriteStartPos.gridX;
      snappedGridY = this.dragState.spriteStartPos.gridY;
    }

    instance.update(snappedGridX, snappedGridY);

    // Reset cursor
    instance.sprite.cursor = 'pointer';
    instance.highlight.cursor = 'pointer';

    // Hide highlight (unless hovering)
    if (this.hoveredNodeId !== nodeId) {
      instance.highlight.visible = false;
    }

    // Hide nearby sprite highlights (unless hovering)
    for (const nearbyId of nearbySprites) {
      const nearbyInstance = this.sprites.get(nearbyId);
      if (nearbyInstance && this.hoveredNodeId !== nearbyId) {
        nearbyInstance.highlight.visible = false;
      }
    }

    // Resume viewport dragging (if using pixi-viewport)
    if (this.viewport) {
      this.viewport.plugins.resume('drag');
    }

    // Emit drag end event
    this.events.onDragEnd?.(nodeId, snappedGridX, snappedGridY);

    // Remove global handlers
    const eventTarget = this.viewport || this.worldContainer;
    eventTarget.off('globalpointermove', this.onGlobalPointerMove);
    eventTarget.off('pointerup', this.onPointerUp);
    eventTarget.off('pointerupoutside', this.onPointerUpOutside);

    // Clear drag state
    this.dragState = null;
  }

  /**
   * Handle pointer over - show highlight
   */
  private onPointerOver(nodeId: string, instance: SpriteInstance): void {
    this.hoveredNodeId = nodeId;
    instance.highlight.visible = true;
    this.events.onHover?.(nodeId);
  }

  /**
   * Handle pointer out - hide highlight (unless dragging)
   */
  private onPointerOut(nodeId: string, instance: SpriteInstance): void {
    if (this.hoveredNodeId === nodeId) {
      this.hoveredNodeId = null;
    }

    // Only hide if not dragging
    if (!this.dragState || this.dragState.nodeId !== nodeId) {
      instance.highlight.visible = false;
    }

    this.events.onHoverEnd?.(nodeId);
  }

  /**
   * Enable or disable dragging
   */
  setDraggable(enabled: boolean): void {
    this.draggingEnabled = enabled;

    // Update cursor for all sprites and highlights
    for (const instance of this.sprites.values()) {
      instance.sprite.cursor = enabled ? 'pointer' : 'default';
      instance.highlight.cursor = enabled ? 'pointer' : 'default';
    }
  }

  /**
   * Check if position would cause boundary overlap with other sprites
   * Boundary size is 4 × size tiles, extending 2 × size in each direction
   */
  private wouldCollide(draggedId: string, position: GridPoint): boolean {
    const draggedInstance = this.sprites.get(draggedId);
    if (!draggedInstance) return false;

    // Boundary extends 2 × size in each direction (total 4 × size)
    const draggedRadius = 2 * draggedInstance.size;

    for (const [id, instance] of this.sprites.entries()) {
      if (id === draggedId) continue;

      const otherRadius = 2 * instance.size;

      // Calculate distance between centers
      const distance = Math.sqrt(
        Math.pow(position.gridX - instance.gridPosition.gridX, 2) +
          Math.pow(position.gridY - instance.gridPosition.gridY, 2)
      );

      // Collision if distance is less than sum of radii
      if (distance < draggedRadius + otherRadius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check intersections between dragged sprite and other sprites
   * Returns array of intersecting sprite IDs
   * Extracted from OverworldMapPanel.tsx lines 745-763
   */
  checkIntersections(draggedId: string, position: GridPoint): string[] {
    const draggedInstance = this.sprites.get(draggedId);
    if (!draggedInstance) return [];

    const intersecting: string[] = [];
    const draggedRadius = 2 * draggedInstance.size;

    for (const [id, instance] of this.sprites.entries()) {
      if (id === draggedId) continue;

      const otherRadius = 2 * instance.size;
      const distance = Math.sqrt(
        Math.pow(position.gridX - instance.gridPosition.gridX, 2) +
          Math.pow(position.gridY - instance.gridPosition.gridY, 2)
      );

      if (distance < draggedRadius + otherRadius) {
        intersecting.push(id);

        // Change highlight color to red for intersection
        instance.highlight.clear();
        instance.highlight.strokeStyle = { width: 3, color: 0xff0000 };
        instance.highlight.fillStyle = { color: 0xff0000, alpha: 0.2 };
        instance.highlight.beginPath();
        // Draw highlight diamond...
        instance.highlight.fill();
        instance.highlight.stroke();
      } else {
        // Reset to normal highlight color if was red
        instance.highlight.clear();
        instance.highlight.strokeStyle = { width: 3, color: 0xffff00 };
        instance.highlight.fillStyle = { color: 0xffff00, alpha: 0.1 };
        instance.highlight.beginPath();
        // Draw highlight diamond...
        instance.highlight.fill();
        instance.highlight.stroke();
      }
    }

    return intersecting;
  }

  /**
   * Check if a sprite is currently being dragged
   */
  isDragging(): boolean {
    return this.dragState !== null && this.dragState.isDragging;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Unregister all sprites
    for (const id of Array.from(this.sprites.keys())) {
      this.unregisterSprite(id);
    }

    // Clear drag state if active
    if (this.dragState) {
      if (this.viewport) {
        this.viewport.plugins.resume('drag');
      }
      const eventTarget = this.viewport || this.worldContainer;
      eventTarget.off('globalpointermove', this.onGlobalPointerMove);
      eventTarget.off('pointerup', this.onPointerUp);
      eventTarget.off('pointerupoutside', this.onPointerUpOutside);
      this.dragState = null;
    }
  }
}
