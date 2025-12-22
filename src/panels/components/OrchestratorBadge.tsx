import React from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import type { MonorepoOrchestrator, MonorepoRootRole } from '../../types/composition';
import { orchestratorLogos, orchestratorColors } from '../../assets/orchestrators';

interface OrchestratorBadgeProps {
  orchestrator: MonorepoOrchestrator;
  rootRole?: MonorepoRootRole;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const orchestratorLabels: Record<MonorepoOrchestrator, string> = {
  turbo: 'Turbo',
  nx: 'Nx',
  lerna: 'Lerna',
  pnpm: 'pnpm',
  rush: 'Rush',
  none: 'Unknown',
};

export const OrchestratorBadge: React.FC<OrchestratorBadgeProps> = ({
  orchestrator,
  size = 'sm',
  showLabel = true,
}) => {
  const { theme } = useTheme();

  if (orchestrator === 'none') {
    return null;
  }

  const LogoComponent = orchestratorLogos[orchestrator];
  const color = orchestratorColors[orchestrator];
  const label = orchestratorLabels[orchestrator];

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 14 : 18;
  const fontSize = isSmall ? theme.fontSizes[0] : theme.fontSizes[1];
  const padding = isSmall ? '3px 6px' : '4px 10px';
  const gap = isSmall ? '4px' : '6px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        padding,
        backgroundColor: color + '18',
        borderRadius: '4px',
        fontSize,
        fontWeight: 500,
        color: theme.colors.text,
        whiteSpace: 'nowrap',
        border: `1px solid ${color}30`,
      }}
      title={`Monorepo managed by ${label}`}
    >
      <LogoComponent size={iconSize} />
      {showLabel && <span>{label}</span>}
    </span>
  );
};
