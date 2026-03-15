/**
 * CardBackCodeCity - Code City themed card back
 *
 * Displays a grid of colored squares reminiscent of the Code City map
 * visualization, with "CODE" and "CITY" text overlaid.
 */

import React from 'react';
import { useTheme } from '@principal-ade/industry-theme';
import { defaultFileColorConfig } from '@principal-ai/file-city-builder';
import {
  TypescriptPlain,
  JavascriptPlain,
  ReactOriginal,
  PythonPlain,
  JavaPlain,
  GoPlain,
  RustOriginal,
  RubyPlain,
  PhpPlain,
  SwiftPlain,
  ObjectivecPlain,
  COriginal,
  CplusplusPlain,
  CsharpPlain,
  KotlinPlain,
  Html5Plain,
  Css3Plain,
  VuejsPlain,
  SveltePlain,
  JsonPlain,
  YamlPlain,
  XmlPlain,
  MarkdownOriginal,
  BashPlain,
  PowershellPlain,
  AzuresqldatabasePlain,
  RPlain,
  ScalaPlain,
  ElixirPlain,
  LuaPlain,
  DartPlain,
  TerraformPlain,
  SolidityPlain,
  GraphqlPlain,
  DockerPlain,
} from 'devicons-react';

export interface CardBackCodeCityProps {
  /** Card width - if provided, height is derived from grid aspect ratio */
  width?: number;

  /** Card height - if provided, width is derived from grid aspect ratio */
  height?: number;
}

// Grid configuration constants
const COLS = 6;
const ROWS = 10;
const PADDING = 8;
const GAP = 3;

/** Map suffix to icon component (Plain = monochrome) */
const SUFFIX_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  '.ts': TypescriptPlain,
  '.js': JavascriptPlain,
  '.jsx': ReactOriginal,
  '.py': PythonPlain,
  '.java': JavaPlain,
  '.go': GoPlain,
  '.rs': RustOriginal,
  '.rb': RubyPlain,
  '.php': PhpPlain,
  '.swift': SwiftPlain,
  '.m': ObjectivecPlain,
  '.c': COriginal,
  '.cpp': CplusplusPlain,
  '.cs': CsharpPlain,
  '.kt': KotlinPlain,
  '.html': Html5Plain,
  '.css': Css3Plain,
  '.vue': VuejsPlain,
  '.svelte': SveltePlain,
  '.json': JsonPlain,
  '.yaml': YamlPlain,
  '.xml': XmlPlain,
  '.md': MarkdownOriginal,
  '.sh': BashPlain,
  '.ps1': PowershellPlain,
  '.sql': AzuresqldatabasePlain,
  '.r': RPlain,
  '.scala': ScalaPlain,
  '.ex': ElixirPlain,
  '.lua': LuaPlain,
  '.dart': DartPlain,
  '.tf': TerraformPlain,
  '.sol': SolidityPlain,
  '.graphql': GraphqlPlain,
  '.dockerfile': DockerPlain,
};

/** Most popular suffixes - these go in the center gap row */
const POPULAR_SUFFIXES = [
  '.ts', // TypeScript
  '.js', // JavaScript
  '.py', // Python
  '.go', // Go
  '.rs', // Rust
  '.jsx', // React
];

/** Center row icons (in order: TS, C++, C, Java, Ruby, Python) */
const CENTER_ROW_SUFFIXES = [
  '.ts', // TypeScript (left edge)
  '.cpp', // C++
  '.c', // C (middle)
  '.java', // Java (middle)
  '.rb', // Ruby
  '.py', // Python (right edge)
];

/** Top row: HTML (corner), Objective-C (middle-left), PHP (middle-right), CSS (corner) */
const TOP_ROW_SUFFIXES = ['.html', '.m', '.php', '.css'];

/** Bottom row: Go (corner), SQL (middle-left), Elixir (middle-right), Rust (corner) */
const BOTTOM_ROW_SUFFIXES = ['.go', '.sql', '.ex', '.rs'];

/** Ranked list of notable suffixes for border icon positions (most notable first) */
const RANKED_ICON_SUFFIXES = [
  '.ts', // TypeScript
  '.js', // JavaScript
  '.py', // Python
  '.go', // Go
  '.rs', // Rust
  '.jsx', // React
  '.swift', // Swift
  '.kt', // Kotlin
  '.vue', // Vue
  '.svelte', // Svelte
  '.sh', // Shell
  '.sql', // SQL
];

