/**
 * Storybook stories for IsometricGridTest
 */

import type { Meta, StoryObj } from '@storybook/react';
import { IsometricGridTest } from './IsometricGridTest';

const meta = {
  title: 'Overworld Map/Isometric Grid Test',
  component: IsometricGridTest,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IsometricGridTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single Region (1×1) with centered sprite
 * 25×25 tiles - the base unit for layout
 * Green diamond = boundary (4×size), Red dot = center point
 */
export const OneRegion: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 25,
    showSprite: true,
    spriteGridX: 12.5,
    spriteGridY: 12.5,
    spriteSize: 2,
  },
};

/**
 * Four Regions (2×2)
 * 50×50 tiles - shows how multiple regions connect
 */
export const FourRegions: Story = {
  args: {
    gridWidth: 50,
    gridHeight: 50,
    showSprite: false,
  },
};

/**
 * Small sprite (1x) at corner
 */
export const SmallSprite: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 25,
    showSprite: true,
    spriteGridX: 5,
    spriteGridY: 5,
    spriteSize: 1,
  },
};

/**
 * Large sprite (3x) at center
 * Centered on whole tile (12, 12) since boundary is even-sized (12 tiles)
 */
export const LargeSprite: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 25,
    showSprite: true,
    spriteGridX: 12,
    spriteGridY: 12,
    spriteSize: 3,
  },
};

/**
 * Multiple positions to test layout
 */
export const MultiplePositions: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 25,
    showSprite: true,
    spriteGridX: 8,
    spriteGridY: 8,
    spriteSize: 2,
  },
};
