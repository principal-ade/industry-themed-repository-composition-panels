/**
 * FileCity3DPanel - Panel framework wrapper for FileCity3D
 *
 * The core 3D visualization component is now in @principal-ai/file-city-react.
 * This file provides the panel framework integration layer.
 */

import React, { useMemo, useCallback } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  FileCity3D,
  type FileCity3DProps,
  type CityData,
  type CityBuilding,
  type CityDistrict,
  type AnimationConfig,
  type FileCity3DHighlightLayer as HighlightLayer,
  type FileCity3DHighlightItem as HighlightItem,
  type IsolationMode,
  type HeightScaling,
} from '@principal-ai/file-city-react';
import type { FileCity3DPanelPropsTyped } from '../../types';
import { buildCityDataFromFileTree, estimateLineCounts } from './buildCityData';

// Re-export types from file-city-react
export type {
  FileCity3DProps,
  CityData,
  CityBuilding,
  CityDistrict,
  AnimationConfig,
  HighlightLayer,
  HighlightItem,
  IsolationMode,
  HeightScaling,
};

// Re-export the core component with panel naming conventions
export { FileCity3D };
export const FileCity3DPanelContent = FileCity3D;

// Panel-specific props (extends base with panel context requirements)
export interface FileCity3DPanelProps extends Omit<FileCity3DProps, 'cityData'> {
  cityData: CityData;
}

/**
 * FileCity3DPanelPreview - Small preview component for panel switcher
 */
export const FileCity3DPanelPreview: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px',
        fontSize: '12px',
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {/* Mini isometric building representation */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
        <div
          style={{
            width: 8,
            height: 20,
            background: '#3178c6',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 32,
            background: '#61dafb',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 14,
            background: '#f7df1e',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 26,
            background: '#3572A5',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 18,
            background: '#dea584',
            borderRadius: 2,
          }}
        />
      </div>
      <div style={{ color: theme.colors.textSecondary, fontSize: '10px' }}>
        3D Code City
      </div>
    </div>
  );
};

/**
 * FileCity3DPanel - Panel Framework compatible component
 * Extracts data from panel context and renders FileCity3D
 */
export const FileCity3DPanel: React.FC<FileCity3DPanelPropsTyped> = ({
  context,
  events,
}) => {
  // Get data slice from typed context
  const fileTreeSlice = context.fileTree;

  // Extract data
  const fileTree = fileTreeSlice?.data;
  const isLoading = fileTreeSlice?.loading || false;

  // Build city data from file tree
  const cityData = useMemo(() => {
    if (!fileTree) return null;

    // Get root path from file tree metadata
    const rootPath = fileTree.metadata?.id || '';

    // Build and enrich city data
    const rawCityData = buildCityDataFromFileTree(fileTree, rootPath);
    return estimateLineCounts(rawCityData);
  }, [fileTree]);

  // Handle building click - emit file:open event
  const handleBuildingClick = useCallback(
    (building: CityBuilding) => {
      events?.emit({
        type: 'file:open',
        source: 'file-city-3d-panel',
        timestamp: Date.now(),
        payload: { path: building.path },
      });
    },
    [events]
  );

  return (
    <FileCity3D
      cityData={cityData!}
      width="100%"
      height="100%"
      isLoading={isLoading}
      onBuildingClick={handleBuildingClick}
      showControls={true}
      animation={{ startFlat: true, autoStartDelay: 300 }}
    />
  );
};

export default FileCity3DPanelContent;
