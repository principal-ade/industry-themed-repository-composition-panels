/**
 * Region Editing Test - Demonstrates interactive region placeholders
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RegionEditingTest } from './RegionEditingTest';

const meta = {
  title: 'Panels/Overworld Map/Region Editing Test',
  component: RegionEditingTest,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RegionEditingTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One Region with Placeholders
 * Shows 1 orange region (with full grid) and green placeholder outlines where you can add adjacent regions.
 * Hover over placeholders to highlight them, click to add a new region.
 */
export const Default: Story = {
  args: {
    initialRegions: 1,
  },
};
