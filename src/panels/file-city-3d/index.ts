/**
 * FileCity3DPanel exports
 *
 * Core component is now in @principal-ai/file-city-react.
 * This module provides panel framework integration.
 */

// Panel components (framework pattern)
export {
  FileCity3DPanel,
  FileCity3DPanelContent,
  FileCity3DPanelPreview,
  // Legacy alias
  FileCity3D,
} from './FileCity3D';

// Types (re-exported from @principal-ai/file-city-react)
export type {
  FileCity3DPanelProps,
  FileCity3DProps,
  CityData,
  CityBuilding,
  CityDistrict,
  AnimationConfig,
  HighlightLayer,
  HighlightItem,
  IsolationMode,
  HeightScaling,
} from './FileCity3D';

// Utilities for building city data from file trees
export {
  buildCityDataFromFileTree,
  enrichWithLineCounts,
  estimateLineCounts,
  createMockFileTree,
} from './buildCityData';

export type { LineCountData } from './buildCityData';
