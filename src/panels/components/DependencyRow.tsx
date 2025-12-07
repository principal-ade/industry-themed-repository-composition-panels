import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import type { DependencyItem } from '../../types/dependencies';

interface DependencyRowProps {
  dependency: DependencyItem;
}

export const DependencyRow: React.FC<DependencyRowProps> = ({ dependency }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const copyText = `${dependency.name}@${dependency.version}`;
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: `${theme.space[1]}px`,
    borderRadius: `${theme.radii[1]}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    opacity: isHovered ? 1 : 0,
    pointerEvents: isHovered ? 'auto' : 'none',
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        {/* NPM link - next to package name */}
        <a
          href={`https://www.npmjs.com/package/${dependency.name}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...actionButtonStyle,
            color: theme.colors.textSecondary,
            textDecoration: 'none',
            flexShrink: 0,
          }}
          title="View on npm"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Copy button and version */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Copy button - left of version */}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...actionButtonStyle,
            color: copied ? theme.colors.success || '#10b981' : theme.colors.textSecondary,
          }}
          title={copied ? 'Copied!' : `Copy ${dependency.name}@${dependency.version}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>

        <span style={{ color: theme.colors.textSecondary }}>
          {dependency.version}
        </span>
      </div>
    </div>
  );
};
