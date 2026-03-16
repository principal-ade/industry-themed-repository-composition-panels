/**
 * CardBackCodeCity Stories - Code City themed card back
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { CardBackCodeCity } from './components/CardBackCodeCity';

const meta = {
  title: 'Cards/CardBackCodeCity',
  component: CardBackCodeCity,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div
          style={{
            backgroundColor: '#35654d',
            minHeight: '100vh',
            minWidth: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    width: {
      control: { type: 'number', min: 150, max: 400 },
    },
    height: {
      control: { type: 'number', min: 200, max: 500 },
    },
  },
} satisfies Meta<typeof CardBackCodeCity>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Code City card back
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 280,
  },
};

/**
 * Size variations
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
      <CardBackCodeCity width={140} height={200} />
      <CardBackCodeCity width={180} height={260} />
      <CardBackCodeCity width={220} height={320} />
      <CardBackCodeCity width={260} height={380} />
    </div>
  ),
};
