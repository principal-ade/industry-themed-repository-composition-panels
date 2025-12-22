import React, { useState } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { Check, X, AlertTriangle, ChevronDown, ChevronRight, Minus, ArrowUp } from 'lucide-react';
import type { LensReadiness, LensRequirement, RequirementCheckResult } from '../../types/composition';

interface LensReadinessSectionProps {
  lensReadiness?: Record<string, LensReadiness>;
}

interface LensRowProps {
  lens: LensReadiness;
}

const LensRow: React.FC<LensRowProps> = ({ lens }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine status icon and color
  const getStatusDisplay = () => {
    if (lens.ready) {
      return { icon: Check, color: '#10b981', label: 'Ready' };
    }
    if (lens.partial) {
      return { icon: AlertTriangle, color: '#f59e0b', label: 'Partial' };
    }
    if (lens.checks.some((c: RequirementCheckResult) => c.satisfied)) {
      return { icon: X, color: '#ef4444', label: 'Missing' };
    }
    return { icon: Minus, color: theme.colors.textSecondary, label: 'Not configured' };
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;
  const hasDetails = lens.checks.length > 0;

  return (
    <div
      style={{
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Lens Header */}
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: hasDetails ? 'pointer' : 'default',
          textAlign: 'left',
          color: theme.colors.text,
        }}
      >
        {hasDetails && (
          isExpanded ? (
            <ChevronDown size={14} color={theme.colors.textSecondary} />
          ) : (
            <ChevronRight size={14} color={theme.colors.textSecondary} />
          )
        )}
        {!hasDetails && <div style={{ width: 14 }} />}

        <StatusIcon size={16} color={status.color} />

        <span
          style={{
            flex: 1,
            fontSize: theme.fontSizes[1],
            fontWeight: 500,
            color: lens.ready ? theme.colors.text : theme.colors.textSecondary,
          }}
        >
          {lens.displayName}
        </span>

        {/* Inheritance indicator */}
        {lens.ready && lens.readyViaInheritance && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: theme.fontSizes[0],
              color: theme.colors.primary,
              padding: '2px 6px',
              backgroundColor: theme.colors.primary + '15',
              borderRadius: '4px',
            }}
          >
            <ArrowUp size={10} />
            inherited
          </span>
        )}

        {lens.missing.length > 0 && (
          <span
            style={{
              fontSize: theme.fontSizes[0],
              color: status.color,
              padding: '2px 6px',
              backgroundColor: status.color + '15',
              borderRadius: '4px',
            }}
          >
            {lens.missing.length} missing
          </span>
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && hasDetails && (
        <div
          style={{
            padding: '0 12px 12px 34px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {lens.checks.map((check: RequirementCheckResult, idx: number) => (
            <RequirementRow key={idx} check={check} />
          ))}
        </div>
      )}
    </div>
  );
};

interface RequirementRowProps {
  check: {
    requirement: LensRequirement;
    satisfied: boolean;
    foundValue?: string;
    isInherited?: boolean;
    inheritedFrom?: string;
  };
}

const RequirementRow: React.FC<RequirementRowProps> = ({ check }) => {
  const { theme } = useTheme();
  const { requirement, satisfied, foundValue, isInherited, inheritedFrom } = check;

  const typeLabels: Record<string, string> = {
    devDependency: 'dep',
    script: 'script',
    config: 'config',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: theme.fontSizes[0],
        padding: '4px 0',
      }}
    >
      {satisfied ? (
        isInherited ? (
          <ArrowUp size={12} color={theme.colors.primary} />
        ) : (
          <Check size={12} color="#10b981" />
        )
      ) : (
        <X size={12} color="#ef4444" />
      )}

      <span
        style={{
          padding: '1px 4px',
          backgroundColor: theme.colors.backgroundTertiary,
          color: theme.colors.textSecondary,
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 500,
          textTransform: 'uppercase',
        }}
      >
        {typeLabels[requirement.type] || requirement.type}
      </span>

      <span
        style={{
          color: satisfied ? theme.colors.text : theme.colors.textSecondary,
          fontFamily: 'monospace',
        }}
      >
        {requirement.name}
      </span>

      {satisfied && (isInherited || foundValue) && (
        <span
          style={{
            color: isInherited ? theme.colors.primary : theme.colors.textSecondary,
            marginLeft: 'auto',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isInherited && (
            <>
              <span style={{ fontStyle: 'italic', fontFamily: 'inherit' }}>
                from {inheritedFrom || 'root'}
              </span>
            </>
          )}
          {!isInherited && foundValue && (
            foundValue.length > 30 ? foundValue.slice(0, 30) + '...' : foundValue
          )}
        </span>
      )}

      {!satisfied && requirement.suggestedFix && (
        <span
          style={{
            color: theme.colors.textSecondary,
            marginLeft: 'auto',
            fontStyle: 'italic',
          }}
        >
          (add: {requirement.suggestedFix})
        </span>
      )}
    </div>
  );
};

export const LensReadinessSection: React.FC<LensReadinessSectionProps> = ({
  lensReadiness,
}) => {
  const { theme } = useTheme();

  if (!lensReadiness || Object.keys(lensReadiness).length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: theme.fontSizes[1],
        }}
      >
        No lens readiness data available
      </div>
    );
  }

  // Sort lenses: ready first, then partial, then not ready
  const sortedLenses = Object.values(lensReadiness).sort((a, b) => {
    if (a.ready && !b.ready) return -1;
    if (!a.ready && b.ready) return 1;
    if (a.partial && !b.partial) return -1;
    if (!a.partial && b.partial) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const readyCount = sortedLenses.filter(l => l.ready).length;
  const totalCount = sortedLenses.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Section Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundTertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: theme.fontSizes[0],
            fontWeight: 600,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Quality Lenses
        </span>
        <span
          style={{
            fontSize: theme.fontSizes[0],
            color: readyCount === totalCount ? '#10b981' : theme.colors.textSecondary,
            fontWeight: 500,
          }}
        >
          {readyCount}/{totalCount} ready
        </span>
      </div>

      {/* Lens List */}
      <div>
        {sortedLenses.map((lens) => (
          <LensRow key={lens.lensId} lens={lens} />
        ))}
      </div>
    </div>
  );
};
