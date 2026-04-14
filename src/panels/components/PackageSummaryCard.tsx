import React, { useMemo } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  ChevronRight,
  Package,
  Layers,
  Box,
  LayoutGrid,
  Lock,
} from 'lucide-react';
import { PackageManagerIcon } from './PackageManagerIcon';
import { OrchestratorBadge } from './OrchestratorBadge';
import { getLicenseColor } from '../../utils/licenseColors';
import type { PackageLayer } from '../../types/composition';

/**
 * Find internal dependencies - packages in the monorepo that this package depends on
 */
function findInternalDependencies(
  pkg: PackageLayer,
  allPackages: PackageLayer[]
): { dependsOn: PackageLayer[]; usedBy: PackageLayer[] } {
  const currentName = pkg.packageData.name;

  // Get all dependency names for this package
  const allDeps = new Set([
    ...Object.keys(pkg.packageData.dependencies || {}),
    ...Object.keys(pkg.packageData.devDependencies || {}),
    ...Object.keys(pkg.packageData.peerDependencies || {}),
  ]);

  // Find which internal packages this one depends on
  const dependsOn = allPackages.filter(
    (p) => p.packageData.name !== currentName && allDeps.has(p.packageData.name)
  );

  // Find which internal packages depend on this one
  const usedBy = allPackages.filter((other) => {
    if (other.packageData.name === currentName) return false;
    const otherDeps = new Set([
      ...Object.keys(other.packageData.dependencies || {}),
      ...Object.keys(other.packageData.devDependencies || {}),
      ...Object.keys(other.packageData.peerDependencies || {}),
    ]);
    return otherDeps.has(currentName);
  });

  return { dependsOn, usedBy };
}

export interface PackageSummaryCardProps {
  pkg: PackageLayer;
  allPackages: PackageLayer[];
  onClick: () => void;
  onHover?: (pkg: PackageLayer | null) => void;
}

export const PackageSummaryCard: React.FC<PackageSummaryCardProps> = ({
  pkg,
  allPackages,
  onClick,
  onHover,
}) => {
  // Debug logging for version
  if (
    pkg?.packageData?.version &&
    typeof pkg.packageData.version !== 'string'
  ) {
    console.error('[PackageSummaryCard] NON-STRING VERSION DETECTED:', {
      pkgName: pkg.packageData.name,
      version: pkg.packageData.version,
      versionType: typeof pkg.packageData.version,
      versionKeys: Object.keys(pkg.packageData.version),
    });
  }

  const { theme } = useTheme();

  const deps = pkg.packageData.dependencies || {};
  const devDeps = pkg.packageData.devDependencies || {};
  const peerDeps = pkg.packageData.peerDependencies || {};
  const totalDeps =
    Object.keys(deps).length +
    Object.keys(devDeps).length +
    Object.keys(peerDeps).length;

  const { dependsOn, usedBy } = useMemo(
    () => findInternalDependencies(pkg, allPackages),
    [pkg, allPackages]
  );

  // Determine package role in dependency graph
  const packageRole = useMemo(() => {
    if (dependsOn.length === 0 && usedBy.length === 0) {
      return null; // isolated, no indicator needed
    }
    if (dependsOn.length === 0 && usedBy.length > 0) {
      return { label: 'core', icon: Box, color: '#10b981' }; // leaf/foundation
    }
    if (dependsOn.length > 0 && usedBy.length === 0) {
      return { label: 'app', icon: Layers, color: '#8b5cf6' }; // root/application
    }
    return { label: 'shared', icon: LayoutGrid, color: '#f59e0b' }; // middle layer
  }, [dependsOn.length, usedBy.length]);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '20px',
        backgroundColor: theme.colors.backgroundSecondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '0',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary;
        e.currentTarget.style.backgroundColor = theme.colors.backgroundTertiary;
        onHover?.(pkg);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border;
        e.currentTarget.style.backgroundColor =
          theme.colors.backgroundSecondary;
        onHover?.(null);
      }}
    >
      {/* Package Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PackageManagerIcon
          packageManager={pkg.packageData.packageManager}
          size={32}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: theme.fontSizes[3],
              fontWeight: theme.fontWeights.semibold,
              fontFamily: theme.fonts.body,
              color: theme.colors.text,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pkg.packageData.name}
            </span>
            {pkg.packageData.isPrivate && (
              <span
                title="Private package - not published to npm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  color: theme.colors.textSecondary,
                }}
              >
                <Lock size={14} />
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: theme.fontSizes[0],
              fontFamily: theme.fonts.body,
              color: theme.colors.textSecondary,
            }}
          >
            {pkg.packageData.path || 'root'}
          </div>
        </div>
        {/* Orchestrator badge for monorepo root packages */}
        {pkg.packageData.isMonorepoRoot &&
          pkg.packageData.monorepoMetadata?.orchestrator && (
            <OrchestratorBadge
              orchestrator={pkg.packageData.monorepoMetadata.orchestrator}
              rootRole={pkg.packageData.monorepoMetadata.rootRole}
              size="sm"
            />
          )}
        {packageRole && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              backgroundColor: packageRole.color + '20',
              color: packageRole.color,
              borderRadius: '4px',
              fontSize: theme.fontSizes[1],
              fontWeight: theme.fontWeights.medium,
              fontFamily: theme.fonts.body,
              flexShrink: 0,
            }}
          >
            <packageRole.icon size={12} />
            {packageRole.label}
          </span>
        )}
        <ChevronRight size={16} color={theme.colors.textSecondary} />
      </div>

      {/* Package Metadata (description) */}
      {pkg.packageData.description && (
        <div
          style={{
            fontSize: theme.fontSizes[1],
            fontFamily: theme.fonts.body,
            color: theme.colors.textSecondary,
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {pkg.packageData.description}
        </div>
      )}

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          fontSize: theme.fontSizes[1],
          fontFamily: theme.fonts.body,
          color: theme.colors.textSecondary,
        }}
      >
        {pkg.packageData.version &&
          typeof pkg.packageData.version === 'string' && (
            <span>v{pkg.packageData.version}</span>
          )}
        {pkg.packageData.license &&
          typeof pkg.packageData.license === 'string' && (
            <span style={{ color: getLicenseColor(pkg.packageData.license) }}>
              {pkg.packageData.license}
            </span>
          )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Package size={12} />
          <span>{totalDeps} deps</span>
        </div>
      </div>
    </button>
  );
};
