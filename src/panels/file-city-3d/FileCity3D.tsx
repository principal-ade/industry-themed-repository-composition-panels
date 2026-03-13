/**
 * FileCity3D - 3D visualization of a codebase using React Three Fiber
 *
 * Renders CityData from file-city-builder as actual 3D buildings with
 * camera controls, lighting, and interactivity.
 *
 * Supports animated transition from 2D (flat) to 3D (grown buildings).
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { animated, useSpring, config } from '@react-spring/three';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Text,
  RoundedBox,
} from '@react-three/drei';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';

// Extend JSX with Three.js elements
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Types matching file-city-builder CityData structure
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Bounds2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CityBuilding {
  path: string;
  position: Position3D;
  dimensions: [number, number, number]; // [width, height, depth]
  color?: string;
  type: 'file';
  fileExtension?: string;
  size?: number; // File size in bytes
  lineCount?: number; // Number of lines (for code files)
}

// Code file extensions - height based on line count
const CODE_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'pyw',
  'rs',
  'go',
  'java',
  'kt',
  'scala',
  'c',
  'cpp',
  'cc',
  'cxx',
  'h',
  'hpp',
  'cs',
  'rb',
  'php',
  'swift',
  'vue',
  'svelte',
  'lua',
  'sh',
  'bash',
  'zsh',
  'sql',
  'r',
  'dart',
  'elm',
  'ex',
  'exs',
  'clj',
  'cljs',
  'hs',
  'ml',
  'mli',
]);

function isCodeFile(extension: string): boolean {
  return CODE_EXTENSIONS.has(extension.toLowerCase());
}

/**
 * Calculate building height based on file metrics using logarithmic scaling.
 * - Code files: height based on line count (more lines = taller)
 * - Non-code files: height based on file size (more bytes = taller)
 *
 * Logarithmic scaling naturally compresses large values, so no artificial cap needed.
 */
function calculateBuildingHeight(building: CityBuilding): number {
  const ext = building.fileExtension || building.path.split('.').pop() || '';
  const minHeight = 2;
  const heightScale = 12; // Multiplier for the log value

  if (isCodeFile(ext) && building.lineCount !== undefined) {
    // Code files: logarithmic scale based on line count
    // log10(10) = 1, log10(100) = 2, log10(1000) = 3, log10(10000) = 4
    const lines = Math.max(building.lineCount, 1);
    return minHeight + Math.log10(lines) * heightScale;
  } else if (building.size !== undefined) {
    // Non-code files: logarithmic scale based on size
    // log10(1KB) = 3, log10(10KB) = 4, log10(100KB) = 5, log10(1MB) = 6
    const bytes = Math.max(building.size, 1);
    return minHeight + (Math.log10(bytes) - 2) * heightScale; // -2 to start scaling from ~100 bytes
  }

  // Fallback to dimension height if no metrics available
  return building.dimensions[1];
}

export interface CityDistrict {
  path: string;
  worldBounds: Bounds2D;
  fileCount: number;
  type: 'directory';
  label?: {
    text: string;
    bounds: Bounds2D;
    position: 'top' | 'bottom';
  };
}

export interface CityData {
  buildings: CityBuilding[];
  districts: CityDistrict[];
  bounds: Bounds2D;
  metadata: {
    totalFiles: number;
    totalDirectories: number;
    rootPath: string;
  };
}

// Highlight layer types (simplified from file-city-builder)
export interface HighlightLayer {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Whether layer is active */
  enabled: boolean;
  /** Highlight color (hex) */
  color: string;
  /** Items to highlight */
  items: HighlightItem[];
  /** Opacity for highlighted items (0-1) */
  opacity?: number;
}

export interface HighlightItem {
  /** File or directory path */
  path: string;
  /** Type of item */
  type: 'file' | 'directory';
}

/** What to do with non-highlighted buildings */
export type IsolationMode =
  | 'none' // Show all buildings normally
  | 'transparent' // Make non-highlighted buildings transparent
  | 'collapse' // Flatten non-highlighted buildings to ground level
  | 'hide'; // Hide non-highlighted buildings entirely

