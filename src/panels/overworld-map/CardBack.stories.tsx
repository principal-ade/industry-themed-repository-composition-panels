/**
 * CardBack Stories - Demonstrates the back face of repo cards
 *
 * The CardBack component is designed to work with future card flip animations.
 * It shares the same outer structure as CardLayout for visual consistency.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@principal-ade/industry-theme';
import { CardBack } from './components/CardBack';

const meta = {
  title: 'Panels/Overworld Map/CardBack',
  component: CardBack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div
          style={{
            backgroundColor: '#35654d',
            padding: '40px',
            borderRadius: '8px',
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
} satisfies Meta<typeof CardBack>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card back
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
      <CardBack width={140} height={200} />
      <CardBack width={180} height={260} />
      <CardBack width={220} height={320} />
      <CardBack width={260} height={380} />
    </div>
  ),
};

/**
 * Side by side with placeholder for front (for flip preview)
 */
export const FlipPreview: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 200,
            height: 280,
            backgroundColor: '#1a1a2e',
            border: '3px solid #3178c6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
          }}
        >
          Front (RepoCard)
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          Front Face
        </div>
      </div>
      <div style={{ fontSize: '24px', color: '#666' }}>↔</div>
      <div style={{ textAlign: 'center' }}>
        <CardBack width={200} height={280} />
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          Back Face
        </div>
      </div>
    </div>
  ),
};
