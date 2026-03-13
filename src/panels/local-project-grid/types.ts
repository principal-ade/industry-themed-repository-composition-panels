/**
 * Type definitions for LocalProjectGridPanel
 */

import type {
  PanelActions as CorePanelActions,
  PanelComponentProps as CorePanelComponentProps,
  DataSlice,
} from '@principal-ade/panel-framework-core';
import type { AlexandriaEntry } from '@principal-ai/alexandria-core-library';

/**
 * Actions available to LocalProjectGridPanel
 */
export interface LocalProjectGridPanelActions extends CorePanelActions {
  /** Open a project in the dev workspace */
  openProject?: (entry: AlexandriaEntry) => Promise<void>;
  /** Remove a project from the registry */
  removeProject?: (entry: AlexandriaEntry) => Promise<void>;
  /** Select a project (for detail view) */
  selectProject?: (entry: AlexandriaEntry) => void;
}

/**
 * Context data for LocalProjectGridPanel
 */
export interface LocalProjectGridPanelContext {
  /** List of registered local Alexandria repositories */
  localProjects: DataSlice<AlexandriaEntry[] | null>;
}

/**
 * Typed props for LocalProjectGridPanel
 */
export type LocalProjectGridPanelProps = CorePanelComponentProps<
  LocalProjectGridPanelActions,
  LocalProjectGridPanelContext
>;

/**
 * Props for LocalProjectCard component
 */
export interface LocalProjectCardProps {
  /** The Alexandria entry to display */
  entry: AlexandriaEntry;
  /** Card width */
  width?: number;
  /** Card height */
  height?: number;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Callback when card is clicked */
  onClick?: (entry: AlexandriaEntry) => void;
  /** Callback when open button is clicked */
  onOpen?: (entry: AlexandriaEntry) => void;
  /** Callback when remove button is clicked */
  onRemove?: (entry: AlexandriaEntry) => void;
}
