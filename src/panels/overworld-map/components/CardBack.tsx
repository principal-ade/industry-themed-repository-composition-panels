/**
 * CardBack - Back face of the repo card
 *
 * Displays the reverse side of a repository card, designed to work with
 * future card flip animations. Shares the same outer dimensions and
 * border styling as CardLayout for visual consistency.
 */

import React from 'react';
import { useTheme } from '@principal-ade/industry-theme';

export interface CardBackProps {
  /** Card width */
  width?: number;

  /** Card height */
  height?: number;
}

/** Git logo SVG as a React component */
const GitLogo: React.FC<{ size?: number; color?: string }> = ({
  size = 80,
  color = '#F05032',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 92 92"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M90.156 41.965L50.036 1.848a5.913 5.913 0 00-8.368 0l-8.332 8.332 10.566 10.566a7.03 7.03 0 017.178 1.69 7.043 7.043 0 011.673 7.277l10.183 10.184a7.026 7.026 0 017.306 1.655 7.043 7.043 0 11-10.144 9.761 7.042 7.042 0 01-1.578-7.643l-9.5-9.5v24.997a7.042 7.042 0 11-5.818-.13V33.775a7.042 7.042 0 01-3.82-9.234L29.242 14.272 1.73 41.777a5.925 5.925 0 000 8.371L41.852 90.27a5.925 5.925 0 008.37 0l39.934-39.934a5.925 5.925 0 000-8.371"
      fill={color}
    />
  </svg>
);

/** Unique ID for keyframes to avoid conflicts */
const KEYFRAMES_ID = 'card-back-twinkle';

/** Inject keyframes once */
const injectKeyframes = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
};

/** Individual speck component */
const Speck: React.FC<{
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}> = ({ x, y, size, delay, duration }) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.5)',
      animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
    }}
  />
);

/** Generate evenly distributed specks with awkward jitter */
const generateSpecks = (cols: number, rows: number) => {
  const specks = [];
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Base position in center of cell
      const baseX = col * cellWidth + cellWidth / 2;
      const baseY = row * cellHeight + cellHeight / 2;

      // Add awkward jitter (offset within cell, sometimes a lot, sometimes a little)
      const jitterX = (Math.random() - 0.5) * cellWidth * 0.8;
      const jitterY = (Math.random() - 0.5) * cellHeight * 0.8;

      specks.push({
        x: baseX + jitterX,
        y: baseY + jitterY,
        size: 1 + Math.random() * 1.5,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
      });
    }
  }
  return specks;
};

const specks = generateSpecks(5, 6);

/**
 * CardBack renders the back face of a repository card.
 */
export const CardBack: React.FC<CardBackProps> = ({
  width = 200,
  height = 280,
}) => {
  const { theme } = useTheme();

  // Inject keyframes on mount
  React.useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '12px',
        width,
        height,
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 4px #1a1a2e, inset 0 0 0 6px #F05032',
      }}
    >
      {/* Animated specks */}
      {specks.map((speck, i) => (
        <Speck key={i} {...speck} />
      ))}
      {/* Centered content - text above and below logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes[3],
              fontWeight: theme.fontWeights.bold,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.05em',
            }}
          >
            Principal
          </span>
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes[3],
              fontWeight: theme.fontWeights.bold,
              color: '#F05032',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.05em',
            }}
          >
            AI
          </span>
        </div>

        <GitLogo size={Math.min(80, width * 0.4)} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes[0],
              fontWeight: theme.fontWeights.medium,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
            }}
          >
            Repository
          </span>
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes[0],
              fontWeight: theme.fontWeights.medium,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
            }}
          >
            Card
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardBack;
