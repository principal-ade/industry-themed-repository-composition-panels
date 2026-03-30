import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  X,
  Lock,
} from 'lucide-react';
import { PackageManagerIcon } from './PackageManagerIcon';
import { DependencyRow } from './DependencyRow';
import { EmptyDependencies } from './EmptyDependencies';
import { FilterBar } from './FilterBar';
import { DependencyInfoModal } from './DependencyInfoModal';
import { LensReadinessSection } from './LensReadinessSection';
import { OtherScriptsSection } from './OtherScriptsSection';
import { ConfigList } from './InheritedConfigIndicator';
import { parseEnvFile, type EnvVariable } from '../../utils/envParser';
import { getLicenseColor } from '../../utils/licenseColors';
import type {
  PackageLayer,
  ConfigFile,
  PackageCommand,
} from '../../types/composition';
import type { DependencyItem, DependencyType } from '../../types/dependencies';

/**
 * Sort order for dependency types: peer, production, development
 */
const dependencyTypeOrder: Record<DependencyType, number> = {
  peer: 0,
  production: 1,
  development: 2,
};

/**
 * Parse a package name into namespace and package name parts
 */
function parsePackageName(name: string): {
  namespace?: string;
  packageName: string;
} {
  if (name.startsWith('@')) {
    const slashIndex = name.indexOf('/');
    if (slashIndex > 0) {
      return {
        namespace: name.substring(0, slashIndex),
        packageName: name.substring(slashIndex + 1),
      };
    }
  }
  return { packageName: name };
}

/**
 * Extract dependencies from a PackageLayer into DependencyItems
 * Groups dependencies by name and combines their types
 */
function extractDependencies(packageLayer: PackageLayer): DependencyItem[] {
  const { dependencies, devDependencies, peerDependencies } =
    packageLayer.packageData;

  // Use a map to group dependencies by name
  const depMap = new Map<
    string,
    { version: string; types: Set<DependencyType> }
  >();

  if (peerDependencies) {
    Object.entries(peerDependencies).forEach(([name, version]) => {
      const existing = depMap.get(name);
      if (existing) {
        existing.types.add('peer');
      } else {
        depMap.set(name, { version, types: new Set(['peer']) });
      }
    });
  }

  if (dependencies) {
    Object.entries(dependencies).forEach(([name, version]) => {
      const existing = depMap.get(name);
      if (existing) {
        existing.types.add('production');
      } else {
        depMap.set(name, { version, types: new Set(['production']) });
      }
    });
  }

  if (devDependencies) {
    Object.entries(devDependencies).forEach(([name, version]) => {
      const existing = depMap.get(name);
      if (existing) {
        existing.types.add('development');
      } else {
        depMap.set(name, { version, types: new Set(['development']) });
      }
    });
  }

  // Convert map to array with proper structure
  const items: DependencyItem[] = Array.from(depMap.entries()).map(
    ([name, { version, types }]) => {
      const typesArray = Array.from(types).sort(
        (a, b) => dependencyTypeOrder[a] - dependencyTypeOrder[b]
      );
      const { namespace, packageName } = parsePackageName(name);

      return {
        name,
        version,
        dependencyType: typesArray[0], // Primary type for sorting
        dependencyTypes: typesArray,
        namespace,
        packageName,
      };
    }
  );

  // Sort by primary type (peer, prod, dev) then by package name (without scope)
  return items.sort((a, b) => {
    const typeCompare =
      dependencyTypeOrder[a.dependencyType] -
      dependencyTypeOrder[b.dependencyType];
    if (typeCompare !== 0) return typeCompare;
    return a.packageName.localeCompare(b.packageName);
  });
}

export interface PackageDetailCardProps {
  pkg: PackageLayer;
  isExpanded: boolean;
  onToggle: () => void;
  onCommandClick?: (command: PackageCommand, packagePath: string) => void;
  onConfigClick?: (configFile: ConfigFile) => void;
  onPackageClick?: (packagePath: string) => void;
  /** When true, renders without the card wrapper and dropdown - for single package view */
  standalone?: boolean;
  /** Read file content from the repository */
  readFile?: (filePath: string) => Promise<string>;
  /** Callback when close button is clicked (only shown in standalone mode) */
  onClose?: () => void;
}

