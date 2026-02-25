import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';
import type { DependencyItem, DependencyType } from '../../types/dependencies';

interface DependencyRowProps {
  dependency: DependencyItem;
}

const typeLabels: Record<DependencyType, string> = {
  production: 'prod',
  development: 'dev',
  peer: 'peer',
};

export const DependencyRow: React.FC<DependencyRowProps> = ({ dependency }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const getDependencyTypeBadgeStyle = (type: DependencyType) => {
    const baseStyle = {
      fontSize: '9px',
      fontWeight: theme.fontWeights.medium,
      fontFamily: theme.fonts.body,
      lineHeight: 1.2,
    };

    switch (type) {
      case 'production':
        return {
          ...baseStyle,
          color: theme.colors.primary,
        };
      case 'development':
        return {
          ...baseStyle,
          color: theme.colors.secondary,
        };
      case 'peer':
        return {
          ...baseStyle,
          color: theme.colors.accent,
        };
      default:
        return {
          ...baseStyle,
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
        borderRadius: 0,
        fontSize: `${theme.fontSizes[1]}px`,
        fontFamily: theme.fonts.body,
        borderBottom: `1px solid ${theme.colors.border}`,
        transition: 'all 0.2s',
        minHeight: '44px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stacked: top row (namespace + badges or just badges), bottom row (package name) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Top row: namespace (if any) + badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {dependency.namespace && (
            <span
              style={{
                fontSize: '10px',
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.body,
              }}
            >
              {dependency.namespace}
            </span>
          )}
          {/* Type badges */}
          {dependency.dependencyTypes.map((type) => (
            <span key={type} style={getDependencyTypeBadgeStyle(type)}>
              {typeLabels[type]}
            </span>
          ))}
        </div>
        {/* Package name row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${theme.space[2]}px`,
          }}
        >
          <span
            style={{
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {dependency.packageName}
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
            color: copied
              ? theme.colors.success || '#10b981'
              : theme.colors.textSecondary,
          }}
          title={
            copied ? 'Copied!' : `Copy ${dependency.name}@${dependency.version}`
          }
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>

        <span
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.body,
          }}
        >
          {dependency.version}
        </span>
      </div>
    </div>
  );
};
