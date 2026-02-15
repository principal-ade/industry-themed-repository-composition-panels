/**
 * Building Size Test - Demonstrates repository size scaling
 */

import type { Meta, StoryObj } from '@storybook/react';
import { BuildingSizeTest } from './BuildingSizeTest';

const meta = {
  title: 'Panels/Overworld Map/Building Size Test',
  component: BuildingSizeTest,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BuildingSizeTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Shows buildings at different sizes (1.5x to 4.0x multiplier)
 * Demonstrates logarithmic scaling based on repository metrics
 */
export const SizeComparison: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 25,
  },
};

/**
 * Shows progression: tiny → small → medium → large → huge
 */
export const SizeProgression: Story = {
  args: {
    gridWidth: 30,
    gridHeight: 15,
  },
};
