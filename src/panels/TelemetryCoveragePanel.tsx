import React, { useState, useMemo } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  TestTube,
  FileCode,
  FolderOpen,
} from 'lucide-react';
import {
  TelemetryCoverageFileTree,
  FileTelemetryCoverage,
  calculateTelemetryCoverageStats,
} from '@principal-ade/dynamic-file-tree';
import type { FileTree } from '@principal-ai/repository-abstraction';
import type { PanelComponentProps } from '../types';
import type { PackageLayer } from '../types/composition';
import type { PackagesSliceData } from '../types/dependencies';

/**
 * Coverage data for a single package
 */
export interface PackageTelemetryCoverage {
  /** Package identifier */
  packageId: string;
  /** Package name */
  packageName: string;
  /** Package path */
  packagePath: string;
  /** Path to trace file if found */
  traceFilePath?: string;
  /** Coverage data for test files in this package */
  files: FileTelemetryCoverage[];
}

export interface TelemetryCoveragePanelProps {
  /** Detected packages in the repository */
  packages: PackageLayer[];
  /** Coverage data per package */
  coverageData: PackageTelemetryCoverage[];
  /** File tree for displaying test files */
  fileTree?: FileTree;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Callback when a file is selected */
  onFileSelect?: (filePath: string, packagePath: string) => void;
  /** Callback when a package is selected */
  onPackageSelect?: (pkg: PackageLayer | null) => void;
  /** Callback when view trace is clicked */
  onViewTrace?: (traceFilePath: string, packagePath: string) => void;
}

/**
 * Get color for coverage percentage
 */
const getCoverageColor = (percentage: number): string => {
  if (percentage >= 80) return '#22c55e'; // Green
  if (percentage >= 50) return '#eab308'; // Yellow
  if (percentage > 0) return '#f97316'; // Orange
  return '#6b7280'; // Gray
};

/**
 * Coverage progress bar component
 */
