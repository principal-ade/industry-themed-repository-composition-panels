/**
 * IsometricPixiCanvas - Manages Pixi Application lifecycle and pixi-viewport integration
 *
 * This component handles:
 * - Pixi.js Application initialization and cleanup
 * - pixi-viewport integration with plugins (drag, wheel, pinch, decelerate)
 * - Camera animation with easing
 * - Responsive resize handling
 * - Region-aware viewport scaling
 */

import { Application } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

export interface IsometricPixiCanvasConfig {
  container: HTMLElement;
  width: number;
  height: number;
  worldWidth: number;
  worldHeight: number;
  backgroundColor?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface IsometricPixiCanvasEvents {
  onViewportMove?: (x: number, y: number) => void;
  onZoom?: (scale: number) => void;
}

/**
 * Easing function for smooth camera animations
 * Extracted from OverworldMapPanel.tsx
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class IsometricPixiCanvas {
  private _app: Application | null = null;
  private _viewport: Viewport | null = null;
  private config: IsometricPixiCanvasConfig;
  private events: IsometricPixiCanvasEvents;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;

  constructor(config: IsometricPixiCanvasConfig, events: IsometricPixiCanvasEvents = {}) {
    this.config = config;
    this.events = events;
  }

  /**
   * Initialize Pixi Application and viewport
   * Returns the app and viewport instances for further setup
   */
  async init(): Promise<{ app: Application; viewport: Viewport }> {
    // Create Pixi Application
    const app = new Application();
    this._app = app;

    // Initialize with configuration
    await app.init({
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor ?? 0x1a1a1a,
      antialias: true,
    });

    // Append canvas to container
    this.config.container.appendChild(app.canvas);

    // Create viewport
    const viewport = new Viewport({
      screenWidth: this.config.width,
      screenHeight: this.config.height,
      worldWidth: this.config.worldWidth,
      worldHeight: this.config.worldHeight,
      events: app.renderer.events,
    });
    this._viewport = viewport;

    // Add viewport to stage
    app.stage.addChild(viewport);

    // Enable viewport plugins
    viewport
      .drag()              // Enable drag to pan
      .pinch()             // Enable pinch zoom (mobile)
      .wheel()             // Enable mouse wheel zoom
      .decelerate()        // Add momentum to dragging
      .clampZoom({
        minScale: this.config.minZoom ?? 0.1,
        maxScale: this.config.maxZoom ?? 2.0,
      });

    // Emit events when viewport moves or zooms
    viewport.on('moved', () => {
      this.events.onViewportMove?.(viewport.center.x, viewport.center.y);
    });

    viewport.on('zoomed', () => {
      this.events.onZoom?.(viewport.scale.x);
    });

    // Set up resize observer
    this.setupResizeObserver();

    return { app, viewport };
  }

  /**
   * Get the Pixi Application instance
   */
  get app(): Application {
    if (!this._app) {
      throw new Error('IsometricPixiCanvas not initialized. Call init() first.');
    }
    return this._app;
  }

  /**
   * Get the pixi-viewport instance
   */
  get viewport(): Viewport {
    if (!this._viewport) {
      throw new Error('IsometricPixiCanvas not initialized. Call init() first.');
    }
    return this._viewport;
  }

  /**
   * Get the HTML canvas element
   */
  get canvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  /**
   * Setup resize observer for responsive handling
   * Extracted from OverworldMapPanel.tsx lines 830-886
   */
  private setupResizeObserver(): void {
    if (!this._app || !this._viewport) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;

        if (newWidth > 0 && newHeight > 0) {
          this.resize(newWidth, newHeight);
        }
      }
    });

    this.resizeObserver.observe(this.config.container);
  }

  /**
   * Resize the canvas and viewport
   */
  resize(width: number, height: number): void {
    if (!this._app || !this._viewport) return;

    this._app.renderer.resize(width, height);
    this._viewport.resize(width, height);

    this.config.width = width;
    this.config.height = height;
  }

  /**
   * Move viewport center immediately or smoothly
   */
  moveCenter(x: number, y: number, immediate = false): void {
    if (!this._viewport) return;

    if (immediate) {
      this._viewport.moveCenter(x, y);
    } else {
      // Use animateTo for smooth movement
      this.animateTo(x, y).catch((err) => {
        console.error('Error animating viewport:', err);
      });
    }
  }

  /**
   * Animate viewport to a position with easing
   * Extracted from OverworldMapPanel.tsx lines 772-825
   */
  async animateTo(
    targetX: number,
    targetY: number,
    duration = 800,
    easing: (t: number) => number = easeOutCubic
  ): Promise<void> {
    if (!this._app || !this._viewport) {
      throw new Error('IsometricPixiCanvas not initialized');
    }

    // Cancel any existing animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    return new Promise((resolve) => {
      const startX = this._viewport!.center.x;
      const startY = this._viewport!.center.y;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        const currentX = startX + (targetX - startX) * easedProgress;
        const currentY = startY + (targetY - startY) * easedProgress;

        this._viewport!.moveCenter(currentX, currentY);

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.animationFrameId = null;
          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Fit viewport to a region with padding
   * Extracted from OverworldMapPanel.tsx lines 772-800 (scale calculation)
   */
  fitToRegion(
    bounds: { x: number; y: number; width: number; height: number },
    padding = 50
  ): void {
    if (!this._viewport) return;

    const viewportWidth = this.config.width - padding * 2;
    const viewportHeight = this.config.height - padding * 2;

    // Calculate scale to fit the region
    const scaleX = viewportWidth / bounds.width;
    const scaleY = viewportHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // Set viewport scale
    this._viewport.setZoom(scale, true);

    // Center on region
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    this._viewport.moveCenter(centerX, centerY);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Cancel any ongoing animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Destroy viewport
    if (this._viewport) {
      this._viewport.destroy();
      this._viewport = null;
    }

    // Destroy Pixi application
    if (this._app) {
      this._app.destroy(true);
      this._app = null;
    }
  }
}
