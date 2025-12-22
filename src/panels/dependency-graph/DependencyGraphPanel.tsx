import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { GraphRenderer } from '@principal-ai/principal-view-react';
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Settings2,
  AlertCircle,
  Loader2,
  GitBranch,
} from 'lucide-react';
import type { ExtendedCanvas } from '@principal-ai/principal-view-core';
import type { PanelComponentProps } from '../../types';
import type { PackageLayer } from '../../types/composition';
import type { PackagesSliceData } from '../../types/dependencies';
import { dependencyTreeToCanvas } from './dependencyToCanvas';
import { applySugiyamaLayout, type SugiyamaLayoutOptions } from './forceLayout';

export interface DependencyGraphPanelProps {
  packages: PackageLayer[];
  isLoading?: boolean;
}

interface LayoutConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacingX: number;
  nodeSpacingY: number;
  includeDevDependencies: boolean;
}

const directionLabels: Record<LayoutConfig['direction'], string> = {
  TB: 'Top → Bottom',
  BT: 'Bottom → Top',
  LR: 'Left → Right',
  RL: 'Right → Left',
};

/**
 * Content component that renders the dependency graph visualization
 */
export const DependencyGraphPanelContent: React.FC<DependencyGraphPanelProps> = ({
  packages,
  isLoading = false,
}) => {
  const { theme } = useTheme();

  const [showSettings, setShowSettings] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    direction: 'TB',
    nodeSpacingX: 100,
    nodeSpacingY: 100,
    includeDevDependencies: false,
  });
  const [layoutVersion, setLayoutVersion] = useState(0);

  // Generate canvas from packages and apply layout
  const canvas = useMemo<ExtendedCanvas | null>(() => {
    if (packages.length === 0) {
      return null;
    }

    // Convert packages to canvas
    const rawCanvas = dependencyTreeToCanvas(packages, {
      includeDevDependencies: layoutConfig.includeDevDependencies,
      includePeerDependencies: false,
    });

    // Apply layout
    const layoutOptions: SugiyamaLayoutOptions = {
      direction: layoutConfig.direction,
      nodeSpacingX: layoutConfig.nodeSpacingX,
      nodeSpacingY: layoutConfig.nodeSpacingY,
    };

    return applySugiyamaLayout(rawCanvas, layoutOptions);
  }, [packages, layoutConfig, layoutVersion]);

  const handleReapplyLayout = useCallback(() => {
    setLayoutVersion((v) => v + 1);
  }, []);

  const handleDirectionChange = (direction: LayoutConfig['direction']) => {
    setLayoutConfig((prev) => ({ ...prev, direction }));
  };

  const handleSpacingChange = (key: 'nodeSpacingX' | 'nodeSpacingY', value: number) => {
    setLayoutConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleDevDepsToggle = () => {
    setLayoutConfig((prev) => ({
      ...prev,
      includeDevDependencies: !prev.includeDevDependencies,
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: theme.colors.textSecondary,
        }}
      >
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading packages...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Empty state
  if (!canvas || packages.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: theme.colors.textSecondary,
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <AlertCircle size={32} />
        <span>No packages detected</span>
        <span style={{ fontSize: theme.fontSizes[1] }}>
          This panel requires package data from a monorepo or workspace.
        </span>
      </div>
    );
  }

  // Single package - no graph needed
  if (packages.length === 1) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: theme.colors.textSecondary,
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <GitBranch size={32} />
        <span>Single package repository</span>
        <span style={{ fontSize: theme.fontSizes[1] }}>
          Dependency graph is most useful for monorepos with multiple internal packages.
        </span>
      </div>
    );
  }

  // No edges means no internal dependencies
  if (!canvas.edges || canvas.edges.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: theme.colors.textSecondary,
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <GitBranch size={32} />
        <span>No internal dependencies</span>
        <span style={{ fontSize: theme.fontSizes[1] }}>
          The packages in this monorepo don&apos;t depend on each other.
        </span>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundSecondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} color={theme.colors.primary} />
          <span style={{ fontSize: theme.fontSizes[2], fontWeight: 500 }}>
            Dependency Graph
          </span>
          <span style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary }}>
            ({packages.length} packages, {canvas.edges?.length || 0} dependencies)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleReapplyLayout}
            title="Re-apply layout"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme.colors.text,
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Layout settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: showSettings ? theme.colors.primary : 'transparent',
              border: `1px solid ${showSettings ? theme.colors.primary : theme.colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: showSettings ? '#fff' : theme.colors.text,
            }}
          >
            <Settings2 size={14} />
            {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            padding: '12px',
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.backgroundSecondary,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Direction */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary }}>
              Direction
            </label>
            <select
              value={layoutConfig.direction}
              onChange={(e) => handleDirectionChange(e.target.value as LayoutConfig['direction'])}
              style={{
                padding: '4px 8px',
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                color: theme.colors.text,
                fontSize: theme.fontSizes[1],
              }}
            >
              {Object.entries(directionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Horizontal Spacing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary }}>
              H-Spacing: {layoutConfig.nodeSpacingX}px
            </label>
            <input
              type="range"
              min={100}
              max={400}
              step={20}
              value={layoutConfig.nodeSpacingX}
              onChange={(e) => handleSpacingChange('nodeSpacingX', Number(e.target.value))}
              style={{ width: '120px' }}
            />
          </div>

          {/* Vertical Spacing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary }}>
              V-Spacing: {layoutConfig.nodeSpacingY}px
            </label>
            <input
              type="range"
              min={60}
              max={300}
              step={20}
              value={layoutConfig.nodeSpacingY}
              onChange={(e) => handleSpacingChange('nodeSpacingY', Number(e.target.value))}
              style={{ width: '120px' }}
            />
          </div>

          {/* Include Dev Dependencies */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="include-dev-deps"
              checked={layoutConfig.includeDevDependencies}
              onChange={handleDevDepsToggle}
            />
            <label
              htmlFor="include-dev-deps"
              style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary, cursor: 'pointer' }}
            >
              Include devDependencies
            </label>
          </div>
        </div>
      )}

      {/* Graph Renderer */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GraphRenderer
          key={layoutVersion}
          canvas={canvas}
          editable={false}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 12px',
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundSecondary,
          fontSize: theme.fontSizes[1],
          color: theme.colors.textSecondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '3px',
              backgroundColor: '#6366f1',
            }}
          />
          <span>dependency</span>
        </div>
        {layoutConfig.includeDevDependencies && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '24px',
                height: '2px',
                backgroundColor: '#94a3b8',
                backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 4px, transparent 4px, transparent 8px)',
              }}
            />
            <span>devDependency</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Preview component for the panel selector
 */
export const DependencyGraphPanelPreview: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px',
        fontSize: '12px',
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <GitBranch size={14} color={theme.colors.primary} />
        <span>Dependency Graph</span>
      </div>
      <div style={{ paddingLeft: '20px', color: theme.colors.textSecondary }}>
        Visualize package dependencies
      </div>
    </div>
  );
};

/**
 * DependencyGraphPanel - Panel Framework compatible component
 * Uses context.getSlice('packages') to get package layer data
 */
export const DependencyGraphPanel: React.FC<PanelComponentProps> = ({ context }) => {
  // Get packages slice from context
  const packagesSlice = context.getSlice<PackagesSliceData>('packages');

  const packages = packagesSlice?.data?.packages ?? [];
  const isLoading = packagesSlice?.loading || false;

  return (
    <DependencyGraphPanelContent
      packages={packages}
      isLoading={isLoading}
    />
  );
};
