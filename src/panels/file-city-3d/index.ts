/**
 * FileCity3DPanel exports
 */

// Panel components (framework pattern)
export {
  FileCity3DPanel,
  FileCity3DPanelContent,
  FileCity3DPanelPreview,
  // Legacy alias
  FileCity3D,
} from './FileCity3D';

// Types
export type {
  FileCity3DPanelProps,
  CityData,
  CityBuilding,
  CityDistrict,
  AnimationConfig,
  HighlightLayer,
  HighlightItem,
  IsolationMode,
} from './FileCity3D';

// Utilities for building city data from file trees
export {
  buildCityDataFromFileTree,
  enrichWithLineCounts,
  estimateLineCounts,
  createMockFileTree,
} from './buildCityData';

export type { LineCountData } from './buildCityData';
