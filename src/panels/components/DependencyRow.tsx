import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import type { DependencyItem } from '../../types/dependencies';

interface DependencyRowProps {
  dependency: DependencyItem;
}

export const DependencyRow: React.FC<DependencyRowProps> = ({ dependency }) => {
  const { theme } = useTheme();

  const getDependencyTypeBadgeStyle = (type: string) => {
    const baseStyle = {
      padding: `${theme.space[1]}px ${theme.space[2]}px`,
      borderRadius: `${theme.radii[1]}px`,
      fontSize: `${theme.fontSizes[0]}px`,
      fontWeight: theme.fontWeights.medium,
      minWidth: '36px',
      textAlign: 'center' as const,
    };

    switch (type) {
      case 'production':
        return {
          ...baseStyle,
          backgroundColor: `${theme.colors.primary}20`,
          color: theme.colors.primary,
        };
      case 'development':
        return {
          ...baseStyle,
          backgroundColor: `${theme.colors.secondary}20`,
          color: theme.colors.secondary,
        };
      case 'peer':
        return {
          ...baseStyle,
          backgroundColor: `${theme.colors.accent}20`,
          color: theme.colors.accent,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.backgroundLight,
          color: theme.colors.textSecondary,
        };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${theme.space[2]}px ${theme.space[3]}px`,
        backgroundColor: theme.colors.background,
        borderRadius: `${theme.radii[1]}px`,
        fontSize: `${theme.fontSizes[1]}px`,
        border: `1px solid ${theme.colors.border}`,
        transition: 'all 0.2s',
      }}
    >
      {/* Type badge and package name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${theme.space[2]}px`,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span style={getDependencyTypeBadgeStyle(dependency.dependencyType)}>
          {dependency.dependencyType === 'production'
            ? 'prod'
            : dependency.dependencyType === 'development'
              ? 'dev'
              : 'peer'}
        </span>
        <span
          style={{
            fontWeight: theme.fontWeights.medium,
            color: theme.colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {dependency.name}
        </span>
      </div>

      {/* Version and npm link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: theme.colors.textSecondary }}>
          {dependency.version}
        </span>

        {/* NPM link */}
        <a
          href={`https://www.npmjs.com/package/${dependency.name}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: `${theme.space[1]}px`,
            borderRadius: `${theme.radii[1]}px`,
            display: 'flex',
            alignItems: 'center',
            transition: 'background-color 0.2s',
          }}
          title="View on npm"
        >
          <ExternalLink size={12} color={theme.colors.textSecondary} />
        </a>
      </div>
    </div>
  );
};
