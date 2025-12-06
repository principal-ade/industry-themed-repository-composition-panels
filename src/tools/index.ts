/**
 * Panel Tools
 *
 * UTCP-compatible tools for this panel extension.
 * These tools can be invoked by AI agents and emit events that panels listen for.
 *
 * IMPORTANT: This file should NOT import any React components to ensure
 * it can be imported server-side without pulling in React dependencies.
 * Use the './tools' subpath export for server-safe imports.
 */

import type { PanelTool, PanelToolsMetadata } from '@principal-ade/utcp-panel-event';

/**
 * Tool: Refresh Git Status
 */
export const refreshGitStatusTool: PanelTool = {
  name: 'refresh_git_status',
  description: 'Refreshes the git status display in the example panel',
  inputs: {
    type: 'object',
    properties: {
      force: {
        type: 'boolean',
        description: 'Force refresh even if data is fresh',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
    },
  },
  tags: ['git', 'refresh', 'status'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'your-org.example-panel:refresh-git',
  },
};

/**
 * Tool: Select File
 */
export const selectFileTool: PanelTool = {
  name: 'select_file',
  description: 'Selects and highlights a file in the example panel file list',
  inputs: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file to select',
      },
      scrollIntoView: {
        type: 'boolean',
        description: 'Whether to scroll the file into view',
      },
    },
    required: ['filePath'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      selectedFile: { type: 'string' },
    },
  },
  tags: ['file', 'selection', 'navigation'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'your-org.example-panel:select-file',
  },
};

/**
 * Tool: Toggle Section
 */
export const toggleSectionTool: PanelTool = {
  name: 'toggle_section',
  description: 'Toggles the visibility of a section in the example panel',
  inputs: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        enum: ['staged', 'unstaged', 'untracked'],
        description: 'The section to toggle',
      },
      expanded: {
        type: 'boolean',
        description: 'Whether to expand (true) or collapse (false) the section',
      },
    },
    required: ['section'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      section: { type: 'string' },
      expanded: { type: 'boolean' },
    },
  },
  tags: ['ui', 'toggle', 'section'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: 'your-org.example-panel:toggle-section',
  },
};

/**
 * All tools exported as an array.
 */
export const examplePanelTools: PanelTool[] = [
  refreshGitStatusTool,
  selectFileTool,
  toggleSectionTool,
];

/**
 * Panel tools metadata for registration with PanelToolRegistry.
 */
export const examplePanelToolsMetadata: PanelToolsMetadata = {
  id: 'your-org.example-panel',
  name: 'Example Panel',
  description: 'Tools provided by the example panel extension',
  tools: examplePanelTools,
};
