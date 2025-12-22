import React from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { ArrowUp, FileCode } from 'lucide-react';
import type { ConfigFile } from '../../types/composition';

interface InheritedConfigIndicatorProps {
  config: ConfigFile & { name: string };
  onClick?: (config: ConfigFile) => void;
}

/**
 * Displays a config file with an indicator if it's inherited from a parent package.
 *
 * - Local configs: shown with file icon
 * - Inherited configs: shown with upward arrow and "from root" text
 */
export const InheritedConfigIndicator: React.FC<InheritedConfigIndicatorProps> = ({
  config,
  onClick,
}) => {
  const { theme } = useTheme();

  const isInherited = config.isInherited;
  const isInline = config.isInline;

  return (
    <button
      onClick={() => onClick?.(config)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        backgroundColor: isInherited
          ? theme.colors.primary + '08'
          : theme.colors.backgroundTertiary,
        border: `1px solid ${isInherited ? theme.colors.primary + '30' : theme.colors.border}`,
        borderRadius: '4px',
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = theme.colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isInherited
          ? theme.colors.primary + '30'
          : theme.colors.border;
      }}
    >
      {/* Icon */}
      {isInherited ? (
        <ArrowUp size={14} color={theme.colors.primary} />
      ) : (
        <FileCode size={14} color={theme.colors.textSecondary} />
      )}

      {/* Config name and path */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: theme.fontSizes[1],
            fontWeight: 500,
            color: theme.colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {config.name}
          {isInline && (
            <span
              style={{
                marginLeft: '6px',
                padding: '1px 5px',
                backgroundColor: theme.colors.textSecondary + '20',
                color: theme.colors.textSecondary,
                borderRadius: '3px',
                fontSize: theme.fontSizes[0],
                fontWeight: 400,
              }}
            >
              {config.inlineField}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: theme.fontSizes[0],
            color: theme.colors.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isInherited ? (
            <>
              <span style={{ color: theme.colors.primary }}>inherited</span>
              {config.inheritedFrom && (
                <span> from {config.inheritedFrom}</span>
              )}
            </>
          ) : (
            config.path
          )}
        </div>
      </div>

      {/* Config type badge */}
      <span
        style={{
          padding: '2px 6px',
          backgroundColor: theme.colors.backgroundSecondary,
          color: theme.colors.textSecondary,
          borderRadius: '3px',
          fontSize: theme.fontSizes[0],
          fontWeight: 500,
          textTransform: 'uppercase',
        }}
      >
        {config.type}
      </span>
    </button>
  );
};

interface ConfigListProps {
  configs: Array<ConfigFile & { name: string }>;
  onConfigClick?: (config: ConfigFile) => void;
}

/**
 * Displays a list of config files, grouped by local and inherited.
 */
export const ConfigList: React.FC<ConfigListProps> = ({
  configs,
  onConfigClick,
}) => {
  const { theme } = useTheme();

  const localConfigs = configs.filter((c) => !c.isInherited);
  const inheritedConfigs = configs.filter((c) => c.isInherited);

  if (configs.length === 0) {
    return (
      <div
        style={{
          padding: '12px',
          color: theme.colors.textSecondary,
          fontSize: theme.fontSizes[1],
          textAlign: 'center',
        }}
      >
        No config files detected
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Local configs */}
      {localConfigs.length > 0 && (
        <div>
          <div
            style={{
              fontSize: theme.fontSizes[0],
              color: theme.colors.textSecondary,
              marginBottom: '6px',
              fontWeight: 500,
            }}
          >
            Local ({localConfigs.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {localConfigs.map((config) => (
              <InheritedConfigIndicator
                key={config.path + config.name}
                config={config}
                onClick={onConfigClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inherited configs */}
      {inheritedConfigs.length > 0 && (
        <div>
          <div
            style={{
              fontSize: theme.fontSizes[0],
              color: theme.colors.primary,
              marginBottom: '6px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowUp size={12} />
            Inherited ({inheritedConfigs.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {inheritedConfigs.map((config) => (
              <InheritedConfigIndicator
                key={config.path + config.name}
                config={config}
                onClick={onConfigClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
