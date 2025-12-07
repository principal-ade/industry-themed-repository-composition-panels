import React, { useState, useMemo } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  Package,
  ChevronDown,
  ChevronRight,
  FileCode,
  Terminal,
  Settings,
  Folder,
  ExternalLink,
} from 'lucide-react';
import type { PanelComponentProps } from '../types';
import type { PackageLayer, ConfigFile, PackageCommand } from '../types/composition';

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
}

interface PackageCardProps {
  pkg: PackageLayer;
  isExpanded: boolean;
  onToggle: () => void;
  onCommandClick?: (command: PackageCommand, packagePath: string) => void;
  onConfigClick?: (configFile: ConfigFile) => void;
  onPackageClick?: (packagePath: string) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  isExpanded,
  onToggle,
  onCommandClick,
  onConfigClick,
  onPackageClick,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'commands' | 'configs'>('commands');

  const configFiles = useMemo(() => {
    if (!pkg.configFiles) return [];
    return Object.entries(pkg.configFiles)
      .filter(([, config]) => config?.exists)
      .map(([name, config]) => ({ name, ...config! }));
  }, [pkg.configFiles]);

  const commands = pkg.packageData.availableCommands || [];

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
        <Package size={18} color={theme.colors.accent} />
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
              { id: 'commands' as const, label: 'Commands', count: commands.length },
              { id: 'configs' as const, label: 'Configs', count: configFiles.length },
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
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {activeTab === 'commands' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {commands.length === 0 ? (
                  <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes[1] }}>
                    No commands available
                  </div>
                ) : (
                  commands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => onCommandClick?.(cmd, pkg.packageData.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: theme.colors.backgroundTertiary,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        color: theme.colors.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Terminal size={14} color={theme.colors.accent} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: theme.fontSizes[1] }}>{cmd.name}</div>
                        <div
                          style={{
                            fontSize: theme.fontSizes[0],
                            color: theme.colors.textSecondary,
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cmd.command}
                        </div>
                      </div>
                      {cmd.isLensCommand && (
                        <span
                          style={{
                            padding: '2px 6px',
                            backgroundColor: theme.colors.accent + '20',
                            color: theme.colors.accent,
                            borderRadius: '4px',
                            fontSize: theme.fontSizes[0],
                          }}
                        >
                          {cmd.lensId}
                        </span>
                      )}
                      <ExternalLink size={12} color={theme.colors.textSecondary} />
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'configs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {configFiles.length === 0 ? (
                  <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes[1] }}>
                    No config files detected
                  </div>
                ) : (
                  configFiles.map((config, idx) => (
                    <button
                      key={idx}
                      onClick={() => onConfigClick?.(config)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: theme.colors.backgroundTertiary,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        color: theme.colors.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Settings size={14} color={theme.colors.textSecondary} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: theme.fontSizes[1] }}>{config.name}</div>
                        <div
                          style={{
                            fontSize: theme.fontSizes[0],
                            color: theme.colors.textSecondary,
                            fontFamily: 'monospace',
                          }}
                        >
                          {config.path}
                        </div>
                      </div>
                      {config.isInline && (
                        <span
                          style={{
                            padding: '2px 6px',
                            backgroundColor: theme.colors.textSecondary + '20',
                            color: theme.colors.textSecondary,
                            borderRadius: '4px',
                            fontSize: theme.fontSizes[0],
                          }}
                        >
                          inline
                        </span>
                      )}
                    </button>
                  ))
                )}
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
}) => {
  const { theme } = useTheme();
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  const togglePackage = (packageId: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(packageId)) {
        next.delete(packageId);
      } else {
        next.add(packageId);
      }
      return next;
    });
  };

  // Expand first package by default
  React.useEffect(() => {
    if (packages.length > 0 && expandedPackages.size === 0) {
      setExpandedPackages(new Set([packages[0].id]));
    }
  }, [packages, expandedPackages.size]);

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

  // Sort packages: monorepo roots first, then by path
  const sortedPackages = [...packages].sort((a, b) => {
    if (a.packageData.isMonorepoRoot && !b.packageData.isMonorepoRoot) return -1;
    if (!a.packageData.isMonorepoRoot && b.packageData.isMonorepoRoot) return 1;
    return a.packageData.path.localeCompare(b.packageData.path);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <FileCode size={16} color={theme.colors.accent} />
        <span style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary }}>
          {packages.length} package{packages.length !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Package List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isExpanded={expandedPackages.has(pkg.id)}
            onToggle={() => togglePackage(pkg.id)}
            onCommandClick={onCommandClick}
            onConfigClick={onConfigClick}
            onPackageClick={onPackageClick}
          />
        ))}
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
        <Package size={14} color={theme.colors.accent} />
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
    </div>
  );
};

/**
 * PackageCompositionPanel - Panel Framework compatible component
 * Uses context.getSlice('packages') to get package layer data
 */
export const PackageCompositionPanel: React.FC<PanelComponentProps> = ({ context }) => {
  // Get packages slice from context
  const packagesSlice = context.getSlice<PackageLayer[]>('packages');

  const packages = packagesSlice?.data ?? [];
  const isLoading = packagesSlice?.loading || false;

  return (
    <PackageCompositionPanelContent
      packages={packages}
      isLoading={isLoading}
    />
  );
};