// Animation configuration
export interface AnimationConfig {
  /** Start with buildings flat (2D view) */
  startFlat?: boolean;
  /** Auto-start the grow animation after this delay (ms). Set to null to disable. */
  autoStartDelay?: number | null;
  /** Duration of the grow animation in ms */
  growDuration?: number;
  /** Stagger delay between buildings in ms */
  staggerDelay?: number;
  /** Spring tension (higher = faster/snappier) */
  tension?: number;
  /** Spring friction (higher = less bouncy) */
  friction?: number;
}

const DEFAULT_ANIMATION: AnimationConfig = {
  startFlat: false,
  autoStartDelay: 500,
  growDuration: 1500,
  staggerDelay: 15,
  tension: 120,
  friction: 14,
};

// Color palette for file extensions
const EXTENSION_COLORS: Record<string, string> = {
  ts: '#3178c6',
  tsx: '#61dafb',
  js: '#f7df1e',
  jsx: '#61dafb',
  json: '#cbcb41',
  md: '#083fa1',
  css: '#264de4',
  scss: '#cc6699',
  html: '#e34c26',
  py: '#3572A5',
  rs: '#dea584',
  go: '#00ADD8',
  java: '#b07219',
  default: '#6b7280',
};

function getColorForFile(building: CityBuilding): string {
  if (building.color) return building.color;
  const ext = building.fileExtension || building.path.split('.').pop() || '';
  return EXTENSION_COLORS[ext.toLowerCase()] || EXTENSION_COLORS.default;
}

/**
 * Check if a path is highlighted by any enabled layer.
 * Returns the highlight color if found, null otherwise.
 */
function getHighlightForPath(
  path: string,
  layers: HighlightLayer[]
): { color: string; opacity: number } | null {
  for (const layer of layers) {
    if (!layer.enabled) continue;

    for (const item of layer.items) {
      if (item.type === 'file' && item.path === path) {
        return { color: layer.color, opacity: layer.opacity ?? 1 };
      }
      if (
        item.type === 'directory' &&
        (path === item.path || path.startsWith(item.path + '/'))
      ) {
        return { color: layer.color, opacity: layer.opacity ?? 1 };
      }
    }
  }
  return null;
}

/**
 * Check if any highlights are active (any enabled layer with items)
 */
function hasActiveHighlights(layers: HighlightLayer[]): boolean {
  return layers.some((layer) => layer.enabled && layer.items.length > 0);
}

// Animated RoundedBox wrapper
const AnimatedRoundedBox = animated(RoundedBox);

// Individual building component with spring animation
interface BuildingProps {
  building: CityBuilding;
  centerOffset: { x: number; z: number };
  onHover?: (building: CityBuilding | null) => void;
  onClick?: (building: CityBuilding) => void;
  isHovered?: boolean;
  growProgress: number; // 0 = flat, 1 = full height
  staggerIndex: number;
  animationConfig: AnimationConfig;
  // Highlight/isolation props
  highlight: { color: string; opacity: number } | null;
  isolationMode: IsolationMode;
  hasActiveHighlights: boolean;
  dimOpacity: number;
}

