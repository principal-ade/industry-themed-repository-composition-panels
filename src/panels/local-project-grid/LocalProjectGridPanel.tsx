/**
 * LocalProjectGridPanel - Grid display of local Alexandria projects
 *
 * Displays AlexandriaEntry items in a responsive card grid using the
 * CardLayout styling from the overworld-map components.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { Search } from 'lucide-react';
import { LocalProjectCard } from './LocalProjectCard';
import { CardBack } from '../overworld-map/components/CardBack';
import type { LocalProjectGridPanelProps } from './types';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library';

/** Unique ID for bounce keyframes */
const BOUNCE_KEYFRAMES_ID = 'card-back-bounce';

/** Inject bounce keyframes once */
const injectBounceKeyframes = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(BOUNCE_KEYFRAMES_ID)) return;

  const style = document.createElement('style');
  style.id = BOUNCE_KEYFRAMES_ID;
  style.textContent = `
    @keyframes cardBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `;
  document.head.appendChild(style);
};

/** Loading card with random bounce animation */
const LoadingCard: React.FC<{ index: number }> = ({ index }) => {
  // Generate random animation properties based on index
  const delay = useMemo(() => index * 0.15 + Math.random() * 0.3, [index]);
  const duration = useMemo(() => 1.2 + Math.random() * 0.6, []);

  return (
    <div
      style={{
        animation: `cardBounce ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <CardBack width={220} height={300} />
    </div>
  );
};

/** Grid of loading cards */
const LoadingGrid: React.FC = () => {
  useEffect(() => {
    injectBounceKeyframes();
  }, []);

  // Show 6 loading cards
  const cardCount = 6;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px',
        justifyItems: 'center',
      }}
    >
      {Array.from({ length: cardCount }, (_, i) => (
        <LoadingCard key={i} index={i} />
      ))}
    </div>
  );
};

/**
 * Sort projects by last opened date (most recent first)
 */
function sortByLastOpened(projects: AlexandriaEntry[]): AlexandriaEntry[] {
  return [...projects].sort((a, b) => {
    const aDate = a.lastOpenedAt || a.registeredAt || '';
    const bDate = b.lastOpenedAt || b.registeredAt || '';
    return bDate.localeCompare(aDate);
  });
}

/**
 * Filter projects by search query
 */
function filterProjects(
  projects: AlexandriaEntry[],
  query: string
): AlexandriaEntry[] {
  if (!query.trim()) return projects;

  const lowerQuery = query.toLowerCase();
  return projects.filter((project) => {
    return (
      project.name.toLowerCase().includes(lowerQuery) ||
      project.path.toLowerCase().includes(lowerQuery) ||
      project.github?.owner?.toLowerCase().includes(lowerQuery) ||
      project.github?.primaryLanguage?.toLowerCase().includes(lowerQuery) ||
      project.github?.description?.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Main content component for LocalProjectGridPanel
 */
export const LocalProjectGridPanelContent: React.FC<
  LocalProjectGridPanelProps
> = ({ context, actions }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] =
    useState<AlexandriaEntry | null>(null);

  // Get projects from context
  const projectsSlice = context.localProjects;
  const projects = projectsSlice?.data ?? [];
  const isLoading = projectsSlice?.loading ?? false;

  // Filter and sort projects
  const displayProjects = useMemo(() => {
    const filtered = filterProjects(projects, searchQuery);
    return sortByLastOpened(filtered);
  }, [projects, searchQuery]);

  // Handle card selection
  const handleCardClick = (entry: AlexandriaEntry) => {
    setSelectedProject(entry);
    actions.selectProject?.(entry);
  };

  // Handle open action
  const handleOpen = (entry: AlexandriaEntry) => {
    actions.openProject?.(entry);
  };

  // Handle remove action
  const handleRemove = (entry: AlexandriaEntry) => {
    actions.removeProject?.(entry);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
      }}
    >
      {/* Header with search */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: '6px',
            padding: '8px 12px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <Search size={16} color={theme.colors.textSecondary} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.colors.text,
              fontSize: theme.fontSizes[1],
              fontFamily: theme.fonts.body,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                padding: '0 4px',
                fontSize: theme.fontSizes[1],
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results count */}
        <div
          style={{
            marginTop: '8px',
            fontSize: theme.fontSizes[0],
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.body,
          }}
        >
          {isLoading
            ? 'Loading projects...'
            : `${displayProjects.length} project${displayProjects.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Grid container */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {isLoading ? (
          <LoadingGrid />
        ) : displayProjects.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: theme.colors.textSecondary,
              fontFamily: theme.fonts.body,
              textAlign: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: theme.fontSizes[2] }}>
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </div>
            <div style={{ fontSize: theme.fontSizes[1] }}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add a project to get started'}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
              justifyItems: 'center',
            }}
          >
            {displayProjects.map((project) => (
              <LocalProjectCard
                key={project.path}
                entry={project}
                isSelected={selectedProject?.path === project.path}
                onClick={handleCardClick}
                onOpen={actions.openProject ? handleOpen : undefined}
                onRemove={actions.removeProject ? handleRemove : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Preview component for panel switcher
 */
export const LocalProjectGridPanelPreview: React.FC<
  LocalProjectGridPanelProps
> = ({ context }) => {
  const { theme } = useTheme();
  const projects = context.localProjects?.data ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '4px',
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <div
        style={{
          fontSize: theme.fontSizes[2],
          fontWeight: theme.fontWeights.medium,
        }}
      >
        {projects.length}
      </div>
      <div
        style={{
          fontSize: theme.fontSizes[0],
          color: theme.colors.textSecondary,
        }}
      >
        Projects
      </div>
    </div>
  );
};

/**
 * Panel wrapper component (receives Panel Framework props)
 */
export const LocalProjectGridPanel: React.FC<LocalProjectGridPanelProps> = (
  props
) => {
  return <LocalProjectGridPanelContent {...props} />;
};

export default LocalProjectGridPanel;
