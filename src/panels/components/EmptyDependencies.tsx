import React from 'react';
import { Package, FileCode, Check, X } from 'lucide-react';
import { useTheme } from '@principal-ade/industry-theme';

const SUPPORTED_MANIFESTS = [
  { file: 'package.json', ecosystem: 'Node.js' },
  { file: 'pyproject.toml', ecosystem: 'Python' },
  { file: 'setup.py', ecosystem: 'Python' },
  { file: 'requirements.txt', ecosystem: 'Python' },
  { file: 'Cargo.toml', ecosystem: 'Rust' },
];

export interface EmptyDependenciesProps {
  /** List of manifest files found in the project */
  foundManifests?: string[];
}

export const EmptyDependencies: React.FC<EmptyDependenciesProps> = ({
  foundManifests = [],
}) => {
  const { theme } = useTheme();

  // Check which supported manifests were found
  const supportedFound = SUPPORTED_MANIFESTS.filter((m) =>
    foundManifests.some((f) => f.endsWith(m.file))
  );

  // Check for unsupported manifests (found but not in our supported list)
  const unsupportedFound = foundManifests.filter(
    (f) => !SUPPORTED_MANIFESTS.some((m) => f.endsWith(m.file))
  );

  const hasFoundFiles = foundManifests.length > 0;

  return (
    <div
      style={{
        padding: '32px 24px',
        color: theme.colors.textSecondary,
        fontSize: theme.fontSizes[1],
        fontFamily: theme.fonts.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        height: '100%',
        minHeight: '200px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
        }}
      >
        <Package size={20} />
        No packages detected
      </div>

      {/* Info blocks container */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {/* Found in project block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            minWidth: '180px',
          }}
        >
          <div
            style={{
              fontSize: theme.fontSizes[0],
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Found in project
          </div>
          {hasFoundFiles ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              {supportedFound.map((m) => (
                <div
                  key={m.file}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: theme.fontSizes[1],
                  }}
                >
                  <FileCode size={12} style={{ color: theme.colors.success }} />
                  <span style={{ color: theme.colors.text }}>{m.file}</span>
                  <span style={{ opacity: 0.5 }}>({m.ecosystem})</span>
                </div>
              ))}
              {unsupportedFound.map((file) => (
                <div
                  key={file}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: theme.fontSizes[1],
                  }}
                >
                  <X size={12} style={{ color: theme.colors.warning }} />
                  <span style={{ color: theme.colors.text }}>
                    {file.split('/').pop()}
                  </span>
                  <span style={{ opacity: 0.5 }}>(not supported)</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: theme.fontSizes[1],
                fontStyle: 'italic',
                opacity: 0.6,
              }}
            >
              No manifest files found
            </div>
          )}
        </div>

        {/* Supported block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            minWidth: '180px',
          }}
        >
          <div
            style={{
              fontSize: theme.fontSizes[0],
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Supported
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SUPPORTED_MANIFESTS.map((m) => (
              <div
                key={m.file}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: theme.fontSizes[1],
                }}
              >
                <Check size={12} style={{ opacity: 0.4 }} />
                <span>{m.file}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
