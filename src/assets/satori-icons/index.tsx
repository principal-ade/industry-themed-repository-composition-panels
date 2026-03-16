import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

/**
 * Satori-compatible React logo icon.
 * Use this instead of react-icons/devicons-react in Satori rendering contexts.
 */
export const ReactIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#61DAFB',
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="2.139" />
    <ellipse
      cx="12"
      cy="12"
      rx="11"
      ry="4.2"
      fill="none"
      stroke={color}
      strokeWidth="1"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="11"
      ry="4.2"
      fill="none"
      stroke={color}
      strokeWidth="1"
      transform="rotate(60 12 12)"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="11"
      ry="4.2"
      fill="none"
      stroke={color}
      strokeWidth="1"
      transform="rotate(120 12 12)"
    />
  </svg>
);

// Map for easy lookup by name
export const satoriIcons = {
  react: ReactIcon,
} as const;

export type SatoriIconName = keyof typeof satoriIcons;
