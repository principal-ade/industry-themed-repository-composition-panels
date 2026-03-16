/**
 * LocalProjectCard - Card component for displaying local Alexandria projects
 *
 * Uses CardLayout for consistent styling with RepoCard/RepoCardStatic.
 * Adapted for local project data (AlexandriaEntry) with relevant metadata display.
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { CardLayout } from '../overworld-map/components/CardLayout';
import {
  getRepositoryColor,
  generateCardColors,
} from '../overworld-map/components/cardThemes';
import { renderSpriteToDataUrlCached } from '../overworld-map/components/spriteRenderer';
import type { LocalProjectCardProps } from './types';

/**
 * Format relative time for last opened display
 */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never opened';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

/**
 * LocalProjectCard renders an AlexandriaEntry as a styled card
 */
/** Standard card dimensions - matches CardLayoutOG */
const DEFAULT_CARD_WIDTH = 353;
const CARD_ASPECT_RATIO = 0.6;

export const LocalProjectCard: React.FC<LocalProjectCardProps> = ({
  entry,
  width = DEFAULT_CARD_WIDTH,
  height = Math.round(DEFAULT_CARD_WIDTH / CARD_ASPECT_RATIO),
  isSelected = false,
  namePlateStyle,
  onClick,
  onOpen,
  onRemove,
}) => {
  const { theme } = useTheme();
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate sprite properties from entry
  const color = getRepositoryColor(entry);
  const colors = generateCardColors(color);

  // Estimate size from viewCount or default
  const size = entry.viewCount ? Math.min(entry.viewCount + 1, 5) : 2;

  // Render sprite on mount
  useEffect(() => {
    let mounted = true;

    async function renderSprite() {
      try {
        const dataUrl = await renderSpriteToDataUrlCached({
          size,
          color,
          stars: entry.github?.stars,
          collaborators: undefined,
          license: entry.github?.license,
          label: entry.name,
          width: 140,
          height: 140,
        });

        if (mounted) {
          setSpriteDataUrl(dataUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to render sprite:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    renderSprite();

    return () => {
      mounted = false;
    };
  }, [size, color, entry]);

  // Sprite content based on loading state
  const spriteContent = isLoading ? (
    <div
      style={{
        width: 70,
        height: 70,
        backgroundColor: `${colors.cardHighlight}40`,
        borderRadius: '8px',
      }}
    />
  ) : spriteDataUrl ? (
    <img
      src={spriteDataUrl}
      alt={entry.name}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
      }}
    />
  ) : (
    <div
      style={{
        width: 70,
        height: 70,
        backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
        borderRadius: '8px',
        opacity: 0.5,
      }}
    />
  );

  // Build description with last opened time
  const description =
    entry.github?.description || formatRelativeTime(entry.lastOpenedAt);

  return (
    <div
      style={{
        width,
        height,
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: isHovered ? 'translateY(-4px)' : 'none',
        boxShadow: isSelected
          ? `0 0 0 3px ${theme.colors.primary}`
          : isHovered
            ? '0 8px 24px rgba(0,0,0,0.3)'
            : '0 4px 12px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
      onClick={() => onClick?.(entry)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardLayout
        color={color}
        owner={entry.github?.owner}
        ownerDisplayName={
          (entry.github as { ownerDisplayName?: string | null })
            ?.ownerDisplayName
        }
        stars={entry.github?.stars}
        label={entry.name}
        description={description}
        files={entry.viewCount || undefined}
        language={entry.github?.primaryLanguage}
        license={entry.github?.license}
        namePlateStyle={namePlateStyle}
      >
        {spriteContent}
      </CardLayout>

      {/* Action buttons overlay */}
      {isHovered && (onOpen || onRemove) && (
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10,
          }}
        >
          {onOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(entry);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: theme.fontSizes[1],
                fontFamily: theme.fonts.body,
                fontWeight: theme.fontWeights.medium,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }}
            >
              Open
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(entry);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                fontSize: theme.fontSizes[1],
                fontFamily: theme.fonts.body,
                fontWeight: theme.fontWeights.medium,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)';
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalProjectCard;
