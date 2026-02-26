/**
 * License Sign Test - Storybook stories for license-based sign/archway styling
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LicenseSignTest } from './LicenseSignTest';

const meta = {
  title: 'Panels/Overworld Map/License Sign Test',
  component: LicenseSignTest,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LicenseSignTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Shows all license types:
 * - MIT: Flower arch with open grass (permissive)
 * - Apache: Shield sign with cobblestone path (formal)
 * - GPL: Iron arch with picket fence (copyleft)
 */
export const AllLicenses: Story = {};
