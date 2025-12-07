import React, { useState, useMemo } from 'react';
import { Package, HelpCircle, Boxes } from 'lucide-react';
import { ThemeProvider, useTheme } from '@principal-ade/industry-theme';
import type { PanelComponentProps } from '../types';
import type {
  PackageLayer,
  DependencyItem,
  PackagesSliceData,
} from '../types/dependencies';
import { DependencyInfoModal, DependencyRow, FilterBar } from './components';

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
  const { dependencies, devDependencies, peerDependencies } =
    packageLayer.packageData;

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
 * DependenciesPanelContent - Internal component that uses theme
 */
const DependenciesPanelContent: React.FC<PanelComponentProps> = ({
  context,
}) => {
  const { theme } = useTheme();

  // State
  const [selectedPackagePath, setSelectedPackagePath] = useState<string | null>(
    null
  );
  const [activeFilters, setActiveFilters] = useState<Set<'production' | 'development' | 'peer'>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Get packages slice data
  const packagesSlice = context.getSlice<PackagesSliceData>('packages');
  const isLoading = context.isSliceLoading('packages');
  const hasPackages = context.hasSlice('packages');

  const packages = useMemo(() => {
    return packagesSlice?.data?.packages ?? [];
  }, [packagesSlice?.data?.packages]);

  // Auto-select: single package, or root package in monorepo
  const effectiveSelectedPath = useMemo(() => {
    if (selectedPackagePath !== null) return selectedPackagePath;
    if (packages.length === 1) return packages[0].packageData.path;
    // For monorepos, auto-select root package (path: '')
    const rootPackage = packages.find((p) => p.packageData.path === '');
    if (rootPackage) return '';
    return null;
  }, [selectedPackagePath, packages]);

  // Get selected package
  const selectedPackage = useMemo(() => {
    if (effectiveSelectedPath === null) return null;
    return packages.find((p) => p.packageData.path === effectiveSelectedPath);
  }, [effectiveSelectedPath, packages]);

  // Extract dependencies from selected package
  const dependencyItems = useMemo(() => {
    if (!selectedPackage) return [];
    return extractDependencies(selectedPackage);
  }, [selectedPackage]);

  // Calculate counts
  const counts = useMemo(() => {
    return {
      all: dependencyItems.length,
      production: dependencyItems.filter((d) => d.dependencyType === 'production')
        .length,
      development: dependencyItems.filter(
        (d) => d.dependencyType === 'development'
      ).length,
      peer: dependencyItems.filter((d) => d.dependencyType === 'peer').length,
    };
  }, [dependencyItems]);

  // Handle filter toggle
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

  // Filter dependencies
  const filteredDependencies = useMemo(() => {
    let filtered = [...dependencyItems];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((dep) =>
        dep.name.toLowerCase().includes(query)
      );
    }

    // Apply type filter: empty set or all types selected = show all
    const allTypes: Array<'production' | 'development' | 'peer'> = ['production', 'development', 'peer'];
    const availableTypes = allTypes.filter((t) => counts[t] > 0);
    const isAllSelected = activeFilters.size === 0 || availableTypes.every((t) => activeFilters.has(t));

    if (!isAllSelected && activeFilters.size > 0) {
      filtered = filtered.filter((dep) => activeFilters.has(dep.dependencyType));
    }

    return filtered;
  }, [dependencyItems, searchQuery, activeFilters, counts]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          padding: `${theme.space[3]}px`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.textSecondary,
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.body,
        }}
      >
        Loading packages...
      </div>
    );
  }

  // No packages available
  if (!hasPackages || packages.length === 0) {
    return (
      <div
        style={{
          padding: `${theme.space[3]}px`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${theme.space[2]}px`,
          color: theme.colors.textSecondary,
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.body,
        }}
      >
        <Package size={32} />
        <p style={{ margin: 0 }}>No package data available</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        overflow: 'hidden',
      }}
    >
      {/* Fixed Header Section */}
      <div
        style={{
          flexShrink: 0,
          padding: `${theme.space[3]}px`,
          paddingBottom: `${theme.space[2]}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${theme.space[2]}px`,
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Title Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontSize: `${theme.fontSizes[2]}px`,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: `${theme.space[2]}px`,
              margin: 0,
            }}
          >
            {packages.length > 1 ? (
              <>
                <Boxes size={16} />
                Monorepo Dependencies
                <span
                  style={{
                    fontSize: `${theme.fontSizes[0]}px`,
                    fontWeight: theme.fontWeights.body,
                    color: theme.colors.textSecondary,
                  }}
                >
                  ({packages.length})
                </span>
              </>
            ) : (
              <>
                <Package size={16} />
                Dependencies
              </>
            )}
          </h3>
          <button
            onClick={() => setShowInfoModal(true)}
            style={{
              padding: `${theme.space[1]}px ${theme.space[2]}px`,
              fontSize: `${theme.fontSizes[0]}px`,
              fontWeight: theme.fontWeights.medium,
              fontFamily: theme.fonts.body,
              borderRadius: `${theme.radii[1]}px`,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.backgroundSecondary,
              color: theme.colors.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: `${theme.space[1]}px`,
              transition: 'all 0.2s',
            }}
          >
            <HelpCircle size={12} />
            Learn More
          </button>
        </div>

        {/* Package Selection (only if multiple packages) */}
        {packages.length > 1 && (
          <select
            value={effectiveSelectedPath ?? '__none__'}
            onChange={(e) => setSelectedPackagePath(e.target.value === '__none__' ? null : e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.space[2]}px`,
              borderRadius: `${theme.radii[1]}px`,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.backgroundSecondary,
              color: theme.colors.text,
              fontSize: `${theme.fontSizes[1]}px`,
              fontFamily: theme.fonts.body,
              cursor: 'pointer',
            }}
          >
            {packages.map((pkg) => (
              <option key={pkg.packageData.path || '__root__'} value={pkg.packageData.path}>
                {pkg.packageData.name} ({pkg.packageData.path || 'root'})
              </option>
            ))}
          </select>
        )}

        {/* Package Info (single package) */}
        {packages.length === 1 && selectedPackage && (
          <div
            style={{
              fontSize: `${theme.fontSizes[0]}px`,
              color: theme.colors.textSecondary,
            }}
          >
            {selectedPackage.packageData.name} • {dependencyItems.length} dependencies
          </div>
        )}

        {/* Filter Bar */}
        {selectedPackage && dependencyItems.length > 0 && (
          <FilterBar
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
          />
        )}
      </div>

      {/* Scrollable Dependencies List */}
      {selectedPackage && dependencyItems.length > 0 && (
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: `${theme.space[2]}px ${theme.space[3]}px ${theme.space[3]}px`,
          }}
        >
          {/* Results Count */}
          <div
            style={{
              fontSize: `${theme.fontSizes[0]}px`,
              color: theme.colors.textSecondary,
              marginBottom: `${theme.space[2]}px`,
            }}
          >
            Showing {filteredDependencies.length} of {dependencyItems.length} dependencies
          </div>

          {/* Dependency Items */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${theme.space[1]}px`,
            }}
          >
            {filteredDependencies.length === 0 ? (
              <div
                style={{
                  padding: `${theme.space[3]}px`,
                  textAlign: 'center',
                  color: theme.colors.textSecondary,
                  fontSize: `${theme.fontSizes[1]}px`,
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
      )}

      {/* No package selected */}
      {!selectedPackage && packages.length > 1 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.textSecondary,
            fontSize: `${theme.fontSizes[1]}px`,
          }}
        >
          Select a package to view its dependencies
        </div>
      )}

      {/* Info Modal */}
      <DependencyInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
};

/**
 * DependenciesPanel - Main panel component with ThemeProvider wrapper
 */
export const DependenciesPanel: React.FC<PanelComponentProps> = (props) => {
  return (
    <ThemeProvider>
      <DependenciesPanelContent {...props} />
    </ThemeProvider>
  );
};
