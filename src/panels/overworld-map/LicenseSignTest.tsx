/**
 * License Sign Test - Demonstrates license-based sign/archway styling
 * Uses the actual OverworldMapPanelContent component
 */

import React, { useMemo } from 'react';
import { OverworldMapPanelContent } from './OverworldMapPanel';
import type { GenericNode } from './genericMapper';

export const LicenseSignTest: React.FC = () => {
  // Create nodes with different licenses
  const nodes = useMemo<GenericNode[]>(() => {
    return [
      // MIT licensed (permissive - flower arch, open grass)
      {
        id: 'react',
        name: 'react',
        size: 2.0,
        language: 'typescript',
        license: 'MIT',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/69631?s=64', // Facebook
      },
      {
        id: 'vue',
        name: 'vue',
        size: 2.0,
        language: 'typescript',
        license: 'MIT',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/6128107?s=64', // Vue
      },
      {
        id: 'lodash',
        name: 'lodash',
        size: 1.5,
        language: 'javascript',
        license: 'MIT',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/4303?s=64', // lodash
      },

      // Apache licensed (formal - shield sign, cobblestone path)
      {
        id: 'kafka',
        name: 'kafka',
        size: 2.0,
        language: 'java',
        license: 'Apache-2.0',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/47359?s=64', // Apache
      },
      {
        id: 'spark',
        name: 'spark',
        size: 2.0,
        language: 'java',
        license: 'Apache-2.0',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/47359?s=64', // Apache
      },
      {
        id: 'hadoop',
        name: 'hadoop',
        size: 1.5,
        language: 'java',
        license: 'Apache-2.0',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/47359?s=64', // Apache
      },

      // GPL licensed (copyleft - iron arch, picket fence)
      {
        id: 'linux',
        name: 'linux',
        size: 2.0,
        language: 'c',
        license: 'GPL-3.0',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/1024025?s=64', // torvalds
      },
      {
        id: 'bash',
        name: 'bash',
        size: 1.5,
        language: 'c',
        license: 'GPL-3.0',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/1000?s=64', // GNU
      },
      {
        id: 'gcc',
        name: 'gcc',
        size: 2.0,
        language: 'c',
        license: 'GPL-3.0',
        ownerAvatar: 'https://avatars.githubusercontent.com/u/1000?s=64', // GNU
      },
    ];
  }, []);

  // Calculate stats for display
  const stats = useMemo(() => {
    const byLicense = nodes.reduce(
      (acc, n) => {
        const license = n.license || 'Unknown';
        acc[license] = (acc[license] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { total: nodes.length, byLicense };
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
          License Sign Test
        </div>
        <div>Total: {stats.total} repos</div>
        <div style={{ marginTop: '8px', fontSize: '12px' }}>
          {Object.entries(stats.byLicense).map(([license, count]) => (
            <div key={license} style={{ color: getLicenseColor(license) }}>
              {license}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          border: '2px solid #666',
          pointerEvents: 'none',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Legend</div>
        <div style={{ color: '#90ee90' }}>MIT: Flower arch + open grass</div>
        <div style={{ color: '#ffffff' }}>
          Apache: Shield sign + cobblestone
        </div>
        <div style={{ color: '#6699ff' }}>GPL: Iron arch + picket fence</div>
      </div>
    </div>
  );
};

function getLicenseColor(license: string): string {
  switch (license) {
    case 'MIT':
      return '#90ee90'; // Light green
    case 'Apache-2.0':
      return '#ffffff'; // White
    case 'GPL-3.0':
      return '#6699ff'; // Light blue
    default:
      return '#94a3b8'; // Gray
  }
}
