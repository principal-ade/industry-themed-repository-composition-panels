import React from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { PackageManagerIcon } from './PackageManagerIcon';

// Package manager brand colors
const PM_COLORS = {
  npm: '#CB3837',
  yarn: '#2C8EBB',
  pnpm: '#F69220',
  bun: '#FBF0DF',
  pip: '#3776AB',
  poetry: '#60A5FA',
  cargo: '#DEA584',
} as const;

type PackageManager = keyof typeof PM_COLORS;

interface Box {
  id: string;
  x: number;
  finalY: number;
  delay: number;
  size: 'sm' | 'md' | 'lg';
  // Bounce variation: [first bounce height, second bounce height, wobble rotation]
  bounce: [number, number, number];
  pm: PackageManager;
}

export const PackageLoadingGraph: React.FC = () => {
  const { theme } = useTheme();

  const dropDuration = 1.0;
  const staggerDelay = 0.7;
  const pauseDuration = 4;
  const fadeDuration = 0.4;

  // Boxes drop in sequence, stacking into a pyramid
  // Bottom row (4 boxes), middle row (2 boxes), top (1 box)
  // bounce: [first bounce height, second bounce height, wobble rotation]
  const boxes: Box[] = [
    // Bottom row - drops first, left to right (no bounce)
    {
      id: 'pkg-1',
      x: 20,
      finalY: 78,
      delay: 0,
      size: 'md',
      bounce: [0, 0, 0],
      pm: 'npm',
    },
    {
      id: 'pkg-2',
      x: 40,
      finalY: 78,
      delay: staggerDelay * 1,
      size: 'md',
      bounce: [0, 0, 0],
      pm: 'yarn',
    },
    {
      id: 'pkg-3',
      x: 60,
      finalY: 78,
      delay: staggerDelay * 2,
      size: 'md',
      bounce: [0, 0, 0],
      pm: 'pnpm',
    },
    {
      id: 'pkg-4',
      x: 80,
      finalY: 78,
      delay: staggerDelay * 3,
      size: 'md',
      bounce: [0, 0, 0],
      pm: 'cargo',
    },
    // Middle row - stacks on top (bounces)
    {
      id: 'pkg-5',
      x: 35,
      finalY: 50,
      delay: staggerDelay * 4,
      size: 'md',
      bounce: [9, 4, 0],
      pm: 'pip',
    },
    {
      id: 'pkg-6',
      x: 65,
      finalY: 50,
      delay: staggerDelay * 5,
      size: 'md',
      bounce: [11, 5, 0],
      pm: 'poetry',
    },
    // Top - crown of the pyramid (bounces + wobbles!)
    {
      id: 'pkg-7',
      x: 50,
      finalY: 22,
      delay: staggerDelay * 6,
      size: 'lg',
      bounce: [15, 7, 6],
      pm: 'bun',
    },
  ];

  const bounceDuration = 0.6; // Time for bouncing after landing
  const lastDropEnd =
    boxes[boxes.length - 1].delay + dropDuration + bounceDuration;
  const totalCycleDuration = lastDropEnd + pauseDuration + fadeDuration;

  const sizeMap = {
    sm: { width: 42, height: 38, iconSize: 18 },
    md: { width: 54, height: 48, iconSize: 24 },
    lg: { width: 68, height: 60, iconSize: 30 },
  };

  return (
    <div
      style={{
        height: '100%',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.textSecondary,
        padding: theme.space[5],
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          ${boxes
            .map((box, index) => {
              const [bounce1, bounce2, wobble] = box.bounce;
              const dropStart = (box.delay / totalCycleDuration) * 100;
              const landPoint =
                ((box.delay + dropDuration * 0.6) / totalCycleDuration) * 100;
              const bounce1Up =
                ((box.delay + dropDuration * 0.7) / totalCycleDuration) * 100;
              const bounce1Down =
                ((box.delay + dropDuration * 0.8) / totalCycleDuration) * 100;
              const bounce2Up =
                ((box.delay + dropDuration * 0.9) / totalCycleDuration) * 100;
              const settlePoint =
                ((box.delay + dropDuration + bounceDuration) /
                  totalCycleDuration) *
                100;
              const fadeStart =
                ((lastDropEnd + pauseDuration) / totalCycleDuration) * 100;

              return `
              @keyframes boxDrop-${index} {
                0% {
                  opacity: 0;
                  transform: translate(-50%, -50%) translateY(-120px) rotate(-5deg);
                }
                ${dropStart}% {
                  opacity: 0;
                  transform: translate(-50%, -50%) translateY(-120px) rotate(-5deg);
                }
                ${landPoint}% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translateY(4px) rotate(${wobble}deg);
                }
                ${bounce1Up}% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translateY(-${bounce1}px) rotate(${-wobble * 0.5}deg);
                }
                ${bounce1Down}% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translateY(2px) rotate(${wobble * 0.3}deg);
                }
                ${bounce2Up}% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translateY(-${bounce2}px) rotate(${-wobble * 0.2}deg);
                }
                ${settlePoint}% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translateY(0) rotate(0deg);
                }
                ${fadeStart}% {
                  opacity: 1;
                  transform: translate(-50%, -50%) translateY(0) rotate(0deg);
                }
                100% {
                  opacity: 0;
                  transform: translate(-50%, -50%) translateY(20px) rotate(0deg);
                }
              }
            `;
            })
            .join('')}

          @keyframes shadowPulse {
            0%, 100% {
              opacity: 0.1;
              transform: translateX(-50%) scaleX(0.5);
            }
            50% {
              opacity: 0.2;
              transform: translateX(-50%) scaleX(1);
            }
          }
        `}
      </style>

      {/* Graph Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          minWidth: '340px',
          height: '220px',
          flexShrink: 0,
          marginBottom: theme.space[4],
        }}
      >
        {/* Drop shadows on the "floor" */}
        {boxes.map((box) => {
          const { width } = sizeMap[box.size];
          const color = PM_COLORS[box.pm];
          return (
            <div
              key={`shadow-${box.id}`}
              style={{
                position: 'absolute',
                left: `${box.x}%`,
                top: `${box.finalY + 12}%`,
                width: width * 0.8,
                height: 6,
                borderRadius: '50%',
                backgroundColor: color,
                opacity: 0.2,
                transform: 'translateX(-50%)',
                animation: `shadowPulse ${totalCycleDuration}s ease-in-out infinite`,
                animationDelay: `${box.delay}s`,
              }}
            />
          );
        })}

        {/* Dropping Boxes */}
        {boxes.map((box, index) => {
          const { width, height, iconSize } = sizeMap[box.size];
          const color = PM_COLORS[box.pm];
          return (
            <div
              key={box.id}
              style={{
                position: 'absolute',
                left: `${box.x}%`,
                top: `${box.finalY}%`,
                width,
                height,
                borderRadius: theme.radii[2],
                backgroundColor: theme.colors.backgroundSecondary,
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                boxShadow: `0 4px 12px ${color}40`,
                animation: `boxDrop-${index} ${totalCycleDuration}s ease-out infinite`,
              }}
            >
              <PackageManagerIcon packageManager={box.pm} size={iconSize} />
            </div>
          );
        })}
      </div>

      {/* Loading Text */}
      <div
        style={{
          fontSize: theme.fontSizes[2],
          fontFamily: theme.fonts.body,
          fontWeight: theme.fontWeights.medium,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.space[2],
          flexShrink: 0,
        }}
      >
        Loading packages...
      </div>

      <div
        style={{
          fontSize: theme.fontSizes[1],
          fontFamily: theme.fonts.body,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Discovering dependencies and configurations
      </div>
    </div>
  );
};
