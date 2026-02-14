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
  viewport: Viewport;
  worldContainer: Container;
  tileWidth?: number;
  tileHeight?: number;
  regionSize?: number;
  highlightColor?: number;
  intersectionColor?: number;
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
}

export class IsometricInteractionManager {
  private viewport: Viewport;
  private worldContainer: Container;
  private config: IsometricInteractionConfig;
  private events: IsometricInteractionEvents;

  private sprites: Map<string, SpriteInstance> = new Map();
  private dragState: DragState | null = null;
  private hoveredNodeId: string | null = null;
  private draggingEnabled = true;

  constructor(config: IsometricInteractionConfig, events: IsometricInteractionEvents = {}) {
    this.viewport = config.viewport;
    this.worldContainer = config.worldContainer;
    this.config = config;
    this.events = events;
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
    };

    instance.sprite.cursor = 'grabbing';
    instance.highlight.cursor = 'grabbing';

    // Show highlight
    instance.highlight.visible = true;

    // Pause viewport dragging while sprite is being dragged
    this.viewport.plugins.pause('drag');

    // Emit drag start event
    this.events.onDragStart?.(nodeId);

    // Set up global move and up handlers
    this.viewport.on('globalpointermove', this.onGlobalPointerMove);
    this.viewport.on('pointerup', this.onPointerUp);
    this.viewport.on('pointerupoutside', this.onPointerUpOutside);
  }

  /**
   * Handle global pointer move - update drag
   * Extracted from IsometricGridTest.tsx lines 192-211
   */
  private onGlobalPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.dragState || !this.dragState.isDragging) return;

    event.stopPropagation();

    const pos = event.global;
    const deltaX = pos.x - this.dragState.dragStartPos.x;
    const deltaY = pos.y - this.dragState.dragStartPos.y;

    // Convert screen delta to grid delta (reverse isometric transformation)
    const tileWidth = this.config.tileWidth ?? 32;
    const tileHeight = this.config.tileHeight ?? 16;
    const scale = this.viewport.scale.x;

    const deltaGridX =
      (deltaX / (tileWidth / 2) + deltaY / (tileHeight / 2)) / 2 / scale;
    const deltaGridY =
      (deltaY / (tileHeight / 2) - deltaX / (tileWidth / 2)) / 2 / scale;

    const newGridX = this.dragState.spriteStartPos.gridX + deltaGridX;
    const newGridY = this.dragState.spriteStartPos.gridY + deltaGridY;

    // Update sprite position
    this.dragState.instance.update(newGridX, newGridY);

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
   * Finish dragging - snap to grid and cleanup
   */
  private finishDrag(): void {
    if (!this.dragState) return;

    const { nodeId, instance } = this.dragState;

    // Snap to grid
    const snappedGridX = Math.round(instance.gridPosition.gridX);
    const snappedGridY = Math.round(instance.gridPosition.gridY);

    instance.update(snappedGridX, snappedGridY);

    // Reset cursor
    instance.sprite.cursor = 'pointer';
    instance.highlight.cursor = 'pointer';

    // Hide highlight (unless hovering)
    if (this.hoveredNodeId !== nodeId) {
      instance.highlight.visible = false;
    }

    // Resume viewport dragging
    this.viewport.plugins.resume('drag');

    // Emit drag end event
    this.events.onDragEnd?.(nodeId, snappedGridX, snappedGridY);

    // Remove global handlers
    this.viewport.off('globalpointermove', this.onGlobalPointerMove);
    this.viewport.off('pointerup', this.onPointerUp);
    this.viewport.off('pointerupoutside', this.onPointerUpOutside);

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
   * Check intersections between dragged sprite and other sprites
   * Returns array of intersecting sprite IDs
   * Extracted from OverworldMapPanel.tsx lines 745-763
   */
  checkIntersections(draggedId: string, position: GridPoint): string[] {
    const draggedInstance = this.sprites.get(draggedId);
    if (!draggedInstance) return [];

    const intersecting: string[] = [];
    const draggedRadius = 4 * (draggedInstance.sprite.scale.x || 1);

    for (const [id, instance] of this.sprites.entries()) {
      if (id === draggedId) continue;

      const otherRadius = 4 * (instance.sprite.scale.x || 1);
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
   * Cleanup resources
   */
  destroy(): void {
    // Unregister all sprites
    for (const id of Array.from(this.sprites.keys())) {
      this.unregisterSprite(id);
    }

    // Clear drag state if active
    if (this.dragState) {
      this.viewport.plugins.resume('drag');
      this.viewport.off('globalpointermove', this.onGlobalPointerMove);
      this.viewport.off('pointerup', this.onPointerUp);
      this.viewport.off('pointerupoutside', this.onPointerUpOutside);
      this.dragState = null;
    }
  }
}
