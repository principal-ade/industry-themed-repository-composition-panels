import React, { useState, useMemo } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import {
  FileCode,
  Terminal,
  Settings,
  Package,
  Lock,
  Globe,
} from 'lucide-react';
import { PackageManagerIcon } from './components/PackageManagerIcon';
import {
  PackageDetailCard,
  PackageSummaryCard,
  PackageLoadingGraph,
} from './components';
import { EmptyDependencies } from './components/EmptyDependencies';
import type {
  PackageCompositionPanelPropsTyped,
  PanelEventEmitter,
} from '../types';
import type {
  PackageLayer,
  ConfigFile,
  PackageCommand,
} from '../types/composition';

export interface PackageCompositionPanelProps {
  /** Detected packages in the repository */
  packages: PackageLayer[];
  /** Whether package data is loading */
  isLoading?: boolean;
  /** Manifest files found in the project (for empty state display) */
  foundManifests?: string[];
  /** Whether the GitHub repository is public (undefined if no GitHub info) */
  isGitHubPublic?: boolean;
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
  /** Event emitter for panel communication */
  events?: PanelEventEmitter;
  /** Read file content from the repository */
  readFile?: (filePath: string) => Promise<string>;
}

/**
 * PackageCompositionPanelContent - Internal component that renders the package composition UI
 */
export const PackageCompositionPanelContent: React.FC<
  PackageCompositionPanelProps
> = ({
  packages,
  isLoading = false,
  isGitHubPublic,
  onCommandClick,
  onConfigClick,
  onPackageClick,
  onPackageHover,
  onPackageSelect,
  events,
  readFile,
}) => {
  const { theme } = useTheme();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );

  // Sort packages: monorepo roots first, then by path
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => {
      if (a.packageData.isMonorepoRoot && !b.packageData.isMonorepoRoot)
        return -1;
      if (!a.packageData.isMonorepoRoot && b.packageData.isMonorepoRoot)
        return 1;
      return a.packageData.path.localeCompare(b.packageData.path);
    });
  }, [packages]);

  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [selectedPackageId, packages]);

  console.log('[PackageCompositionPanelContent] isLoading:', isLoading);
  console.log(
    '[PackageCompositionPanelContent] packages.length:',
    packages.length
  );
  console.log(
    '[PackageCompositionPanelContent] isGitHubPublic:',
    isGitHubPublic
  );

  if (isLoading) {
    console.log('[PackageCompositionPanelContent] Rendering loading state');
    return <PackageLoadingGraph />;
  }

  if (packages.length === 0) {
    console.log('[PackageCompositionPanelContent] Rendering empty state');
    return <EmptyDependencies />;
  }

  const isSinglePackage = packages.length === 1;
  console.log(
    '[PackageCompositionPanelContent] Rendering main content, isSinglePackage:',
    isSinglePackage
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Persistent Header */}
      <div
        style={{
          height: '40px',
          padding: '0 16px',
          backgroundColor: theme.colors.backgroundSecondary,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {isGitHubPublic === false ? (
          <Lock size={16} color={theme.colors.textSecondary} />
        ) : isGitHubPublic === true ? (
          <Globe size={16} color={theme.colors.textSecondary} />
        ) : (
          <FileCode size={16} color={theme.colors.primary} />
        )}
        <span
          style={{
            fontSize: theme.fontSizes[1],
            fontFamily: theme.fonts.body,
            color: theme.colors.textSecondary,
            flex: 1,
          }}
          title={
            isGitHubPublic === false
              ? 'This repository is private on GitHub'
              : isGitHubPublic === true
                ? 'This repository is public on GitHub'
                : undefined
          }
        >
          {isGitHubPublic === false
            ? 'Private Repo'
            : isGitHubPublic === true
              ? 'Public Repo'
              : `${packages.length} packages`}
        </span>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {isSinglePackage ? (
          // Single package: show detail directly
          <PackageDetailCard
            pkg={packages[0]}
            isExpanded={true}
            onToggle={() => {}}
            onCommandClick={onCommandClick}
            onConfigClick={onConfigClick}
            onPackageClick={onPackageClick}
            standalone
            readFile={readFile}
          />
        ) : (
          // Multi-package: sliding panels
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

            {/* Detail View (right panel) */}
            <div
              style={{
                width: '50%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {selectedPackage && (
                <PackageDetailCard
                  pkg={selectedPackage}
                  isExpanded={true}
                  onToggle={() => {}}
                  onCommandClick={onCommandClick}
                  onConfigClick={onConfigClick}
                  onPackageClick={onPackageClick}
                  standalone
                  readFile={readFile}
                  onClose={() => {
                    setSelectedPackageId(null);
                    onPackageSelect?.(null);
                  }}
                />
              )}
            </div>
          </div>
        )}
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
        fontSize: theme.fontSizes[0],
        fontFamily: theme.fonts.body,
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '8px',
        }}
      >
        <Terminal size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>5 commands</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '8px',
        }}
      >
        <Settings size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>3 configs</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '8px',
        }}
      >
        <Package size={12} color={theme.colors.textSecondary} />
        <span style={{ color: theme.colors.textSecondary }}>12 deps</span>
      </div>
    </div>
  );
};

/**
 * PackageCompositionPanel - Panel Framework compatible component
 */
export const PackageCompositionPanel: React.FC<
  PackageCompositionPanelPropsTyped
> = ({ context, actions, events }) => {
  // Debug: log context keys to identify rendering issue
  console.log('[PackageCompositionPanel] context keys:', Object.keys(context));
  console.log('[PackageCompositionPanel] context.packages:', context.packages);
  console.log(
    '[PackageCompositionPanel] context.repositoryEntry:',
    context.repositoryEntry
  );

  // Get slices from typed context
  const packagesSlice = context.packages;
  const repositoryEntrySlice = context.repositoryEntry;

  const packages = packagesSlice?.data?.packages ?? [];
  const isLoading = packagesSlice?.loading || false;
  const isGitHubPublic = repositoryEntrySlice?.data?.github?.isPublic;

  // Emit package:hover events when hovering over packages
  const handlePackageHover = (pkg: PackageLayer | null) => {
    events?.emit({
      type: 'package:hover',
      source: 'PackageCompositionPanel',
      timestamp: Date.now(),
      payload: pkg
        ? {
            packagePath: pkg.packageData.path,
            packageName: pkg.packageData.name,
          }
        : null,
    });
  };

  // Emit package:select events when selecting/deselecting packages
  const handlePackageSelect = (pkg: PackageLayer | null) => {
    events?.emit({
      type: 'package:select',
      source: 'PackageCompositionPanel',
      timestamp: Date.now(),
      payload: pkg
        ? {
            packagePath: pkg.packageData.path,
            packageName: pkg.packageData.name,
          }
        : null,
    });
  };

  return (
    <PackageCompositionPanelContent
      packages={packages}
      isLoading={isLoading}
      isGitHubPublic={isGitHubPublic}
      onPackageHover={handlePackageHover}
      onPackageSelect={handlePackageSelect}
      events={events}
      readFile={actions.readFile}
    />
  );
};
