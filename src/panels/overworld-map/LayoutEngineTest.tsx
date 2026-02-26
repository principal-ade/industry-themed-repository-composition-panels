/**
 * Layout Engine Test - Demonstrates automatic sprite placement
 * Uses the actual OverworldMapPanelContent component
 */

import React, { useMemo } from 'react';
import { OverworldMapPanelContent } from './OverworldMapPanel';
import type { GenericNode } from './genericMapper';

export interface SpriteConfig {
  size: number;
  language?: string;
  count: number;
}

export interface LayoutEngineTestProps {
  /** Distribution of sprite sizes and languages */
  sprites?: SpriteConfig[];

  /** Legacy: Distribution of sprite sizes (count per size) */
  sizeDistribution?: {
    size1_0?: number; // 1.0x sprites
    size1_5?: number; // 1.5x sprites
    size2_0?: number; // 2.0x sprites
    size2_5?: number; // 2.5x sprites
    size3_0?: number; // 3.0x sprites
  };
}

export const LayoutEngineTest: React.FC<LayoutEngineTestProps> = ({
  sprites,
  sizeDistribution = {
    size1_0: 5,
    size1_5: 4,
    size2_0: 4,
    size2_5: 3,
    size3_0: 2,
  },
}) => {
  // Convert sprite configs to GenericNode[]
  const nodes = useMemo<GenericNode[]>(() => {
    const result: GenericNode[] = [];
    let nodeId = 0;

    if (sprites) {
      // Use new sprites prop with language support
      for (const sprite of sprites) {
        for (let i = 0; i < sprite.count; i++) {
          const language = sprite.language || 'default';
          result.push({
            id: `sprite-${nodeId}`,
            name: `${sprite.size.toFixed(1)}x ${language}`,
            size: sprite.size,
            language: sprite.language,
            category: language,
          });
          nodeId++;
        }
      }
    } else {
      // Fall back to legacy sizeDistribution prop
      const sizes: Array<{ size: number; count: number }> = [
        { size: 1.0, count: sizeDistribution.size1_0 || 0 },
        { size: 1.5, count: sizeDistribution.size1_5 || 0 },
        { size: 2.0, count: sizeDistribution.size2_0 || 0 },
        { size: 2.5, count: sizeDistribution.size2_5 || 0 },
        { size: 3.0, count: sizeDistribution.size3_0 || 0 },
      ];

      for (const { size, count } of sizes) {
        for (let i = 0; i < count; i++) {
          result.push({
            id: `sprite-${nodeId}`,
            name: `${size.toFixed(1)}x`,
            size,
            category: 'default',
          });
          nodeId++;
        }
      }
    }

    return result;
  }, [sprites, sizeDistribution]);

  // Calculate stats for display
  const stats = useMemo(() => {
    const total = nodes.length;
    const bySize = nodes.reduce(
      (acc, n) => {
        const key = `${(n.size || 1).toFixed(1)}x`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { total, bySize };
  }, [nodes]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <OverworldMapPanelContent nodes={nodes} includeDevDependencies={false} />

      {/* Stats overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '2px solid #22c55e',
          pointerEvents: 'none',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Layout Test
        </div>
        <div>Total: {stats.total} sprites</div>
        <div style={{ marginTop: '4px', fontSize: '12px', color: '#94a3b8' }}>
          {Object.entries(stats.bySize)
            .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
            .map(([size, count]) => `${count}×${size}`)
            .join(', ')}
        </div>
      </div>
    </div>
  );
};
