import React from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';

type ToggleableFilterType = 'production' | 'development' | 'peer';

interface FilterBarProps {
  activeFilters: Set<ToggleableFilterType>;
  onToggleFilter: (type: ToggleableFilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    production: number;
    development: number;
    peer: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilters,
  onToggleFilter,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const { theme } = useTheme();

  // Only show filter buttons for types that have dependencies
  const availableFilters: ToggleableFilterType[] = [
    ...(counts.peer > 0 ? (['peer'] as const) : []),
    ...(counts.production > 0 ? (['production'] as const) : []),
    ...(counts.development > 0 ? (['development'] as const) : []),
  ];

  // Don't show filters if there's only one type
  const showFilters = availableFilters.length > 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${theme.space[2]}px`,
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: `${theme.space[3]}px`,
            color: theme.colors.textSecondary,
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search dependencies..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: `${theme.space[2]}px ${theme.space[5]}px`,
            borderRadius: `${theme.radii[2]}px`,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.backgroundSecondary,
            color: theme.colors.text,
            fontSize: `${theme.fontSizes[1]}px`,
            fontFamily: theme.fonts.body,
            outline: 'none',
            transition: 'all 0.2s',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: `${theme.space[2]}px`,
              padding: `${theme.space[1]}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: `${theme.radii[1]}px`,
            }}
            title="Clear search"
          >
            <X size={14} color={theme.colors.textSecondary} />
          </button>
        )}
      </div>

      {/* Type Filter Toggles */}
      {showFilters && (
        <div style={{ display: 'flex', gap: `${theme.space[1]}px`, width: '100%' }}>
          {availableFilters.map((type) => {
            const isActive = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => onToggleFilter(type)}
                style={{
                  flex: 1,
                  padding: `${theme.space[1]}px ${theme.space[2]}px`,
                  fontSize: `${theme.fontSizes[0]}px`,
                  fontWeight: theme.fontWeights.medium,
                  fontFamily: theme.fonts.body,
                  borderRadius: `${theme.radii[1]}px`,
                  border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                  backgroundColor: isActive
                    ? `${theme.colors.primary}20`
                    : theme.colors.backgroundSecondary,
                  color: isActive ? theme.colors.primary : theme.colors.text,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {type === 'production'
                  ? 'Prod'
                  : type === 'development'
                    ? 'Dev'
                    : 'Peer'}
                <span
                  style={{ marginLeft: `${theme.space[1]}px`, opacity: 0.7 }}
                >
                  ({counts[type]})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