/** Grid block component */
const Block: React.FC<{
  color: string;
  size: number;
  letter?: string;
  letterColor?: string;
  fontFamily: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}> = ({ color, size, letter, letterColor, fontFamily, icon: Icon }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'saturate(1.3) brightness(1.05)',
    }}
  >
    {letter ? (
      <span
        style={{
          fontSize: size * 0.7,
          fontFamily,
          fontWeight: 900,
          color: letterColor || '#ffffff',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        {letter}
      </span>
    ) : Icon ? (
      <Icon size={size * 0.65} color="#ffffff" />
    ) : null}
  </div>
);

/**
 * CardBackCodeCity renders a Code City themed card back with a grid pattern.
 */
export const CardBackCodeCity: React.FC<CardBackCodeCityProps> = ({
  width: widthProp,
  height: heightProp,
}) => {
  const { theme } = useTheme();

  // Derive dimensions from whichever prop is provided (width takes precedence)
  // If neither provided, default to width of 200
  let width: number;
  let height: number;

  if (widthProp !== undefined) {
    width = widthProp;
    const availableWidth = width - PADDING * 2;
    const blockSize = (availableWidth - GAP * (COLS - 1)) / COLS;
    const gridHeight = ROWS * blockSize + (ROWS - 1) * GAP;
    height = gridHeight + PADDING * 2;
  } else if (heightProp !== undefined) {
    height = heightProp;
    const availableHeight = height - PADDING * 2;
    const blockSize = (availableHeight - GAP * (ROWS - 1)) / ROWS;
    const gridWidth = COLS * blockSize + (COLS - 1) * GAP;
    width = gridWidth + PADDING * 2;
  } else {
    // Default
    width = 200;
    const availableWidth = width - PADDING * 2;
    const blockSize = (availableWidth - GAP * (COLS - 1)) / COLS;
    const gridHeight = ROWS * blockSize + (ROWS - 1) * GAP;
    height = gridHeight + PADDING * 2;
  }

  // Calculate block size (same calculation, now for rendering)
  const availableWidth = width - PADDING * 2;
  const blockSize = (availableWidth - GAP * (COLS - 1)) / COLS;

  // Text configuration: "FILE" and "CITY" in center, icons above and below
  const text1 = 'FILE';
  const text2 = 'CITY';
  const textRow1 = 4; // FILE center
  const textRow2 = 5; // CITY center
  const textStartCol4 = Math.floor((COLS - 4) / 2); // for 4-letter words

  // Colors
  const darkColor = '#1a1a2e'; // Almost black
  const textColor1 = darkColor; // Dark background for text
  const textColor2 = darkColor; // Same color
  const textLetterColor = '#22c55e'; // Green text

  const suffixConfigs = defaultFileColorConfig.suffixConfigs as Record<
    string,
    { primary?: { color?: string } }
  >;

  // Center row icons data
  const centerRowData = CENTER_ROW_SUFFIXES.filter(
    (suffix) => SUFFIX_ICONS[suffix]
  ).map((suffix) => {
    const config = suffixConfigs[suffix];
    return { color: config?.primary?.color || '#888888', suffix };
  });

  // Top row icons data (corners + middle)
  const topRowData = TOP_ROW_SUFFIXES.filter(
    (suffix) => SUFFIX_ICONS[suffix]
  ).map((suffix) => {
    const config = suffixConfigs[suffix];
    const color = config?.primary?.color || '#888888';
    return { color, suffix };
  });

  // Bottom row icons data (corners + middle)
  const bottomRowData = BOTTOM_ROW_SUFFIXES.filter(
    (suffix) => SUFFIX_ICONS[suffix]
  ).map((suffix) => {
    // Custom color for Elixir
    if (suffix === '.ex') {
      return { color: '#023452', suffix };
    }
    const config = suffixConfigs[suffix];
    const color = config?.primary?.color || '#888888';
    return { color, suffix };
  });

  // Ranked icons for border positions (most notable first)
  const rankedIconData = RANKED_ICON_SUFFIXES.filter(
    (suffix) => SUFFIX_ICONS[suffix]
  ).map((suffix) => {
    const config = suffixConfigs[suffix];
    return { color: config?.primary?.color || '#888888', suffix };
  });

  // Show icons on corners, top/bottom middle, and center row
  const shouldShowIcon = (row: number, col: number): boolean => {
    const isTopRow = row === 0;
    const isBottomRow = row === ROWS - 1;
    const isLeftCol = col === 0;
    const isRightCol = col === COLS - 1;
    const isCorner = (isTopRow || isBottomRow) && (isLeftCol || isRightCol);
    const isCenterRow =
      (row === 2 && col !== 1 && col !== 4) ||
      (row === 7 && col !== 1 && col !== 4) ||
      (row === 1 && (col === 1 || col === 4)) ||
      (row === 8 && (col === 1 || col === 4));

    // Corners always get icons
    if (isCorner) return true;

    // Top row: corners + two in middle (cols 0, 2, 3, 5)
    if (isTopRow && (col === 2 || col === 3)) return true;

    // Bottom row: corners + two in middle (cols 0, 2, 3, 5)
    if (isBottomRow && (col === 2 || col === 3)) return true;

    // Center row: all icons
    if (isCenterRow) return true;

    return false;
  };

  // Generate block data
  const blocks = React.useMemo(() => {
    const result: Array<{
      color: string;
      letter?: string;
      letterColor?: string;
      suffix?: string;
    }> = [];

    let iconIndex = 0;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        let color: string;
        let letter: string | undefined;
        let letterColor: string | undefined;
        let suffix: string | undefined;

        // Check if this is a text block
        if (
          row === textRow1 &&
          col >= textStartCol4 &&
          col < textStartCol4 + 4
        ) {
          color = textColor1;
          letter = text1[col - textStartCol4];
          letterColor = textLetterColor;
        } else if (
          row === textRow2 &&
          col >= textStartCol4 &&
          col < textStartCol4 + 4
        ) {
          color = textColor2;
          letter = text2[col - textStartCol4];
          letterColor = textLetterColor;
        } else if (
          (row === 2 && col !== 1 && col !== 4) ||
          (row === 7 && col !== 1 && col !== 4) ||
          (row === 1 && (col === 1 || col === 4)) ||
          (row === 8 && (col === 1 || col === 4))
        ) {
          // Center rows - use specific icons, reversed order on rows 7 and 8
          const iconIndex =
            row === 7 || row === 8
              ? (COLS - 1 - col) % centerRowData.length
              : col % centerRowData.length;
          const iconData = centerRowData[iconIndex];
          color = iconData.color;
          suffix = iconData.suffix;
        } else if (
          row === 0 &&
          (col === 0 || col === 2 || col === 3 || col === COLS - 1)
        ) {
          // Top row - HTML (corner), Objective-C (mid-left), PHP (mid-right), CSS (corner)
          const posMap: Record<number, number> = { 0: 0, 2: 1, 3: 2, 5: 3 };
          const iconData = topRowData[posMap[col]];
          if (iconData) {
            color = iconData.color;
            suffix = iconData.suffix;
          } else {
            color = darkColor;
          }
        } else if (
          row === ROWS - 1 &&
          (col === 0 || col === 2 || col === 3 || col === COLS - 1)
        ) {
          // Bottom row - Go (corner), Rust (mid-left), Elixir (mid-right), SQL (corner)
          const posMap: Record<number, number> = { 0: 0, 2: 1, 3: 2, 5: 3 };
          const iconData = bottomRowData[posMap[col]];
          if (iconData) {
            color = iconData.color;
            suffix = iconData.suffix;
          } else {
            color = darkColor;
          }
        } else if (shouldShowIcon(row, col)) {
          // Border position - use ranked icons
          const iconData = rankedIconData[iconIndex % rankedIconData.length];
          color = iconData.color;
          suffix = iconData.suffix;
          iconIndex++;
        } else {
          // Non-icon position - almost black
          color = darkColor;
        }

        result.push({ color, letter, letterColor, suffix });
      }
    }
    return result;
  }, [
    textStartCol4,
    textColor1,
    textColor2,
    darkColor,
    centerRowData,
    topRowData,
    bottomRowData,
    rankedIconData,
  ]);

  const gridWidth = COLS * blockSize + (COLS - 1) * GAP;
  const gridHeight = ROWS * blockSize + (ROWS - 1) * GAP;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d1117',
        padding: PADDING,
        border: '1px solid #c0c0c0',
        borderRadius: 0,
        width,
        height,
        boxSizing: 'border-box',
        overflow: 'hidden',
        // boxShadow: 'inset 0 0 0 4px #0d1117, inset 0 0 0 6px #3178c6',
      }}
    >
      {/* Grid of blocks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${blockSize}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${blockSize}px)`,
          gap: GAP,
          width: gridWidth,
          height: gridHeight,
        }}
      >
        {blocks.map((block, index) => (
          <Block
            key={index}
            color={block.color}
            size={blockSize}
            letter={block.letter}
            letterColor={block.letterColor}
            fontFamily={theme.fonts.body}
            icon={block.suffix ? SUFFIX_ICONS[block.suffix] : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default CardBackCodeCity;
