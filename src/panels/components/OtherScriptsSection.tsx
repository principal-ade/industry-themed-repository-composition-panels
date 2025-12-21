import React, { useState } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { Terminal, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { PackageCommand } from '../../types/composition';

interface OtherScriptsSectionProps {
  commands: PackageCommand[];
  onCommandClick?: (command: PackageCommand) => void;
}

export const OtherScriptsSection: React.FC<OtherScriptsSectionProps> = ({
  commands,
  onCommandClick,
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out lens commands - these are already shown in the Lenses section
  const nonLensCommands = commands.filter(cmd => !cmd.isLensCommand);

  if (nonLensCommands.length === 0) {
    return null;
  }

  return (
    <div style={{ borderTop: `1px solid ${theme.colors.border}` }}>
      {/* Section Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: theme.colors.backgroundTertiary,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {isExpanded ? (
          <ChevronDown size={14} color={theme.colors.textSecondary} />
        ) : (
          <ChevronRight size={14} color={theme.colors.textSecondary} />
        )}
        <span
          style={{
            fontSize: theme.fontSizes[0],
            fontWeight: 600,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Other Scripts
        </span>
        <span
          style={{
            fontSize: theme.fontSizes[0],
            color: theme.colors.textSecondary,
            marginLeft: 'auto',
          }}
        >
          {nonLensCommands.length}
        </span>
      </button>

      {/* Scripts List */}
      {isExpanded && (
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {nonLensCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => onCommandClick?.(cmd)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                backgroundColor: theme.colors.backgroundSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                color: theme.colors.text,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              <Terminal size={12} color={theme.colors.textSecondary} />
              <span
                style={{
                  fontWeight: 500,
                  fontSize: theme.fontSizes[1],
                  minWidth: '60px',
                }}
              >
                {cmd.name}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: theme.fontSizes[0],
                  color: theme.colors.textSecondary,
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {cmd.command}
              </span>
              <ExternalLink size={10} color={theme.colors.textSecondary} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
