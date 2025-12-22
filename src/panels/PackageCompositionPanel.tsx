import React, { useState, useMemo } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileCode,
  Terminal,
  Settings,
  Folder,
  ExternalLink,
  Package,
  ArrowRight,
  Layers,
  Box,
  LayoutGrid,
} from 'lucide-react';
import { PackageManagerIcon } from './components/PackageManagerIcon';
import { DependencyRow, FilterBar, DependencyInfoModal, LensReadinessSection, OtherScriptsSection, OrchestratorBadge, ConfigList } from './components';
import type { PanelComponentProps } from '../types';
import type { PackageLayer, ConfigFile, PackageCommand } from '../types/composition';
import type { PackagesSliceData, DependencyItem } from '../types/dependencies';

/**
 * Sort order for dependency types: peer, production, development
 */
const dependencyTypeOrder: Record<DependencyItem['dependencyType'], number> = {
  peer: 0,
  production: 1,
  development: 2,
};

/**
 * Extract dependencies from a PackageLayer into DependencyItems
 */
function extractDependencies(packageLayer: PackageLayer): DependencyItem[] {
  const { dependencies, devDependencies, peerDependencies } = packageLayer.packageData;

  const items: DependencyItem[] = [];

  if (dependencies) {
    Object.entries(dependencies).forEach(([name, version]) => {
      items.push({ name, version, dependencyType: 'production' });
    });
  }

  if (devDependencies) {
    Object.entries(devDependencies).forEach(([name, version]) => {
      items.push({ name, version, dependencyType: 'development' });
    });
  }

  if (peerDependencies) {
    Object.entries(peerDependencies).forEach(([name, version]) => {
      items.push({ name, version, dependencyType: 'peer' });
    });
  }

  // Sort by type (peer, prod, dev) then by name
  return items.sort((a, b) => {
    const typeCompare = dependencyTypeOrder[a.dependencyType] - dependencyTypeOrder[b.dependencyType];
    if (typeCompare !== 0) return typeCompare;
    return a.name.localeCompare(b.name);
  });
}

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

interface PackageSummaryCardProps {
  pkg: PackageLayer;
  allPackages: PackageLayer[];
  onClick: () => void;
  onHover?: (pkg: PackageLayer | null) => void;
}

