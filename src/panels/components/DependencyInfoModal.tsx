import React from 'react';
import { X, Package, Scale, HelpCircle } from 'lucide-react';
import { useTheme, type Theme } from '@principal-ade/industry-theme';

interface DependencyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DependencyInfoModal: React.FC<DependencyInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.muted,
          zIndex: theme.zIndices[4],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: `${theme.radii[3]}px`,
            maxWidth: '600px',
            maxHeight: '80vh',
            width: '90%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: theme.shadows[3],
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: `${theme.space[4]}px`,
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: `${theme.fontSizes[4]}px`,
                fontWeight: theme.fontWeights.semibold,
                color: theme.colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: `${theme.space[2]}px`,
                margin: 0,
              }}
            >
              <HelpCircle size={20} />
              Understanding Dependencies
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                padding: `${theme.space[1]}px`,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: `${theme.space[4]}px`,
              overflow: 'auto',
              flex: 1,
            }}
          >
            {/* Dependency Types */}
            <Section
              icon={<Package size={18} />}
              title="Dependency Types"
              theme={theme}
            >
              <InfoItem
                badge={{ text: 'prod', color: theme.colors.primary }}
                title="Production Dependencies"
                description="Required for your application to run in production. These are bundled with your app and affect its size and security."
                theme={theme}
              />
              <InfoItem
                badge={{ text: 'dev', color: theme.colors.secondary }}
                title="Development Dependencies"
                description="Only needed during development (build tools, testing, linters). Not included in production builds."
                theme={theme}
              />
              <InfoItem
                badge={{ text: 'peer', color: theme.colors.accent }}
                title="Peer Dependencies"
                description="Expected to be provided by the consumer of your package. Important for library authors to specify compatibility."
                theme={theme}
              />
            </Section>

            {/* Licenses */}
            <Section
              icon={<Scale size={18} />}
              title="Common Licenses"
              theme={theme}
            >
              <InfoItem
                badge={{ text: 'MIT', color: theme.colors.success }}
                title="Permissive Licenses (MIT, Apache, BSD)"
                description="Few restrictions. Can use in commercial projects. Must include copyright notice."
                theme={theme}
              />
              <InfoItem
                badge={{ text: 'GPL', color: theme.colors.warning }}
                title="Copyleft Licenses (GPL, LGPL, AGPL)"
                description="Requires sharing source code of derivative works. Can impact your project's licensing."
                theme={theme}
              />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper Components
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  theme: Theme;
  children: React.ReactNode;
}> = ({ icon, title, theme, children }) => (
  <div style={{ marginBottom: `${theme.space[5]}px` }}>
    <h3
      style={{
        fontSize: `${theme.fontSizes[2]}px`,
        fontWeight: theme.fontWeights.semibold,
        color: theme.colors.text,
        marginBottom: `${theme.space[3]}px`,
        display: 'flex',
        alignItems: 'center',
        gap: `${theme.space[2]}px`,
      }}
    >
      {icon}
      {title}
    </h3>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${theme.space[2]}px`,
      }}
    >
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{
  badge: { text: string; color: string };
  title: string;
  description: string;
  theme: Theme;
}> = ({ badge, title, description, theme }) => (
  <div
    style={{
      padding: `${theme.space[3]}px`,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: `${theme.radii[2]}px`,
      border: `1px solid ${theme.colors.border}`,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${theme.space[2]}px`,
        marginBottom: `${theme.space[1]}px`,
      }}
    >
      <span
        style={{
          padding: `${theme.space[1]}px ${theme.space[2]}px`,
          borderRadius: `${theme.radii[1]}px`,
          fontSize: `${theme.fontSizes[0]}px`,
          fontWeight: theme.fontWeights.medium,
          backgroundColor: `${badge.color}20`,
          color: badge.color,
        }}
      >
        {badge.text}
      </span>
      <span
        style={{
          fontSize: `${theme.fontSizes[1]}px`,
          fontWeight: theme.fontWeights.medium,
          color: theme.colors.text,
        }}
      >
        {title}
      </span>
    </div>
    <div
      style={{
        fontSize: `${theme.fontSizes[1]}px`,
        color: theme.colors.textSecondary,
        lineHeight: theme.lineHeights.relaxed,
      }}
    >
      {description}
    </div>
  </div>
);