function Building({
  building,
  centerOffset,
  onHover,
  onClick,
  isHovered,
  growProgress,
  staggerIndex,
  animationConfig,
  highlight,
  isolationMode,
  hasActiveHighlights,
  dimOpacity,
}: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [width, , depth] = building.dimensions;
  const baseColor = getColorForFile(building);

  // Determine if this building should be dimmed/collapsed/hidden
  const isHighlighted = highlight !== null;
  const shouldDim = hasActiveHighlights && !isHighlighted;
  const shouldCollapse = shouldDim && isolationMode === 'collapse';
  const shouldHide = shouldDim && isolationMode === 'hide';

  // Calculate height based on line count (code) or size (non-code)
  const fullHeight = calculateBuildingHeight(building);
  const targetHeight = shouldCollapse ? 0.5 : fullHeight; // Collapsed = very short

  // Use highlight color if highlighted, otherwise base color
  const color = isHighlighted ? highlight.color : baseColor;

  // Calculate staggered delay
  const staggerMs = (animationConfig.staggerDelay || 15) * staggerIndex;

  // Spring animation for height
  const { height, yPosition } = useSpring({
    height: growProgress * targetHeight + 0.1,
    yPosition: (growProgress * targetHeight + 0.1) / 2,
    config: {
      tension: animationConfig.tension || 120,
      friction: animationConfig.friction || 14,
    },
    delay: staggerMs,
  });

  // Spring for opacity (transparency mode)
  const { opacity } = useSpring({
    opacity: shouldDim && isolationMode === 'transparent' ? dimOpacity : 1,
    config: { tension: 200, friction: 20 },
  });

  // Hover scale animation
  const { scale } = useSpring({
    scale: isHovered ? 1.05 : 1,
    config: config.wobbly,
  });

  // Skip rendering if hidden (after all hooks)
  if (shouldHide) return null;

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover?.(building);
  };

  const handlePointerOut = () => {
    onHover?.(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(building);
  };

  const x = building.position.x - centerOffset.x;
  const z = building.position.z - centerOffset.z;

  return (
    <animated.group
      position-x={x}
      position-y={yPosition}
      position-z={z}
      scale={scale}
    >
      <AnimatedRoundedBox
        ref={meshRef}
        args={[width, 1, depth]}
        scale-y={height}
        radius={0.1}
        smoothness={4}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <animated.meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.6}
          emissive={isHovered ? color : '#000000'}
          emissiveIntensity={isHovered ? 0.3 : isHighlighted ? 0.1 : 0}
          transparent={shouldDim}
          opacity={opacity}
        />
      </AnimatedRoundedBox>
    </animated.group>
  );
}

// District floor component with fade-in
interface DistrictFloorProps {
  district: CityDistrict;
  centerOffset: { x: number; z: number };
  opacity: number;
}

function DistrictFloor({
  district,
  centerOffset,
  opacity,
}: DistrictFloorProps) {
  const { worldBounds } = district;
  const width = worldBounds.maxX - worldBounds.minX;
  const depth = worldBounds.maxZ - worldBounds.minZ;
  const centerX = (worldBounds.minX + worldBounds.maxX) / 2 - centerOffset.x;
  const centerZ = (worldBounds.minZ + worldBounds.maxZ) / 2 - centerOffset.z;

  const dirName = district.path.split('/').pop() || district.path;

  const { floorOpacity } = useSpring({
    floorOpacity: opacity * 0.3,
    config: { duration: 500 },
  });

  return (
    <group position={[centerX, 0, centerZ]}>
      {/* Floor plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[width, depth]} />
        <animated.meshStandardMaterial
          color="#1e293b"
          transparent
          opacity={floorOpacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <edgesGeometry
          args={[new THREE.PlaneGeometry(width, depth)]}
          attach="geometry"
        />
        <lineBasicMaterial color="#475569" />
      </lineSegments>

      {/* Label - positioned above ground, angled toward camera */}
      {district.label && (
        <Text
          position={[0, 1.5, depth / 2 + 2]}
          rotation={[-Math.PI / 6, 0, 0]}
          fontSize={Math.min(3, width / 6)}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#0f172a"
        >
          {dirName}
        </Text>
      )}
    </group>
  );
}

// Ground plane with grid
function Ground({ size }: { size: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[size * 1.5, size * 1.5]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <gridHelper
        args={[size * 1.2, Math.ceil(size / 10), '#334155', '#1e293b']}
        position={[0, 0, 0]}
      />
    </group>
  );
}

// Animated camera controller - simple tilt from top-down to angled view
interface AnimatedCameraProps {
  citySize: number;
  isFlat: boolean;
  animationConfig: AnimationConfig;
}