export const PackageDetailCard: React.FC<PackageDetailCardProps> = ({
  pkg,
  isExpanded,
  onToggle,
  onCommandClick,
  onConfigClick,
  onPackageClick,
  standalone = false,
  readFile,
  onClose,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'dependencies' | 'env' | 'lenses'>(
    'dependencies'
  );
  const [activeFilters, setActiveFilters] = useState<
    Set<'production' | 'development' | 'peer'>
  >(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Environment variables state
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([]);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);

  // Group environment variables by their group field
  const groupedEnvVariables = useMemo(() => {
    const groups: Map<string | undefined, EnvVariable[]> = new Map();

    for (const variable of envVariables) {
      const group = variable.group;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(variable);
    }

    // Sort groups: named groups first (alphabetically), then ungrouped
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === undefined && b === undefined) return 0;
      if (a === undefined) return 1;
      if (b === undefined) return -1;
      return a.localeCompare(b);
    });

    return sortedGroups;
  }, [envVariables]);

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

  // Check for environment variables documentation file
  const envConfig = pkg.configFiles?.envvars;
  const hasEnvConfig = envConfig?.exists ?? false;

  console.log('[PackageDetailCard] Env tab debug:', {
    packageName: pkg.packageData.name,
    packagePath: pkg.packageData.path,
    configFiles: pkg.configFiles,
    envConfig,
    hasEnvConfig,
  });

  // Fetch and parse env file when env tab is active
  useEffect(() => {
    if (activeTab !== 'env' || !envConfig?.exists || !readFile) {
      return;
    }

    const fetchEnvFile = async () => {
      setEnvLoading(true);
      setEnvError(null);

      try {
        const filePath = pkg.packageData.path
          ? `${pkg.packageData.path}/${envConfig.path}`
          : envConfig.path;

        const content = await readFile(filePath);
        const result = parseEnvFile(content, envConfig.type);
        // Sort alphabetically by name
        const sorted = [...result.variables].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setEnvVariables(sorted);
      } catch (err) {
        setEnvError(
          err instanceof Error ? err.message : 'Failed to load env file'
        );
        setEnvVariables([]);
      } finally {
        setEnvLoading(false);
      }
    };

    fetchEnvFile();
  }, [activeTab, envConfig, readFile, pkg.packageData.path]);

  const commands = pkg.packageData.availableCommands || [];

  // Extract and process dependencies
  const dependencyItems = useMemo(() => extractDependencies(pkg), [pkg]);

  const depCounts = useMemo(
    () => ({
      all: dependencyItems.length,
      production: dependencyItems.filter(
        (d) => d.dependencyType === 'production'
      ).length,
      development: dependencyItems.filter(
        (d) => d.dependencyType === 'development'
      ).length,
      peer: dependencyItems.filter((d) => d.dependencyType === 'peer').length,
    }),
    [dependencyItems]
  );

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
      filtered = filtered.filter((dep) =>
        dep.name.toLowerCase().includes(query)
      );
    }

    const allTypes: Array<'production' | 'development' | 'peer'> = [
      'production',
      'development',
      'peer',
    ];
    const availableTypes = allTypes.filter((t) => depCounts[t] > 0);
    const isAllSelected =
      activeFilters.size === 0 ||
      availableTypes.every((t) => activeFilters.has(t));

    if (!isAllSelected && activeFilters.size > 0) {
      filtered = filtered.filter((dep) =>
        activeFilters.has(dep.dependencyType)
      );
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
                fontSize: theme.fontSizes[2],
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
              {pkg.packageData.version && ` - v${pkg.packageData.version}`}
              {pkg.packageData.license && (
                <>
                  {' - '}
                  <span
                    style={{ color: getLicenseColor(pkg.packageData.license) }}
                  >
                    {pkg.packageData.license}
                  </span>
                </>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Package Metadata */}
        {(pkg.packageData.description || pkg.packageData.author) && (
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
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                {pkg.packageData.description}
              </div>
            )}
            {(pkg.packageData.author || pkg.packageData.authors?.[0]) && (
              <span
                style={{
                  fontSize: theme.fontSizes[0],
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textSecondary,
                }}
              >
                by {pkg.packageData.author || pkg.packageData.authors?.[0]}
              </span>
            )}
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
            {
              id: 'dependencies' as const,
              label: 'Dependencies',
              count: dependencyItems.length,
            },
            ...(hasEnvConfig
              ? [
                  {
                    id: 'env' as const,
                    label: 'Env',
                    count: 1,
                  },
                ]
              : []),
            {
              id: 'lenses' as const,
              label: 'Lenses',
              count: pkg.qualityMetrics?.lensReadiness
                ? Object.values(pkg.qualityMetrics.lensReadiness).filter(
                    (l) => l.ready
                  ).length
                : 0,
              total: pkg.qualityMetrics?.lensReadiness
                ? Object.keys(pkg.qualityMetrics.lensReadiness).length
                : 0,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor:
                  activeTab === tab.id
                    ? theme.colors.backgroundSecondary
                    : 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid ${theme.colors.accent}`
                    : '2px solid transparent',
                color:
                  activeTab === tab.id
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                fontSize: theme.fontSizes[1],
                fontFamily: theme.fonts.body,
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
                  fontFamily: theme.fonts.body,
                }}
              >
                {'total' in tab ? `${tab.count}/${tab.total}` : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          style={{
            flex: 1,
            padding: activeTab === 'dependencies' ? '0' : '0',
            overflow: 'auto',
          }}
        >
          {activeTab === 'env' && envConfig && (
            <div>
              {/* Header with file link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${theme.space[2]}px ${theme.space[4]}px`,
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: theme.fontSizes[0],
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {envVariables.length > 0
                    ? `${envVariables.length} variables`
                    : 'Environment Variables'}
                </span>
                <button
                  onClick={() => onConfigClick?.(envConfig)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes[0],
                    fontFamily: theme.fonts.body,
                  }}
                  title={`Open ${envConfig.path}`}
                >
                  <FileText size={12} />
                  {envConfig.path}
                </button>
              </div>

              {/* Loading state */}
              {envLoading && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSizes[1],
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Loading environment variables...
                </div>
              )}

              {/* Error state */}
              {envError && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: theme.colors.error + '15',
                    border: `1px solid ${theme.colors.error}30`,
                    borderRadius: '6px',
                    color: theme.colors.error,
                    fontSize: theme.fontSizes[1],
                    fontFamily: theme.fonts.body,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  {envError}
                </div>
              )}

              {/* Variables list */}
              {!envLoading && !envError && envVariables.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {groupedEnvVariables.map(([groupName, variables]) => (
                    <div key={groupName ?? '__ungrouped__'}>
                      {/* Group header */}
                      {groupName && (
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: theme.colors.backgroundTertiary,
                            borderBottom: `1px solid ${theme.colors.border}`,
                            fontSize: theme.fontSizes[0],
                            fontFamily: theme.fonts.body,
                            fontWeight: theme.fontWeights.semibold,
                            color: theme.colors.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {groupName}
                        </div>
                      )}
                      {/* Variables in group */}
                      {variables.map((variable) => (
                        <div
                          key={variable.name}
                          style={{
                            padding: `${theme.space[3]}px ${theme.space[4]}px`,
                            backgroundColor: theme.colors.background,
                            borderBottom: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: variable.description ? '6px' : 0,
                            }}
                          >
                            <code
                              style={{
                                fontSize: theme.fontSizes[1],
                                fontFamily: theme.fonts.monospace,
                                color: theme.colors.text,
                                fontWeight: theme.fontWeights.medium,
                              }}
                            >
                              {variable.name}
                            </code>
                            {variable.link && (
                              <a
                                href={variable.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: theme.colors.accent,
                                  opacity: 0.7,
                                  transition: 'opacity 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.7';
                                }}
                                title={variable.link}
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                            {variable.required ? (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 6px',
                                  backgroundColor: theme.colors.error + '20',
                                  color: theme.colors.error,
                                  borderRadius: '4px',
                                  fontSize: theme.fontSizes[0],
                                  fontFamily: theme.fonts.body,
                                  fontWeight: theme.fontWeights.medium,
                                }}
                              >
                                <AlertCircle size={10} />
                                required
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 6px',
                                  backgroundColor: theme.colors.success + '20',
                                  color: theme.colors.success,
                                  borderRadius: '4px',
                                  fontSize: theme.fontSizes[0],
                                  fontFamily: theme.fonts.body,
                                }}
                              >
                                <CheckCircle size={10} />
                                optional
                              </span>
                            )}
                            {variable.default && (
                              <span
                                style={{
                                  fontSize: theme.fontSizes[0],
                                  fontFamily: theme.fonts.monospace,
                                  color: theme.colors.textSecondary,
                                }}
                              >
                                default: {variable.default}
                              </span>
                            )}
                          </div>
                          {variable.description && (
                            <div
                              style={{
                                fontSize: theme.fontSizes[1],
                                fontFamily: theme.fonts.body,
                                color: theme.colors.textSecondary,
                                lineHeight: 1.4,
                              }}
                            >
                              {variable.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state - no readFile available */}
              {!envLoading &&
                !envError &&
                envVariables.length === 0 &&
                !readFile && (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes[1],
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    Click the file to view environment variables
                  </div>
                )}
            </div>
          )}

          {activeTab === 'lenses' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <LensReadinessSection
                lensReadiness={pkg.qualityMetrics?.lensReadiness}
              />
              <OtherScriptsSection
                commands={commands}
                onCommandClick={(cmd) =>
                  onCommandClick?.(cmd, pkg.packageData.path)
                }
              />
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              {dependencyItems.length === 0 ? (
                <EmptyDependencies />
              ) : (
                <>
                  {/* Filter Bar */}
                  <div
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <FilterBar
                      activeFilters={activeFilters}
                      onToggleFilter={handleToggleFilter}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      counts={depCounts}
                      showSearch={dependencyItems.length > 10}
                    />
                  </div>

                  {/* Dependency List */}
                  <div
                    style={{
                      flex: 1,
                      overflow: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                    className="hide-scrollbar"
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {filteredDependencies.length === 0 ? (
                        <div
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: theme.colors.textSecondary,
                            fontSize: theme.fontSizes[1],
                            fontFamily: theme.fonts.body,
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
        <PackageManagerIcon
          packageManager={pkg.packageData.packageManager}
          size={18}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: theme.fontSizes[2],
              fontWeight: theme.fontWeights.semibold,
              fontFamily: theme.fonts.body,
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
            {pkg.packageData.version && ` - v${pkg.packageData.version}`}
            {pkg.packageData.license && (
              <>
                {' - '}
                <span
                  style={{ color: getLicenseColor(pkg.packageData.license) }}
                >
                  {pkg.packageData.license}
                </span>
              </>
            )}
          </div>
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
              fontFamily: theme.fonts.body,
              cursor: 'pointer',
            }}
            title="Open package folder"
          >
            <Folder size={12} />
            {pkg.packageData.path || 'root'}
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
              {
                id: 'dependencies' as const,
                label: 'Deps',
                count: dependencyItems.length,
              },
              ...(hasEnvConfig
                ? [
                    {
                      id: 'env' as const,
                      label: 'Env',
                      count: 1,
                    },
                  ]
                : []),
              {
                id: 'lenses' as const,
                label: 'Lenses',
                count: pkg.qualityMetrics?.lensReadiness
                  ? Object.values(pkg.qualityMetrics.lensReadiness).filter(
                      (l) => l.ready
                    ).length
                  : 0,
                total: pkg.qualityMetrics?.lensReadiness
                  ? Object.keys(pkg.qualityMetrics.lensReadiness).length
                  : 0,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor:
                    activeTab === tab.id
                      ? theme.colors.backgroundSecondary
                      : 'transparent',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.id
                      ? `2px solid ${theme.colors.accent}`
                      : '2px solid transparent',
                  color:
                    activeTab === tab.id
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                  fontSize: theme.fontSizes[1],
                  fontFamily: theme.fonts.body,
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
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {'total' in tab ? `${tab.count}/${tab.total}` : tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div
            style={{
              padding: activeTab === 'dependencies' ? '0' : '0',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            {activeTab === 'env' && envConfig && (
              <div>
                {/* Header with file link */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${theme.space[2]}px ${theme.space[4]}px`,
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: theme.fontSizes[0],
                      fontFamily: theme.fonts.body,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {envVariables.length > 0
                      ? `${envVariables.length} variables`
                      : 'Environment Variables'}
                  </span>
                  <button
                    onClick={() => onConfigClick?.(envConfig)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes[0],
                      fontFamily: theme.fonts.body,
                    }}
                    title={`Open ${envConfig.path}`}
                  >
                    <FileText size={12} />
                    {envConfig.path}
                  </button>
                </div>

                {/* Loading state */}
                {envLoading && (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSizes[1],
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    Loading environment variables...
                  </div>
                )}

                {/* Error state */}
                {envError && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: theme.colors.error + '15',
                      border: `1px solid ${theme.colors.error}30`,
                      borderRadius: '6px',
                      color: theme.colors.error,
                      fontSize: theme.fontSizes[1],
                      fontFamily: theme.fonts.body,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    {envError}
                  </div>
                )}

                {/* Variables list */}
                {!envLoading && !envError && envVariables.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {groupedEnvVariables.map(([groupName, variables]) => (
                      <div key={groupName ?? '__ungrouped__'}>
                        {/* Group header */}
                        {groupName && (
                          <div
                            style={{
                              padding: '8px 12px',
                              backgroundColor: theme.colors.backgroundTertiary,
                              borderBottom: `1px solid ${theme.colors.border}`,
                              fontSize: theme.fontSizes[0],
                              fontFamily: theme.fonts.body,
                              fontWeight: theme.fontWeights.semibold,
                              color: theme.colors.textSecondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {groupName}
                          </div>
                        )}
                        {/* Variables in group */}
                        {variables.map((variable) => (
                          <div
                            key={variable.name}
                            style={{
                              padding: `${theme.space[3]}px ${theme.space[4]}px`,
                              backgroundColor: theme.colors.background,
                              borderBottom: `1px solid ${theme.colors.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: variable.description ? '6px' : 0,
                              }}
                            >
                              <code
                                style={{
                                  fontSize: theme.fontSizes[1],
                                  fontFamily: theme.fonts.monospace,
                                  color: theme.colors.text,
                                  fontWeight: theme.fontWeights.medium,
                                }}
                              >
                                {variable.name}
                              </code>
                              {variable.link && (
                                <a
                                  href={variable.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: theme.colors.accent,
                                    opacity: 0.7,
                                    transition: 'opacity 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.7';
                                  }}
                                  title={variable.link}
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              {variable.required ? (
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    backgroundColor: theme.colors.error + '20',
                                    color: theme.colors.error,
                                    borderRadius: '4px',
                                    fontSize: theme.fontSizes[0],
                                    fontFamily: theme.fonts.body,
                                    fontWeight: theme.fontWeights.medium,
                                  }}
                                >
                                  <AlertCircle size={10} />
                                  required
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    backgroundColor:
                                      theme.colors.success + '20',
                                    color: theme.colors.success,
                                    borderRadius: '4px',
                                    fontSize: theme.fontSizes[0],
                                    fontFamily: theme.fonts.body,
                                  }}
                                >
                                  <CheckCircle size={10} />
                                  optional
                                </span>
                              )}
                              {variable.default && (
                                <span
                                  style={{
                                    fontSize: theme.fontSizes[0],
                                    fontFamily: theme.fonts.monospace,
                                    color: theme.colors.textSecondary,
                                  }}
                                >
                                  default: {variable.default}
                                </span>
                              )}
                            </div>
                            {variable.description && (
                              <div
                                style={{
                                  fontSize: theme.fontSizes[1],
                                  fontFamily: theme.fonts.body,
                                  color: theme.colors.textSecondary,
                                  lineHeight: 1.4,
                                }}
                              >
                                {variable.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state - no readFile available */}
                {!envLoading &&
                  !envError &&
                  envVariables.length === 0 &&
                  !readFile && (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSizes[1],
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      Click the file to view environment variables
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'lenses' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <LensReadinessSection
                  lensReadiness={pkg.qualityMetrics?.lensReadiness}
                />
                <OtherScriptsSection
                  commands={commands}
                  onCommandClick={(cmd) =>
                    onCommandClick?.(cmd, pkg.packageData.path)
                  }
                />
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {dependencyItems.length === 0 ? (
                  <EmptyDependencies />
                ) : (
                  <>
                    {/* Filter Bar */}
                    <div
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <FilterBar
                        activeFilters={activeFilters}
                        onToggleFilter={handleToggleFilter}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        counts={depCounts}
                        showSearch={dependencyItems.length > 10}
                      />
                    </div>

                    {/* Dependency List */}
                    <div
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                      className="hide-scrollbar"
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {filteredDependencies.length === 0 ? (
                          <div
                            style={{
                              padding: '12px',
                              textAlign: 'center',
                              color: theme.colors.textSecondary,
                              fontSize: theme.fontSizes[1],
                              fontFamily: theme.fonts.body,
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
