/**
 * RegionTracker - Tracks current region from viewport position
 *
 * This helper class handles:
 * - Region detection from viewport position
 * - Change detection with callback
 * - Skip animation flag for user-initiated drags
 */

import type { MapRegion } from '../types';

export type RegionChangeCallback = (region: MapRegion | null, skipAnimation: boolean) => void;

export class RegionTracker {
  private regions: MapRegion[];
  private regionSize: number;
  private currentRegion: MapRegion | null = null;
  private changeCallback: RegionChangeCallback | null = null;

  constructor(regions: MapRegion[], regionSize: number) {
    this.regions = regions;
    this.regionSize = regionSize;
  }

  /**
   * Get region at viewport center
   * Extracted from OverworldMapPanel.tsx lines 148-182
   */
  getCurrentRegion(viewportCenterX: number, viewportCenterY: number): MapRegion | null {
    for (const region of this.regions) {
      // Check if viewport center is within region bounds
      const inBounds =
        viewportCenterX >= region.bounds.x &&
        viewportCenterX <= region.bounds.x + region.bounds.width &&
        viewportCenterY >= region.bounds.y &&
        viewportCenterY <= region.bounds.y + region.bounds.height;

      if (inBounds) {
        return region;
      }
    }

    return null;
  }

  /**
   * Track viewport position and emit change events
   * @param viewportCenterX Current viewport center X
   * @param viewportCenterY Current viewport center Y
   * @param skipAnimation Whether to skip animation (e.g., during user drag)
   */
  trackPosition(
    viewportCenterX: number,
    viewportCenterY: number,
    skipAnimation = false
  ): void {
    const newRegion = this.getCurrentRegion(viewportCenterX, viewportCenterY);

    // Check if region changed
    if (newRegion !== this.currentRegion) {
      this.currentRegion = newRegion;

      // Emit change event
      if (this.changeCallback) {
        this.changeCallback(newRegion, skipAnimation);
      }
    }
  }

  /**
   * Register callback for region changes
   */
  onRegionChange(callback: RegionChangeCallback): void {
    this.changeCallback = callback;
  }

  /**
   * Update region list (for dynamic maps)
   */
  updateRegions(regions: MapRegion[]): void {
    this.regions = regions;

    // Reset current region if it no longer exists
    if (this.currentRegion) {
      const stillExists = regions.some((r) => r.id === this.currentRegion!.id);
      if (!stillExists) {
        this.currentRegion = null;
      }
    }
  }

  /**
   * Get the current region (read-only)
   */
  get current(): MapRegion | null {
    return this.currentRegion;
  }

  /**
   * Get all regions (read-only)
   */
  getAllRegions(): MapRegion[] {
    return [...this.regions];
  }

  /**
   * Find region by ID
   */
  findRegionById(id: string): MapRegion | null {
    return this.regions.find((r) => r.id === id) || null;
  }

  /**
   * Get next region (for navigation)
   */
  getNextRegion(): MapRegion | null {
    if (this.regions.length === 0) return null;
    if (!this.currentRegion) return this.regions[0];

    const currentIndex = this.regions.findIndex((r) => r.id === this.currentRegion!.id);
    const nextIndex = (currentIndex + 1) % this.regions.length;

    return this.regions[nextIndex];
  }

  /**
   * Get previous region (for navigation)
   */
  getPreviousRegion(): MapRegion | null {
    if (this.regions.length === 0) return null;
    if (!this.currentRegion) return this.regions[this.regions.length - 1];

    const currentIndex = this.regions.findIndex((r) => r.id === this.currentRegion!.id);
    const previousIndex = (currentIndex - 1 + this.regions.length) % this.regions.length;

    return this.regions[previousIndex];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.changeCallback = null;
    this.currentRegion = null;
    this.regions = [];
  }
}