function AnimatedCamera({
  citySize,
  isFlat,
}: Omit<AnimatedCameraProps, 'animationConfig'>) {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Simple tilt: camera stays on the Z axis, just changes height and z position
  // Flat: looking straight down from above
  // Iso: tilted view from front

  const { height, zPos } = useSpring({
    height: isFlat ? citySize * 1.5 : citySize * 0.8,
    zPos: isFlat ? 0 : citySize * 1.0,
    config: {
      tension: 25,
      friction: 28,
      mass: 1.5,
    },
    delay: isFlat ? 0 : 400,
  });

  useFrame(() => {
    camera.position.set(0, height.get(), zPos.get());
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={50} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={citySize * 3}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// Info panel overlay
interface InfoPanelProps {
  building: CityBuilding | null;
}

function InfoPanel({ building }: InfoPanelProps) {
  if (!building) return null;

  const fileName = building.path.split('/').pop();
  const dirPath = building.path.split('/').slice(0, -1).join('/');
  const ext = building.fileExtension || building.path.split('.').pop() || '';
  const isCode = isCodeFile(ext);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '12px 16px',
        color: '#e2e8f0',
        fontSize: 14,
        fontFamily: 'monospace',
        maxWidth: 400,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{fileName}</div>
      <div style={{ color: '#94a3b8', fontSize: 12 }}>{dirPath}</div>
      <div
        style={{
          color: '#64748b',
          fontSize: 11,
          marginTop: 4,
          display: 'flex',
          gap: 12,
        }}
      >
        {isCode && building.lineCount !== undefined && (
          <span>{building.lineCount.toLocaleString()} lines</span>
        )}
        {building.size !== undefined && (
          <span>{(building.size / 1024).toFixed(1)} KB</span>
        )}
      </div>
    </div>
  );
}

// Control buttons overlay
interface ControlsOverlayProps {
  isFlat: boolean;
  onToggle: () => void;
}

function ControlsOverlay({ isFlat, onToggle }: ControlsOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 8,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid #334155',
          borderRadius: 6,
          padding: '8px 16px',
          color: '#e2e8f0',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {isFlat ? '▲ Grow to 3D' : '▼ Flatten to 2D'}
      </button>
    </div>
  );
}

// Main scene component
interface CitySceneProps {
  cityData: CityData;
  onBuildingHover?: (building: CityBuilding | null) => void;
  onBuildingClick?: (building: CityBuilding) => void;
  hoveredBuilding: CityBuilding | null;
  growProgress: number;
  animationConfig: AnimationConfig;
  // Highlight/isolation props
  highlightLayers: HighlightLayer[];
  isolationMode: IsolationMode;
  dimOpacity: number;
}

function CityScene({
  cityData,
  onBuildingHover,
  onBuildingClick,
  hoveredBuilding,
  growProgress,
  animationConfig,
  highlightLayers,
  isolationMode,
  dimOpacity,
}: CitySceneProps) {
  // Calculate center offset to center the city at origin
  const centerOffset = useMemo(
    () => ({
      x: (cityData.bounds.minX + cityData.bounds.maxX) / 2,
      z: (cityData.bounds.minZ + cityData.bounds.maxZ) / 2,
    }),
    [cityData.bounds]
  );

  const citySize = Math.max(
    cityData.bounds.maxX - cityData.bounds.minX,
    cityData.bounds.maxZ - cityData.bounds.minZ
  );

  // Check if any highlights are active
  const activeHighlights = useMemo(
    () => hasActiveHighlights(highlightLayers),
    [highlightLayers]
  );

  // Calculate stagger indices based on distance from center
  const buildingsWithStagger = useMemo(() => {
    const centerX = (cityData.bounds.minX + cityData.bounds.maxX) / 2;
    const centerZ = (cityData.bounds.minZ + cityData.bounds.maxZ) / 2;

    const withDistance = cityData.buildings.map((b) => ({
      building: b,
      distance: Math.sqrt(
        Math.pow(b.position.x - centerX, 2) +
          Math.pow(b.position.z - centerZ, 2)
      ),
      highlight: getHighlightForPath(b.path, highlightLayers),
    }));

    // Sort by distance and assign stagger index
    withDistance.sort((a, b) => a.distance - b.distance);
    return withDistance.map((item, index) => ({
      ...item,
      staggerIndex: index,
    }));
  }, [cityData.buildings, cityData.bounds, highlightLayers]);

  return (
    <>
      {/* Animated Camera */}
      <AnimatedCamera citySize={citySize} isFlat={growProgress === 0} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[citySize, citySize, citySize * 0.5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-citySize * 0.5, citySize * 0.5, -citySize * 0.5]}
        intensity={0.3}
      />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Ground */}
      <Ground size={citySize} />

      {/* Districts (floor plates) */}
      {cityData.districts.map((district) => (
        <DistrictFloor
          key={district.path}
          district={district}
          centerOffset={centerOffset}
          opacity={1}
        />
      ))}

      {/* Buildings */}
      {buildingsWithStagger.map(({ building, staggerIndex, highlight }) => (
        <Building
          key={building.path}
          building={building}
          centerOffset={centerOffset}
          onHover={onBuildingHover}
          onClick={onBuildingClick}
          isHovered={hoveredBuilding?.path === building.path}
          growProgress={growProgress}
          staggerIndex={staggerIndex}
          animationConfig={animationConfig}
          highlight={highlight}
          isolationMode={isolationMode}
          hasActiveHighlights={activeHighlights}
          dimOpacity={dimOpacity}
        />
      ))}
    </>
  );
}

