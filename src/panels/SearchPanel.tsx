import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { FileText, Copy, Check } from 'lucide-react';
import type { FileTree } from '@principal-ai/repository-abstraction';
import type { PanelComponentProps } from '../types';
import {
  localSearchService,
  type SearchResult,
} from '../services/LocalSearchService';

export interface SearchPanelProps {
  /** File tree data for searching */
  fileTree: FileTree | null;
  /** Base directory / root path for the repository */
  baseDirectory?: string;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Callback when a file is selected */
  onFileSelect?: (filePath: string) => void;
  /** Callback when search results change */
  onSearchResultsChange?: (results: SearchResult[]) => void;
  /** Callback when a search result is hovered */
  onSearchResultHover?: (filePath: string | null) => void;
  /** Currently selected file path */
  selectedFile?: string | null;
}

/**
 * SearchPanelContent - Filename search panel for repository files
 */
export const SearchPanelContent: React.FC<SearchPanelProps> = ({
  fileTree,
  baseDirectory = '',
  isLoading = false,
  onFileSelect,
  onSearchResultsChange,
  onSearchResultHover,
  selectedFile,
}) => {
  const { theme } = useTheme();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // UI state
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [isSearchResultsFocused, setIsSearchResultsFocused] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Index file tree when it changes
  useEffect(() => {
    if (fileTree && baseDirectory) {
      localSearchService.indexFileSystemTree(fileTree, baseDirectory);
    }
  }, [fileTree, baseDirectory]);

  // Perform search
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        onSearchResultsChange?.([]);
        return;
      }

      const results = localSearchService.search(query, {
        limit: 100,
      });

      setSearchResults(results);
      onSearchResultsChange?.(results);
    },
    [onSearchResultsChange]
  );

  // Handle search input changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedSearchIndex(-1);
    setIsSearchResultsFocused(false);
  }, [searchResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (isSearchResultsFocused && selectedSearchIndex >= 0 && searchResultsRef.current) {
      const selectedElement = searchResultsRef.current.querySelector(
        `.search-result-item:nth-child(${selectedSearchIndex + 1})`
      );
      selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSearchIndex, isSearchResultsFocused]);

  // Handle search keyboard navigation
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Tab':
          if (
            e.target === searchInputRef.current &&
            !e.shiftKey &&
            searchResults.length > 0
          ) {
            e.preventDefault();
            setIsSearchResultsFocused(true);
            setSelectedSearchIndex(0);
            searchResultsRef.current?.focus();
          }
          break;
        case 'ArrowDown':
          if (isSearchResultsFocused && searchResults.length > 0) {
            e.preventDefault();
            setSelectedSearchIndex(prev =>
              prev < searchResults.length - 1 ? prev + 1 : prev
            );
          }
          break;
        case 'ArrowUp':
          if (isSearchResultsFocused && searchResults.length > 0) {
            e.preventDefault();
            setSelectedSearchIndex(prev => (prev > 0 ? prev - 1 : 0));
          }
          break;
        case 'Enter':
          if (isSearchResultsFocused && selectedSearchIndex >= 0) {
            e.preventDefault();
            const result = searchResults[selectedSearchIndex];
            onFileSelect?.(result.relativePath);
          }
          break;
        case 'Escape':
          if (isSearchResultsFocused) {
            e.preventDefault();
            setIsSearchResultsFocused(false);
            setSelectedSearchIndex(-1);
            searchInputRef.current?.focus();
          }
          break;
      }
    },
    [searchResults, isSearchResultsFocused, selectedSearchIndex, onFileSelect]
  );

  // Handle copy path
  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path).then(() => {
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, []);

  // Highlight matched text
  const highlightMatch = (text: string, match: string): React.ReactNode => {
    if (!match) return text;

    const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedMatch})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          style={{
            backgroundColor: `${theme.colors.primary}40`,
            fontWeight: theme.fontWeights.bold,
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search Input */}
      <div style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
        {/* Main Search Input */}
        <div
          style={{
            padding: '12px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search files..."
              style={{
                width: '100%',
                padding: '8px 12px',
                paddingRight: '36px',
                fontSize: theme.fontSizes[1],
                fontFamily: theme.fonts.body,
                borderRadius: '4px',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.backgroundSecondary || theme.colors.background,
                color: theme.colors.text,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.textSecondary}
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        ref={searchResultsRef}
        tabIndex={-1}
        onKeyDown={handleSearchKeyDown}
        onBlur={() => {
          setTimeout(() => {
            if (document.activeElement !== searchInputRef.current) {
              setIsSearchResultsFocused(false);
              setSelectedSearchIndex(-1);
            }
          }, 100);
        }}
        style={{ flex: 1, overflowY: 'auto', outline: 'none' }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme.colors.textSecondary,
              fontFamily: theme.fonts.body,
            }}
          >
            Loading file tree...
          </div>
        ) : !searchQuery && searchResults.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '320px' }}>
              <div style={{ marginBottom: '24px', position: 'relative', display: 'inline-block' }}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: theme.colors.primary, opacity: 0.8 }}
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <path
                    d="m21 21-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3
                style={{
                  fontSize: theme.fontSizes[3],
                  fontWeight: theme.fontWeights.semibold,
                  fontFamily: theme.fonts.heading,
                  marginBottom: '8px',
                  color: theme.colors.text,
                }}
              >
                Search files
              </h3>

              <p
                style={{
                  fontSize: theme.fontSizes[1],
                  fontFamily: theme.fonts.body,
                  marginBottom: '16px',
                  color: theme.colors.textSecondary,
                }}
              >
                Search through filenames to find what you need
              </p>

              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: theme.fontSizes[0], fontWeight: theme.fontWeights.medium, fontFamily: theme.fonts.body, color: theme.colors.text }}>
                      Quick search
                    </div>
                    <div style={{ fontSize: theme.fontSizes[0], fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}>
                      Type to instantly filter by filename
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : searchQuery && searchResults.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '320px' }}>
              <div style={{ marginBottom: '16px' }}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: theme.colors.textSecondary, opacity: 0.5 }}
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h3
                style={{
                  fontSize: theme.fontSizes[2],
                  fontWeight: theme.fontWeights.medium,
                  fontFamily: theme.fonts.heading,
                  marginBottom: '8px',
                  color: theme.colors.text,
                }}
              >
                No results found
              </h3>

              <p
                style={{
                  fontSize: theme.fontSizes[1],
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textSecondary,
                }}
              >
                No files match{' '}
                <span style={{ fontFamily: theme.fonts.monospace, color: theme.colors.primary }}>
                  "{searchQuery}"
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div>
            {searchResults.map((result, index) => {
              const isCurrentFile = selectedFile === result.path || selectedFile === result.relativePath;
              const isSelected = isSearchResultsFocused && index === selectedSearchIndex;

              return (
                <div
                  key={`${result.path}-${index}`}
                  className="search-result-item"
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? `${theme.colors.primary}25`
                      : isCurrentFile
                        ? `${theme.colors.primary}15`
                        : 'transparent',
                    borderLeft: isCurrentFile
                      ? `3px solid ${theme.colors.primary}`
                      : isSelected
                        ? `3px solid ${theme.colors.primary}80`
                        : '3px solid transparent',
                    borderBottom: `1px solid ${theme.colors.border}20`,
                    transition: 'background-color 0.15s',
                  }}
                  onClick={() => onFileSelect?.(result.relativePath)}
                  onMouseEnter={() => {
                    if (isSearchResultsFocused) {
                      setSelectedSearchIndex(index);
                    }
                    onSearchResultHover?.(result.relativePath);
                  }}
                  onMouseLeave={() => onSearchResultHover?.(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <FileText size={14} color={theme.colors.textSecondary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                fontSize: theme.fontSizes[1],
                                fontWeight: theme.fontWeights.medium,
                                fontFamily: theme.fonts.body,
                                color: theme.colors.text,
                              }}
                            >
                              {highlightMatch(result.name, searchQuery)}
                            </div>
                            {isCurrentFile && (
                              <span
                                style={{
                                  fontSize: theme.fontSizes[0],
                                  fontFamily: theme.fonts.body,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: `${theme.colors.primary}20`,
                                  color: theme.colors.primary,
                                }}
                              >
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: theme.fontSizes[0],
                              fontFamily: theme.fonts.body,
                              marginTop: '2px',
                              color: theme.colors.textSecondary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {result.relativePath}
                          </div>
                        </div>
                        <button
                          style={{
                            flexShrink: 0,
                            padding: '4px',
                            borderRadius: '4px',
                            border: `1px solid ${
                              copiedPath === result.path ? theme.colors.success : theme.colors.border
                            }`,
                            backgroundColor:
                              copiedPath === result.path
                                ? `${theme.colors.success}20`
                                : theme.colors.backgroundSecondary || theme.colors.background,
                            color:
                              copiedPath === result.path
                                ? theme.colors.success
                                : theme.colors.textSecondary,
                            cursor: 'pointer',
                            opacity: isSelected || isCurrentFile ? 0.7 : 0,
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.opacity = '1';
                          }}
                          onMouseLeave={e => {
                            if (!isSelected && !isCurrentFile && copiedPath !== result.path) {
                              (e.currentTarget as HTMLElement).style.opacity = '0';
                            }
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            handleCopyPath(result.path);
                          }}
                          title={copiedPath === result.path ? 'Copied!' : 'Copy full path'}
                        >
                          {copiedPath === result.path ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {searchQuery && searchResults.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            borderTop: `1px solid ${theme.colors.border}`,
            fontSize: theme.fontSizes[0],
            fontFamily: theme.fonts.body,
            color: theme.colors.textSecondary,
            backgroundColor: theme.colors.backgroundSecondary || theme.colors.background,
          }}
        >
          <span>
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "
            {searchQuery}"
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * SearchPanelPreview - Preview component for panel switcher
 */
export const SearchPanelPreview: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px',
        fontSize: theme.fontSizes[0],
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          padding: '6px 8px',
          borderRadius: '4px',
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.textSecondary,
          fontSize: theme.fontSizes[0],
          fontFamily: theme.fonts.body,
        }}
      >
        Search files...
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
        <FileText size={12} />
        <span>index.tsx</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
        <FileText size={12} />
        <span>utils.ts</span>
      </div>
    </div>
  );
};

/**
 * SearchPanel - Panel Framework compatible component
 * Uses context.getSlice('fileTree') to get data
 */
export const SearchPanel: React.FC<PanelComponentProps> = ({ context }) => {
  const fileTreeSlice = context.getSlice<FileTree>('fileTree');

  const fileTree = fileTreeSlice?.data ?? null;
  const isLoading = fileTreeSlice?.loading || false;

  const rootPath =
    context.currentScope.type === 'repository'
      ? context.currentScope.repository?.path
      : undefined;

  return (
    <SearchPanelContent
      fileTree={fileTree}
      baseDirectory={rootPath}
      isLoading={isLoading}
    />
  );
};