const CoverageBar: React.FC<{ percentage: number; width?: number }> = ({
  percentage,
  width = 60,
}) => {
  const color = getCoverageColor(percentage);

  return (
    <div
      style={{
        width,
        height: 6,
        backgroundColor: color + '30',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

interface PackageCoverageCardProps {
  pkg: PackageLayer;
  coverage: PackageTelemetryCoverage | undefined;
  isSelected: boolean;
  onClick: () => void;
}

const PackageCoverageCard: React.FC<PackageCoverageCardProps> = ({
  pkg,
  coverage,
  isSelected,
  onClick,
}) => {
  const { theme } = useTheme();

  const stats = useMemo(() => {
    if (!coverage || coverage.files.length === 0) {
      return {
        percentage: 0,
        totalTraced: 0,
        totalTests: 0,
        testFiles: 0,
        coveredFiles: 0,
        partialFiles: 0,
        uncoveredFiles: 0,
      };
    }
    const result = calculateTelemetryCoverageStats(coverage.files);
    return result;
  }, [coverage]);

  const hasTraceFile = !!coverage?.traceFilePath;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: isSelected
          ? theme.colors.primary + '10'
          : theme.colors.backgroundSecondary,
        border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
        borderRadius: '0',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = theme.colors.primary;
          e.currentTarget.style.backgroundColor =
            theme.colors.backgroundTertiary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = theme.colors.border;
          e.currentTarget.style.backgroundColor =
            theme.colors.backgroundSecondary;
        }
      }}
    >
      {/* Package Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity
          size={16}
          color={
            stats.percentage > 0
              ? getCoverageColor(stats.percentage)
              : theme.colors.textSecondary
          }
        />
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
          </div>
        </div>

        {/* Coverage Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CoverageBar percentage={stats.percentage} />
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: getCoverageColor(stats.percentage) + '20',
              color: getCoverageColor(stats.percentage),
              borderRadius: '4px',
              fontSize: theme.fontSizes[0],
              fontWeight: 'bold',
              fontFamily: 'monospace',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            {stats.percentage}%
          </span>
        </div>

        <ChevronRight size={16} color={theme.colors.textSecondary} />
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          fontSize: theme.fontSizes[0],
          color: theme.colors.textSecondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TestTube size={12} />
          <span>
            {stats.totalTraced}/{stats.totalTests} tests traced
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileCode size={12} />
          <span>{stats.testFiles} test files</span>
        </div>
        {hasTraceFile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: theme.colors.primary,
            }}
          >
            <Activity size={12} />
            <span>trace available</span>
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * TelemetryCoveragePanelContent - Internal component that renders the telemetry coverage UI
 */
export const TelemetryCoveragePanelContent: React.FC<
  TelemetryCoveragePanelProps
> = ({
  packages,
  coverageData,
  fileTree,
  isLoading = false,
  error = null,
  onFileSelect,
  onPackageSelect,
  onViewTrace,
}) => {
  const { theme } = useTheme();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );

  // Create coverage map for quick lookup
  const coverageMap = useMemo(() => {
    const map = new Map<string, PackageTelemetryCoverage>();
    coverageData.forEach((c) => map.set(c.packageId, c));
    return map;
  }, [coverageData]);

  // Sort packages: by coverage percentage descending
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => {
      const aCoverage = coverageMap.get(a.id);
      const bCoverage = coverageMap.get(b.id);
      const aStats = aCoverage
        ? calculateTelemetryCoverageStats(aCoverage.files)
        : { percentage: 0 };
      const bStats = bCoverage
        ? calculateTelemetryCoverageStats(bCoverage.files)
        : { percentage: 0 };
      return bStats.percentage - aStats.percentage;
    });
  }, [packages, coverageMap]);

  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [selectedPackageId, packages]);

  const selectedCoverage = useMemo(() => {
    if (!selectedPackageId) return null;
    return coverageMap.get(selectedPackageId) || null;
  }, [selectedPackageId, coverageMap]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const allFiles = coverageData.flatMap((c) => c.files);
    if (allFiles.length === 0) {
      return {
        percentage: 0,
        totalTraced: 0,
        totalTests: 0,
        testFiles: 0,
        coveredFiles: 0,
        partialFiles: 0,
        uncoveredFiles: 0,
      };
    }
    return calculateTelemetryCoverageStats(allFiles);
  }, [coverageData]);

  // Create a filtered file tree for the selected package
  const packageFileTree = useMemo(() => {
    if (!fileTree || !selectedPackage) return undefined;
    // For now, return the full tree - filtering by package path would be done here
    // TODO: Filter fileTree to only show files under selectedPackage.packageData.path
    return fileTree;
  }, [fileTree, selectedPackage]);

  if (isLoading) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.colors.textSecondary,
        }}
      >
        Loading telemetry coverage data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: theme.colors.error,
        }}
      >
        {error}
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Activity size={32} color={theme.colors.textSecondary} />
        <div>No packages detected</div>
        <div style={{ fontSize: theme.fontSizes[0] }}>
          Run package detection to see telemetry coverage
        </div>
      </div>
    );
  }

  // Single package view
  if (packages.length === 1 && packageFileTree) {
    const pkg = packages[0];
    const coverage = coverageMap.get(pkg.id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Activity size={20} color={theme.colors.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: theme.colors.text }}>
              {pkg.packageData.name}
            </div>
            <div
              style={{
                fontSize: theme.fontSizes[0],
                color: theme.colors.textSecondary,
              }}
            >
              {overallStats.totalTraced}/{overallStats.totalTests} tests traced
            </div>
          </div>
          <CoverageBar percentage={overallStats.percentage} width={80} />
          <span
            style={{
              padding: '4px 12px',
              backgroundColor: getCoverageColor(overallStats.percentage),
              color: '#fff',
              borderRadius: '4px',
              fontSize: theme.fontSizes[1],
              fontWeight: 'bold',
              fontFamily: 'monospace',
            }}
          >
            {overallStats.percentage}%
          </span>
        </div>

        {/* File Tree */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TelemetryCoverageFileTree
            fileTree={packageFileTree}
            theme={theme}
            coverageData={coverage?.files || []}
            onFileSelect={(path) => onFileSelect?.(path, pkg.packageData.path)}
            showOnlyTestFiles={true}
            showUncoveredFiles={true}
            openByDefault={true}
            horizontalNodePadding="16px"
            verticalPadding="16px"
          />
        </div>
      </div>
    );
  }

  // Multi-package (monorepo) view with slide-to-detail
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
          {/* Header with overall stats */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Activity size={16} color={theme.colors.primary} />
            <span
              style={{
                fontSize: theme.fontSizes[1],
                color: theme.colors.textSecondary,
              }}
            >
              {packages.length} packages
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: theme.fontSizes[0],
                color: theme.colors.textSecondary,
              }}
            >
              Overall:
            </span>
            <CoverageBar percentage={overallStats.percentage} />
            <span
              style={{
                padding: '2px 8px',
                backgroundColor:
                  getCoverageColor(overallStats.percentage) + '20',
                color: getCoverageColor(overallStats.percentage),
                borderRadius: '4px',
                fontSize: theme.fontSizes[0],
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            >
              {overallStats.percentage}%
            </span>
          </div>

          {/* Package Cards */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sortedPackages.map((pkg) => (
              <PackageCoverageCard
                key={pkg.id}
                pkg={pkg}
                coverage={coverageMap.get(pkg.id)}
                isSelected={selectedPackageId === pkg.id}
                onClick={() => {
                  setSelectedPackageId(pkg.id);
                  onPackageSelect?.(pkg);
                }}
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
                e.currentTarget.style.backgroundColor =
                  theme.colors.backgroundTertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ChevronLeft size={16} />
              All Packages
            </button>

            <div style={{ flex: 1 }} />

            {selectedCoverage?.traceFilePath && (
              <button
                onClick={() =>
                  onViewTrace?.(
                    selectedCoverage.traceFilePath!,
                    selectedPackage?.packageData.path || ''
                  )
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: theme.colors.primary + '15',
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: '4px',
                  color: theme.colors.primary,
                  fontSize: theme.fontSizes[0],
                  cursor: 'pointer',
                }}
              >
                <Activity size={14} />
                View Trace
              </button>
            )}
          </div>

          {/* Package Detail Header */}
          {selectedPackage && (
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <FolderOpen size={16} color={theme.colors.primary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: theme.colors.text }}>
                  {selectedPackage.packageData.name}
                </div>
                <div
                  style={{
                    fontSize: theme.fontSizes[0],
                    color: theme.colors.textSecondary,
                  }}
                >
                  {selectedPackage.packageData.path || '/'}
                </div>
              </div>
              {selectedCoverage && (
                <>
                  <CoverageBar
                    percentage={
                      calculateTelemetryCoverageStats(selectedCoverage.files)
                        .percentage
                    }
                    width={60}
                  />
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor:
                        getCoverageColor(
                          calculateTelemetryCoverageStats(
                            selectedCoverage.files
                          ).percentage
                        ) + '20',
                      color: getCoverageColor(
                        calculateTelemetryCoverageStats(selectedCoverage.files)
                          .percentage
                      ),
                      borderRadius: '4px',
                      fontSize: theme.fontSizes[0],
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  >
                    {
                      calculateTelemetryCoverageStats(selectedCoverage.files)
                        .percentage
                    }
                    %
                  </span>
                </>
              )}
            </div>
          )}

          {/* File Tree */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {selectedPackage && packageFileTree && (
              <TelemetryCoverageFileTree
                fileTree={packageFileTree}
                theme={theme}
                coverageData={selectedCoverage?.files || []}
                onFileSelect={(path) =>
                  onFileSelect?.(path, selectedPackage.packageData.path)
                }
                showOnlyTestFiles={true}
                showUncoveredFiles={true}
                openByDefault={true}
                horizontalNodePadding="16px"
                verticalPadding="16px"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TelemetryCoveragePanelPreview: React.FC = () => {
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
        <Activity size={14} color={theme.colors.primary} />
        <span>Telemetry Coverage</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '8px',
        }}
      >
        <TestTube size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>
          8/14 tests traced
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '8px',
        }}
      >
        <CoverageBar percentage={57} width={40} />
        <span
          style={{
            color: getCoverageColor(57),
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}
        >
          57%
        </span>
      </div>
    </div>
  );
};

/**
 * TelemetryCoveragePanel - Panel Framework compatible component
 * Uses context.getSlice('packages') and context.getSlice('fileTree') to get data
 */
export const TelemetryCoveragePanel: React.FC<PanelComponentProps> = ({
  context,
  events,
}) => {
  // Get packages and fileTree slices from context
  const packagesSlice = context.getSlice<PackagesSliceData>('packages');
  const fileTreeSlice = context.getSlice<FileTree>('fileTree');

  // Wrap in useMemo to maintain stable reference when undefined
  const packages = useMemo(
    () => packagesSlice?.data?.packages ?? [],
    [packagesSlice?.data?.packages]
  );
  const fileTree = fileTreeSlice?.data ?? undefined;
  const isLoading = packagesSlice?.loading || fileTreeSlice?.loading || false;

  // Scan fileTree for trace files and build coverage data
  const coverageData: PackageTelemetryCoverage[] = useMemo(() => {
    // Get all files from fileTree
    const allFiles = fileTree?.allFiles ?? [];

    // Debug: Log sample file paths to understand structure

    // Find all trace canvas files and map them to package paths
    const traceFilesByPackage = new Map<string, string>();

    for (const file of allFiles) {
      const filePath = file.relativePath || file.path || '';

      // Match trace file patterns:
      // - packages/{pkg}/__traces__/*.canvas.json
      // - packages/{pkg}/**/__traces__/*.canvas.json (nested)
      // - __traces__/*.canvas.json (root)
      const packageMatch = filePath.match(
        /^packages\/([^/]+)(?:\/.*)?__traces__\/[^/]+\.canvas\.json$/
      );
      const rootMatch = filePath.match(/^__traces__\/[^/]+\.canvas\.json$/);

      if (packageMatch) {
        const pkgName = packageMatch[1];
        const pkgPath = `packages/${pkgName}`;
        // Store first trace file found for each package
        if (!traceFilesByPackage.has(pkgPath)) {
          traceFilesByPackage.set(pkgPath, filePath);
        }
      } else if (rootMatch) {
        // Root-level trace file
        if (!traceFilesByPackage.has('')) {
          traceFilesByPackage.set('', filePath);
        }
      }
    }

    // Debug: Log what we found

    // Build coverage data for each package
    return packages.map((pkg) => {
      // Normalize package path - remove leading slash if present
      const pkgPath = pkg.packageData.path.replace(/^\//, '');
      const traceFilePath = traceFilesByPackage.get(pkgPath);

      // Find test files in this package
      const testFilePattern = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
      const packageTestFiles = allFiles.filter((file) => {
        const filePath = file.relativePath || file.path || '';
        // Check if file is in this package and is a test file
        const isInPackage =
          pkgPath === ''
            ? !filePath.startsWith('packages/') // Root package
            : filePath.startsWith(pkgPath + '/') ||
              filePath.startsWith(pkgPath.replace(/^\//, '') + '/');
        return isInPackage && testFilePattern.test(filePath);
      });

      // Build file coverage - if trace exists, mark as covered; otherwise none
      const files: FileTelemetryCoverage[] = packageTestFiles.map((file) => {
        const filePath = file.relativePath || file.path || '';
        return {
          filePath,
          status: traceFilePath ? 'covered' : 'none',
          tracedTestCount: traceFilePath ? 1 : 0, // Approximate - we don't parse individual tests yet
          totalTestCount: 1,
        };
      });

      return {
        packageId: pkg.id,
        packageName: pkg.packageData.name,
        packagePath: pkgPath, // Normalized (no leading slash)
        traceFilePath,
        files,
      };
    });
  }, [packages, fileTree]);

  const handleFileSelect = (filePath: string, packagePath: string) => {
    // Emit file:select for other panels
    events?.emit({
      type: 'file:select',
      source: 'TelemetryCoveragePanel',
      timestamp: Date.now(),
      payload: { filePath, packagePath },
    });

    // Find the coverage data for this package to get the trace file path
    const pkgCoverage = coverageData.find((c) => c.packagePath === packagePath);
    if (pkgCoverage?.traceFilePath) {
      // Also emit trace:load to update the TraceViewerPanel
      events?.emit({
        type: 'trace:load',
        source: 'TelemetryCoveragePanel',
        timestamp: Date.now(),
        payload: {
          tracePath: pkgCoverage.traceFilePath,
          packagePath,
        },
      });
    }
  };

  const handlePackageSelect = (pkg: PackageLayer | null) => {
    events?.emit({
      type: 'package:select',
      source: 'TelemetryCoveragePanel',
      timestamp: Date.now(),
      payload: pkg
        ? {
            packagePath: pkg.packageData.path,
            packageName: pkg.packageData.name,
          }
        : null,
    });

    // When selecting a package with a trace file, load that trace
    if (pkg) {
      const pkgCoverage = coverageData.find(
        (c) => c.packagePath === pkg.packageData.path
      );
      if (pkgCoverage?.traceFilePath) {
        events?.emit({
          type: 'trace:load',
          source: 'TelemetryCoveragePanel',
          timestamp: Date.now(),
          payload: {
            tracePath: pkgCoverage.traceFilePath,
            packagePath: pkg.packageData.path,
          },
        });
      }
    }
  };

  const handleViewTrace = (traceFilePath: string, packagePath: string) => {
    // Emit trace:load for the TraceViewerPanel
    events?.emit({
      type: 'trace:load',
      source: 'TelemetryCoveragePanel',
      timestamp: Date.now(),
      payload: {
        tracePath: traceFilePath,
        packagePath,
      },
    });
  };

  return (
    <TelemetryCoveragePanelContent
      packages={packages}
      coverageData={coverageData}
      fileTree={fileTree}
      isLoading={isLoading}
      onFileSelect={handleFileSelect}
      onPackageSelect={handlePackageSelect}
      onViewTrace={handleViewTrace}
    />
  );
};