// Main exported component
export interface FileCity3DProps {
  cityData: CityData;
  width?: number | string;
  height?: number | string;
  onBuildingClick?: (building: CityBuilding) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** External control: set to true to grow buildings, false to flatten */
  isGrown?: boolean;
  /** Callback when grow state changes */
  onGrowChange?: (isGrown: boolean) => void;
  /** Show control buttons */
  showControls?: boolean;
  /** Highlight layers for focusing on specific files/directories */
  highlightLayers?: HighlightLayer[];
  /** How to handle non-highlighted buildings when highlights are active */
  isolationMode?: IsolationMode;
  /** Opacity for dimmed buildings in transparent mode (0-1) */
  dimOpacity?: number;
}

export function FileCity3D({
  cityData,
  width = '100%',
  height = 600,
  onBuildingClick,
  className,
  style,
  animation,
  isGrown: externalIsGrown,
  onGrowChange,
  showControls = true,
  highlightLayers = [],
  isolationMode = 'transparent',
  dimOpacity = 0.15,
}: FileCity3DProps) {
  const [hoveredBuilding, setHoveredBuilding] = useState<CityBuilding | null>(
    null
  );
  const [internalIsGrown, setInternalIsGrown] = useState(false);

  // Merge animation config with defaults
  const animationConfig = useMemo(
    () => ({ ...DEFAULT_ANIMATION, ...animation }),
    [animation]
  );

  // Use external control if provided, otherwise internal state
  const isGrown =
    externalIsGrown !== undefined ? externalIsGrown : internalIsGrown;
  const setIsGrown = (value: boolean) => {
    setInternalIsGrown(value);
    onGrowChange?.(value);
  };

  // Auto-start animation
  useEffect(() => {
    if (animationConfig.startFlat && animationConfig.autoStartDelay !== null) {
      const timer = setTimeout(() => {
        setIsGrown(true);
      }, animationConfig.autoStartDelay);
      return () => clearTimeout(timer);
    } else if (!animationConfig.startFlat) {
      setIsGrown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationConfig.startFlat, animationConfig.autoStartDelay]);

  const growProgress = isGrown ? 1 : 0;

  const handleToggle = () => {
    setIsGrown(!isGrown);
  };

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        background: '#0f172a',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Canvas shadows>
        <CityScene
          cityData={cityData}
          onBuildingHover={setHoveredBuilding}
          onBuildingClick={onBuildingClick}
          hoveredBuilding={hoveredBuilding}
          growProgress={growProgress}
          animationConfig={animationConfig}
          highlightLayers={highlightLayers}
          isolationMode={isolationMode}
          dimOpacity={dimOpacity}
        />
      </Canvas>
      <InfoPanel building={hoveredBuilding} />
      {showControls && (
        <ControlsOverlay isFlat={!isGrown} onToggle={handleToggle} />
      )}
    </div>
  );
}

export default FileCity3D;
