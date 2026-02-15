/**
 * Layout Engine Test - Demonstrates automatic collision-free sprite placement
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LayoutEngineTest } from './LayoutEngineTest';

const meta = {
  title: 'Panels/Overworld Map/Layout Engine Test',
  component: LayoutEngineTest,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayoutEngineTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Mixed distribution (18 total sprites)
 * 5×1.0x, 4×1.5x, 4×2.0x, 3×2.5x, 2×3.0x
 */
export const Default: Story = {
  args: {
    sizeDistribution: {
      size1_0: 5,
      size1_5: 4,
      size2_0: 4,
      size2_5: 3,
      size3_0: 2,
    },
  },
};

/**
 * Many Small: Mostly small sprites (25 total)
 * 15×1.0x, 10×1.5x
 */
export const ManySmall: Story = {
  args: {
    sizeDistribution: {
      size1_0: 15,
      size1_5: 10,
      size2_0: 0,
      size2_5: 0,
      size3_0: 0,
    },
  },
};

/**
 * Few Large: Mostly large sprites (12 total)
 * 5×2.0x, 4×2.5x, 3×3.0x
 */
export const FewLarge: Story = {
  args: {
    sizeDistribution: {
      size1_0: 0,
      size1_5: 0,
      size2_0: 5,
      size2_5: 4,
      size3_0: 3,
    },
  },
};

/**
 * Balanced: Equal distribution (15 total)
 * 3 of each size
 */
export const Balanced: Story = {
  args: {
    sizeDistribution: {
      size1_0: 3,
      size1_5: 3,
      size2_0: 3,
      size2_5: 3,
      size3_0: 3,
    },
  },
};

/**
 * Overflow Test: Too many sprites (40 total)
 * Should exceed region capacity - check console for overflow
 */
export const OverflowTest: Story = {
  args: {
    sizeDistribution: {
      size1_0: 10,
      size1_5: 10,
      size2_0: 10,
      size2_5: 5,
      size3_0: 5,
    },
  },
};

/**
 * Language Colors: Different languages with their colors
 * Demonstrates language-based sprite coloring
 */
export const LanguageColors: Story = {
  args: {
    sprites: [
      { size: 2.0, language: 'typescript', count: 3 },  // cyan
      { size: 2.0, language: 'python', count: 3 },      // yellow
      { size: 2.0, language: 'rust', count: 3 },        // red
      { size: 2.0, language: 'go', count: 3 },          // green
      { size: 1.5, language: 'javascript', count: 2 },  // cyan
      { size: 1.5, language: 'java', count: 2 },        // orange
    ],
  },
};

/**
 * Mixed Languages: Different sizes and languages
 * Realistic distribution with multiple languages
 */
export const MixedLanguages: Story = {
  args: {
    sprites: [
      { size: 3.0, language: 'typescript', count: 2 },  // Large TypeScript
      { size: 2.5, language: 'python', count: 2 },      // Medium Python
      { size: 2.0, language: 'rust', count: 3 },        // Medium Rust
      { size: 2.0, language: 'go', count: 3 },          // Medium Go
      { size: 1.5, language: 'javascript', count: 4 },  // Small JS
      { size: 1.0, language: 'typescript', count: 5 },  // Tiny TS
    ],
  },
};