const PackageSummaryCard: React.FC<PackageSummaryCardProps> = ({ pkg, allPackages, onClick, onHover }) => {
  const { theme } = useTheme();

  const deps = pkg.packageData.dependencies || {};
  const devDeps = pkg.packageData.devDependencies || {};
  const peerDeps = pkg.packageData.peerDependencies || {};
  const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length + Object.keys(peerDeps).length;

  const configFilesArray = pkg.configFiles
    ? Object.values(pkg.configFiles).filter((c) => c?.exists)
    : [];
  const localConfigs = configFilesArray.filter((c) => !c?.isInherited).length;
  const inheritedConfigs = configFilesArray.filter((c) => c?.isInherited).length;

  const commands = pkg.packageData.availableCommands?.length || 0;

  const { dependsOn, usedBy } = useMemo(
    () => findInternalDependencies(pkg, allPackages),
    [pkg, allPackages]
  );

  const hasInternalDeps = dependsOn.length > 0 || usedBy.length > 0;

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
        padding: '12px',
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
        e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
        onHover?.(null);
      }}
    >
      {/* Package Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PackageManagerIcon packageManager={pkg.packageData.packageManager} size={20} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: theme.fontSizes[2],
              fontWeight: 600,
              color: theme.colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pkg.packageData.name}
          </div>
          <div
            style={{
              fontSize: theme.fontSizes[0],
              color: theme.colors.textSecondary,
            }}
          >
            {pkg.packageData.path || '/'}
            {pkg.packageData.version && ` • v${pkg.packageData.version}`}
          </div>
        </div>
        {/* Orchestrator badge for monorepo root packages */}
        {pkg.packageData.isMonorepoRoot && pkg.packageData.monorepoMetadata?.orchestrator && (
          <OrchestratorBadge
            orchestrator={pkg.packageData.monorepoMetadata.orchestrator}
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
              fontSize: theme.fontSizes[0],
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            <packageRole.icon size={12} />
            {packageRole.label}
          </span>
        )}
        <ChevronRight size={16} color={theme.colors.textSecondary} />
      </div>

      {/* Package Metadata (description, license) */}
      {(pkg.packageData.description || pkg.packageData.license) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {pkg.packageData.description && (
            <div
              style={{
                fontSize: theme.fontSizes[0],
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
          {pkg.packageData.license && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: theme.fontSizes[0],
              }}
            >
              <span
                style={{
                  padding: '1px 6px',
                  backgroundColor: theme.colors.textSecondary + '15',
                  color: theme.colors.textSecondary,
                  borderRadius: '3px',
                  fontWeight: 500,
                }}
              >
                {pkg.packageData.license}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Internal Dependencies */}
      {hasInternalDeps && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: theme.fontSizes[0],
          }}
        >
          {dependsOn.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: theme.colors.textSecondary, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowRight size={10} />
                uses
              </span>
              {dependsOn.map((dep) => (
                <span
                  key={dep.id}
                  style={{
                    padding: '2px 6px',
                    backgroundColor: theme.colors.primary + '15',
                    color: theme.colors.primary,
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  {dep.packageData.name}
                </span>
              ))}
            </div>
          )}
          {usedBy.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: theme.colors.textSecondary }}>used by</span>
              {usedBy.map((dep) => (
                <span
                  key={dep.id}
                  style={{
                    padding: '2px 6px',
                    backgroundColor: theme.colors.textSecondary + '20',
                    color: theme.colors.textSecondary,
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  {dep.packageData.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          fontSize: theme.fontSizes[0],
          color: theme.colors.textSecondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Package size={12} />
          <span>{totalDeps} deps</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Settings size={12} />
          <span>
            {configFilesArray.length} configs
            {inheritedConfigs > 0 && (
              <span style={{ color: theme.colors.primary }}> ({inheritedConfigs}↑)</span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Terminal size={12} />
          <span>{commands} commands</span>
        </div>
      </div>
    </button>
  );
};

export interface PackageCompositionPanelProps {
  /** Detected packages in the repository */
  packages: PackageLayer[];
  /** Whether package data is loading */
  isLoading?: boolean;
  /** Message to display when there are no packages */
  emptyMessage?: string;
  /** Callback when a command is clicked */
  onCommandClick?: (command: PackageCommand, packagePath: string) => void;
  /** Callback when a config file is clicked */
  onConfigClick?: (configFile: ConfigFile) => void;
  /** Callback when a package folder is clicked */
  onPackageClick?: (packagePath: string) => void;
  /** Callback when hovering over a package (null when hover ends) */
  onPackageHover?: (pkg: PackageLayer | null) => void;
  /** Callback when a package is selected (null when deselected) */
  onPackageSelect?: (pkg: PackageLayer | null) => void;
}

interface PackageCardProps {
  pkg: PackageLayer;
  isExpanded: boolean;
  onToggle: () => void;
  onCommandClick?: (command: PackageCommand, packagePath: string) => void;
  onConfigClick?: (configFile: ConfigFile) => void;
  onPackageClick?: (packagePath: string) => void;
  /** When true, renders without the card wrapper and dropdown - for single package view */
  standalone?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  isExpanded,
  onToggle,
  onCommandClick,
  onConfigClick,
  onPackageClick,
  standalone = false,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'dependencies' | 'configs' | 'lenses'>('dependencies');
  const [activeFilters, setActiveFilters] = useState<Set<'production' | 'development' | 'peer'>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const configFiles = useMemo(() => {
    if (!pkg.configFiles) return [];
    return Object.entries(pkg.configFiles)
      .filter(([, config]) => config?.exists)
      .map(([name, config]) => ({ name, ...config! }));
  }, [pkg.configFiles]);

  const configCounts = useMemo(() => {
    const local = configFiles.filter((c) => !c.isInherited).length;
    const inherited = configFiles.filter((c) => c.isInherited).length;
    return { local, inherited, total: configFiles.length };
  }, [configFiles]);

  const commands = pkg.packageData.availableCommands || [];

  // Extract and process dependencies
  const dependencyItems = useMemo(() => extractDependencies(pkg), [pkg]);

  const depCounts = useMemo(() => ({
    all: dependencyItems.length,
    production: dependencyItems.filter((d) => d.dependencyType === 'production').length,
    development: dependencyItems.filter((d) => d.dependencyType === 'development').length,
    peer: dependencyItems.filter((d) => d.dependencyType === 'peer').length,
  }), [dependencyItems]);

  const handleToggleFilter = (type: 'production' | 'development' | 'peer') => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filteredDependencies = useMemo(() => {
    let filtered = [...dependencyItems];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((dep) => dep.name.toLowerCase().includes(query));
    }

    const allTypes: Array<'production' | 'development' | 'peer'> = ['production', 'development', 'peer'];
    const availableTypes = allTypes.filter((t) => depCounts[t] > 0);
    const isAllSelected = activeFilters.size === 0 || availableTypes.every((t) => activeFilters.has(t));

    if (!isAllSelected && activeFilters.size > 0) {
      filtered = filtered.filter((dep) => activeFilters.has(dep.dependencyType));
    }

    return filtered;
  }, [dependencyItems, searchQuery, activeFilters, depCounts]);

  // Standalone mode: render content directly without card wrapper
  if (standalone) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Package Info Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <PackageManagerIcon packageManager={pkg.packageData.packageManager} size={18} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: theme.fontSizes[2],
                fontWeight: 600,
                color: theme.colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pkg.packageData.name}
            </div>
            {pkg.packageData.version && (
              <div
                style={{
                  fontSize: theme.fontSizes[0],
                  color: theme.colors.textSecondary,
                }}
              >
                v{pkg.packageData.version}
              </div>
            )}
          </div>
          {pkg.packageData.path && (
            <button
              onClick={() => onPackageClick?.(pkg.packageData.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: theme.colors.backgroundTertiary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                color: theme.colors.textSecondary,
                fontSize: theme.fontSizes[0],
                cursor: 'pointer',
              }}
              title="Open package folder"
            >
              <Folder size={12} />
              {pkg.packageData.path || '/'}
            </button>
          )}
        </div>

        {/* Package Metadata */}
        {(pkg.packageData.description || pkg.packageData.license || pkg.packageData.author) && (
          <div
            style={{
              padding: '8px 16px 12px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {pkg.packageData.description && (
              <div
                style={{
                  fontSize: theme.fontSizes[1],
                  color: theme.colors.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                {pkg.packageData.description}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {pkg.packageData.license && (
                <span
                  style={{
                    padding: '2px 8px',
                    backgroundColor: theme.colors.textSecondary + '15',
                    color: theme.colors.textSecondary,
                    borderRadius: '4px',
                    fontSize: theme.fontSizes[0],
                    fontWeight: 500,
                  }}
                >
                  {pkg.packageData.license}
                </span>
              )}
              {(pkg.packageData.author || pkg.packageData.authors?.[0]) && (
                <span
                  style={{
                    fontSize: theme.fontSizes[0],
                    color: theme.colors.textSecondary,
                  }}
                >
                  by {pkg.packageData.author || pkg.packageData.authors?.[0]}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: theme.colors.backgroundTertiary,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          {[
            { id: 'dependencies' as const, label: 'Dependencies', count: dependencyItems.length },
            { id: 'configs' as const, label: 'Configs', count: configCounts.total, inherited: configCounts.inherited },
            { id: 'lenses' as const, label: 'Lenses', count: pkg.qualityMetrics?.lensReadiness ? Object.values(pkg.qualityMetrics.lensReadiness).filter(l => l.ready).length : 0, total: pkg.qualityMetrics?.lensReadiness ? Object.keys(pkg.qualityMetrics.lensReadiness).length : 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: activeTab === tab.id ? theme.colors.backgroundSecondary : 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab.id ? `2px solid ${theme.colors.accent}` : '2px solid transparent',
                color: activeTab === tab.id ? theme.colors.text : theme.colors.textSecondary,
                fontSize: theme.fontSizes[1],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              <span
                style={{
                  backgroundColor: theme.colors.backgroundTertiary,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: theme.fontSizes[0],
                }}
              >
                {'total' in tab ? `${tab.count}/${tab.total}` : 'inherited' in tab && tab.inherited > 0 ? `${tab.count} (${tab.inherited}↑)` : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: activeTab === 'dependencies' ? '0' : '0', overflow: 'auto' }}>
          {activeTab === 'configs' && (
            <div style={{ padding: '12px' }}>
              <ConfigList
                configs={configFiles}
                onConfigClick={onConfigClick}
              />
            </div>
          )}

          {activeTab === 'lenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <LensReadinessSection lensReadiness={pkg.qualityMetrics?.lensReadiness} />
              <OtherScriptsSection
                commands={commands}
                onCommandClick={(cmd) => onCommandClick?.(cmd, pkg.packageData.path)}
              />
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {dependencyItems.length === 0 ? (
                <div
                  style={{
                    padding: '12px',
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes[1],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Package size={16} />
                  No dependencies
                </div>
              ) : (
                <>
                  {/* Filter Bar */}
                  <div style={{ padding: '12px', borderBottom: `1px solid ${theme.colors.border}` }}>
                    <FilterBar
                      activeFilters={activeFilters}
                      onToggleFilter={handleToggleFilter}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      counts={depCounts}
                    />
                  </div>

                  {/* Dependency List */}
                  <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
                    <div
                      style={{
                        fontSize: theme.fontSizes[0],
                        color: theme.colors.textSecondary,
                        marginBottom: '8px',
                      }}
                    >
                      Showing {filteredDependencies.length} of {dependencyItems.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredDependencies.length === 0 ? (
                        <div
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: theme.colors.textSecondary,
                            fontSize: theme.fontSizes[1],
                          }}
                        >
                          No dependencies match your filters
                        </div>
                      ) : (
                        filteredDependencies.map((dep) => (
                          <DependencyRow
                            key={`${dep.name}-${dep.dependencyType}`}
                            dependency={dep}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Info Modal */}
              <DependencyInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: '8px',
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: theme.colors.text,
          textAlign: 'left',
        }}
      >
        {isExpanded ? (
          <ChevronDown size={16} color={theme.colors.textSecondary} />
        ) : (
          <ChevronRight size={16} color={theme.colors.textSecondary} />
        )}
        <PackageManagerIcon packageManager={pkg.packageData.packageManager} size={18} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: theme.fontSizes[2],
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pkg.packageData.name}
          </div>
          {pkg.packageData.version && (
            <div
              style={{
                fontSize: theme.fontSizes[0],
                color: theme.colors.textSecondary,
              }}
            >
              v{pkg.packageData.version}
            </div>
          )}
        </div>
        {pkg.packageData.path && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPackageClick?.(pkg.packageData.path);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: theme.colors.backgroundTertiary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              color: theme.colors.textSecondary,
              fontSize: theme.fontSizes[0],
              cursor: 'pointer',
            }}
            title="Open package folder"
          >
            <Folder size={12} />
            {pkg.packageData.path || '/'}
          </button>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: theme.colors.backgroundTertiary,
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            {[
              { id: 'dependencies' as const, label: 'Deps', count: dependencyItems.length },
              { id: 'configs' as const, label: 'Configs', count: configCounts.total, inherited: configCounts.inherited },
              { id: 'lenses' as const, label: 'Lenses', count: pkg.qualityMetrics?.lensReadiness ? Object.values(pkg.qualityMetrics.lensReadiness).filter(l => l.ready).length : 0, total: pkg.qualityMetrics?.lensReadiness ? Object.keys(pkg.qualityMetrics.lensReadiness).length : 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: activeTab === tab.id ? theme.colors.backgroundSecondary : 'transparent',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.id ? `2px solid ${theme.colors.accent}` : '2px solid transparent',
                  color: activeTab === tab.id ? theme.colors.text : theme.colors.textSecondary,
                  fontSize: theme.fontSizes[1],
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {tab.label}
                <span
                  style={{
                    backgroundColor: theme.colors.backgroundTertiary,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: theme.fontSizes[0],
                  }}
                >
                  {'total' in tab ? `${tab.count}/${tab.total}` : 'inherited' in tab && tab.inherited > 0 ? `${tab.count} (${tab.inherited}↑)` : tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: activeTab === 'dependencies' ? '0' : '0', maxHeight: '300px', overflow: 'auto' }}>
            {activeTab === 'configs' && (
              <div style={{ padding: '12px' }}>
                <ConfigList
                  configs={configFiles}
                  onConfigClick={onConfigClick}
                />
              </div>
            )}

            {activeTab === 'lenses' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <LensReadinessSection lensReadiness={pkg.qualityMetrics?.lensReadiness} />
                <OtherScriptsSection
                  commands={commands}
                  onCommandClick={(cmd) => onCommandClick?.(cmd, pkg.packageData.path)}
                />
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {dependencyItems.length === 0 ? (
                  <div
                    style={{
                      padding: '12px',
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes[1],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Package size={16} />
                    No dependencies
                  </div>
                ) : (
                  <>
                    {/* Filter Bar */}
                    <div style={{ padding: '12px', borderBottom: `1px solid ${theme.colors.border}` }}>
                      <FilterBar
                        activeFilters={activeFilters}
                        onToggleFilter={handleToggleFilter}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        counts={depCounts}
                      />
                    </div>

                    {/* Dependency List */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
                      <div
                        style={{
                          fontSize: theme.fontSizes[0],
                          color: theme.colors.textSecondary,
                          marginBottom: '8px',
                        }}
                      >
                        Showing {filteredDependencies.length} of {dependencyItems.length}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filteredDependencies.length === 0 ? (
                          <div
                            style={{
                              padding: '12px',
                              textAlign: 'center',
                              color: theme.colors.textSecondary,
                              fontSize: theme.fontSizes[1],
                            }}
                          >
                            No dependencies match your filters
                          </div>
                        ) : (
                          filteredDependencies.map((dep) => (
                            <DependencyRow
                              key={`${dep.name}-${dep.dependencyType}`}
                              dependency={dep}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Info Modal */}
                <DependencyInfoModal
                  isOpen={showInfoModal}
                  onClose={() => setShowInfoModal(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PackageCompositionPanelContent - Internal component that renders the package composition UI
 */
export const PackageCompositionPanelContent: React.FC<PackageCompositionPanelProps> = ({
  packages,
  isLoading = false,
  emptyMessage = 'No packages detected',
  onCommandClick,
  onConfigClick,
  onPackageClick,
  onPackageHover,
  onPackageSelect,
}) => {
  const { theme } = useTheme();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Sort packages: monorepo roots first, then by path
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => {
      if (a.packageData.isMonorepoRoot && !b.packageData.isMonorepoRoot) return -1;
      if (!a.packageData.isMonorepoRoot && b.packageData.isMonorepoRoot) return 1;
      return a.packageData.path.localeCompare(b.packageData.path);
    });
  }, [packages]);

  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [selectedPackageId, packages]);

  if (isLoading) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.colors.textSecondary,
        }}
      >
        Loading packages...
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.colors.textSecondary,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Single package: render standalone without card wrapper
  if (packages.length === 1) {
    return (
      <PackageCard
        pkg={packages[0]}
        isExpanded={true}
        onToggle={() => {}}
        onCommandClick={onCommandClick}
        onConfigClick={onConfigClick}
        onPackageClick={onPackageClick}
        standalone
      />
    );
  }

  // Multi-package (monorepo): summary cards with slide-to-detail
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sliding Container */}
      <div
        style={{
          display: 'flex',
          width: '200%',
          height: '100%',
          transform: selectedPackage ? 'translateX(-50%)' : 'translateX(0)',
          transition: 'transform 0.25s ease-in-out',
        }}
      >
        {/* Summary View (left panel) */}
        <div
          style={{
            width: '50%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              height: '40px',
              padding: '0 16px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <FileCode size={16} color={theme.colors.primary} />
            <span style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary }}>
              {packages.length} packages
            </span>
          </div>

          {/* Summary Cards */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sortedPackages.map((pkg) => (
              <PackageSummaryCard
                key={pkg.id}
                pkg={pkg}
                allPackages={packages}
                onClick={() => {
                  setSelectedPackageId(pkg.id);
                  onPackageSelect?.(pkg);
                }}
                onHover={onPackageHover}
              />
            ))}
          </div>
        </div>

        {/* Detail View (right panel) */}
        <div
          style={{
            width: '50%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Back Header */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => {
                setSelectedPackageId(null);
                onPackageSelect?.(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: theme.colors.accent,
                fontSize: theme.fontSizes[1],
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.backgroundTertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ChevronLeft size={16} />
              All Packages
            </button>
          </div>

          {/* Package Detail */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {selectedPackage && (
              <PackageCard
                pkg={selectedPackage}
                isExpanded={true}
                onToggle={() => {}}
                onCommandClick={onCommandClick}
                onConfigClick={onConfigClick}
                onPackageClick={onPackageClick}
                standalone
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PackageCompositionPanelPreview: React.FC = () => {
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
        <PackageManagerIcon packageManager="npm" size={14} />
        <span>my-app</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' }}>
        <Terminal size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>5 commands</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' }}>
        <Settings size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>3 configs</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' }}>
        <Package size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>12 deps</span>
      </div>
    </div>
  );
};

/**
 * PackageCompositionPanel - Panel Framework compatible component
 * Uses context.getSlice('packages') to get package layer data
 */
export const PackageCompositionPanel: React.FC<PanelComponentProps> = ({ context, events }) => {
  // Get packages slice from context - data shape is { packages: PackageLayer[], summary: PackageSummary }
  const packagesSlice = context.getSlice<PackagesSliceData>('packages');

  const packages = packagesSlice?.data?.packages ?? [];
  const isLoading = packagesSlice?.loading || false;

  // Emit package:hover events when hovering over packages
  const handlePackageHover = (pkg: PackageLayer | null) => {
    events?.emit({
      type: 'package:hover',
      source: 'PackageCompositionPanel',
      timestamp: Date.now(),
      payload: pkg ? {
        packagePath: pkg.packageData.path,
        packageName: pkg.packageData.name,
      } : null,
    });
  };

  // Emit package:select events when selecting/deselecting packages
  const handlePackageSelect = (pkg: PackageLayer | null) => {
    events?.emit({
      type: 'package:select',
      source: 'PackageCompositionPanel',
      timestamp: Date.now(),
      payload: pkg ? {
        packagePath: pkg.packageData.path,
        packageName: pkg.packageData.name,
      } : null,
    });
  };

  return (
    <PackageCompositionPanelContent
      packages={packages}
      isLoading={isLoading}
      onPackageHover={handlePackageHover}
      onPackageSelect={handlePackageSelect}
    />
  );
};
