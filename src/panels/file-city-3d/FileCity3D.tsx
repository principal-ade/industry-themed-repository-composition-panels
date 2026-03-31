/**
 * FileCity3DPanel - 3D visualization of a codebase using React Three Fiber
 *
 * Renders CityData from file-city-builder as actual 3D buildings with
 * camera controls, lighting, and interactivity.
 *
 * Supports animated transition from 2D (flat) to 3D (grown buildings).
 *
 * Panel Pattern:
 * - FileCity3DPanelContent: Core component with direct props (for Storybook/direct usage)
 * - FileCity3DPanelPreview: Small preview component for panel switcher
 * - FileCity3DPanel: Framework wrapper that extracts data from panel context
 */

import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { useTheme } from '@principal-ade/industry-theme';
import type { FileCity3DPanelPropsTyped } from '../../types';
import { buildCityDataFromFileTree, estimateLineCounts } from './buildCityData';
import { animated, useSpring, config } from '@react-spring/three';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Text,
  RoundedBox,
} from '@react-three/drei';
import { getFileConfig } from '@principal-ai/file-city-builder';
import type { FileConfigResult } from '@principal-ai/file-city-builder';
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

/** Height scaling mode for buildings */
export type HeightScaling = 'logarithmic' | 'linear';

/**
 * Calculate building height based on file metrics.
 * - logarithmic: Compresses large values (default, good for mixed codebases)
 * - linear: Direct scaling (1 line = linearScale units of height)
 */
function calculateBuildingHeight(
  building: CityBuilding,
  scaling: HeightScaling = 'logarithmic',
  linearScale: number = 0.05
): number {
  const minHeight = 2;

  // Use lineCount if available (any text file), otherwise fall back to size
  if (building.lineCount !== undefined) {
    const lines = Math.max(building.lineCount, 1);

    if (scaling === 'linear') {
      // Linear: height directly proportional to line count
      return minHeight + lines * linearScale;
    }
    // Logarithmic: log10(10) = 1, log10(100) = 2, log10(1000) = 3
    return minHeight + Math.log10(lines) * 12;
  } else if (building.size !== undefined) {
    const bytes = Math.max(building.size, 1);

    if (scaling === 'linear') {
      // Linear: height based on KB
      return minHeight + (bytes / 1024) * linearScale;
    }
    // Logarithmic scale based on size
    return minHeight + (Math.log10(bytes) - 2) * 12;
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

// Get full file config from centralized file-city-builder lookup
function getConfigForFile(building: CityBuilding): FileConfigResult {
  if (building.color) {
    // If building has pre-assigned color, wrap it in a config result
    return {
      color: building.color,
      renderStrategy: 'fill',
      opacity: 1,
      matchedPattern: 'preset',
      matchType: 'filename',
    };
  }
  return getFileConfig(building.path);
}

// Convenience function for just color
function getColorForFile(building: CityBuilding): string {
  return getConfigForFile(building).color;
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

// Animated RoundedBox wrapper (kept for small scenes)
const AnimatedRoundedBox = animated(RoundedBox);

// ============================================================================
// Instanced Buildings - High performance rendering for large scenes
// ============================================================================

interface InstancedBuildingsProps {
  buildings: CityBuilding[];
  centerOffset: { x: number; z: number };
  onHover?: (building: CityBuilding | null) => void;
  onClick?: (building: CityBuilding) => void;
  hoveredIndex: number | null;
  growProgress: number;
  animationConfig: AnimationConfig;
  highlightLayers: HighlightLayer[];
  isolationMode: IsolationMode;
  hasActiveHighlights: boolean;
  dimOpacity: number;
  heightScaling: HeightScaling;
  linearScale: number;
  staggerIndices: number[];
}

function InstancedBuildings({
  buildings,
  centerOffset,
  onHover,
  onClick,
  hoveredIndex,
  growProgress,
  animationConfig,
  highlightLayers,
  isolationMode,
  hasActiveHighlights,
  dimOpacity,
  heightScaling,
  linearScale,
  staggerIndices,
}: InstancedBuildingsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTimeRef = useRef<number | null>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Pre-compute building data
  const buildingData = useMemo(() => {
    return buildings.map((building, index) => {
      const [width, , depth] = building.dimensions;
      const highlight = getHighlightForPath(building.path, highlightLayers);
      const isHighlighted = highlight !== null;
      const shouldDim = hasActiveHighlights && !isHighlighted;
      const shouldCollapse = shouldDim && isolationMode === 'collapse';
      const shouldHide = shouldDim && isolationMode === 'hide';

      const fullHeight = calculateBuildingHeight(
        building,
        heightScaling,
        linearScale
      );
      const targetHeight = shouldCollapse ? 0.5 : fullHeight;

      const baseColor = getColorForFile(building);
      const color = isHighlighted ? highlight.color : baseColor;

      const x = building.position.x - centerOffset.x;
      const z = building.position.z - centerOffset.z;

      const staggerIndex = staggerIndices[index] ?? index;
      const staggerDelayMs =
        (animationConfig.staggerDelay || 15) * staggerIndex;

      return {
        building,
        index,
        width,
        depth,
        targetHeight,
        color,
        x,
        z,
        shouldHide,
        shouldDim,
        staggerDelayMs,
        isHighlighted,
      };
    });
  }, [
    buildings,
    centerOffset,
    highlightLayers,
    hasActiveHighlights,
    isolationMode,
    heightScaling,
    linearScale,
    staggerIndices,
    animationConfig.staggerDelay,
  ]);

  // Filter visible buildings
  const visibleBuildings = useMemo(
    () => buildingData.filter((b) => !b.shouldHide),
    [buildingData]
  );

  // Animation constants
  const minHeight = 0.3;
  const baseOffset = 0.2;
  const tension = animationConfig.tension || 120;
  const friction = animationConfig.friction || 14;

  // Spring physics approximation for animation
  const springDuration = Math.sqrt(1 / (tension * 0.001)) * friction * 20;

  // Initialize instance matrices and colors on mount and when data changes
  useEffect(() => {
    if (!meshRef.current) return;

    visibleBuildings.forEach((data, instanceIndex) => {
      const { width, depth, x, z, color, targetHeight } = data;

      // Set initial position (flat state)
      const height = growProgress * targetHeight + minHeight;
      const yPosition = height / 2 + baseOffset;

      tempObject.position.set(x, yPosition, z);
      tempObject.scale.set(width, height, depth);
      tempObject.updateMatrix();

      meshRef.current!.setMatrixAt(instanceIndex, tempObject.matrix);

      // Set color
      tempColor.set(color);
      meshRef.current!.setColorAt(instanceIndex, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [
    visibleBuildings,
    growProgress,
    tempObject,
    tempColor,
    minHeight,
    baseOffset,
  ]);

  // Update instance matrices every frame
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    if (startTimeRef.current === null && growProgress > 0) {
      startTimeRef.current = clock.elapsedTime * 1000;
    }

    const currentTime = clock.elapsedTime * 1000;
    const animStartTime = startTimeRef.current ?? currentTime;

    visibleBuildings.forEach((data, instanceIndex) => {
      const { width, depth, targetHeight, x, z, staggerDelayMs, shouldDim } =
        data;

      // Calculate animation progress with stagger
      const elapsed = currentTime - animStartTime - staggerDelayMs;
      let animProgress = growProgress;

      if (growProgress > 0 && elapsed >= 0) {
        // Ease out cubic for spring-like feel
        const t = Math.min(elapsed / springDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        animProgress = eased * growProgress;
      } else if (growProgress > 0 && elapsed < 0) {
        animProgress = 0;
      }

      const height = animProgress * targetHeight + minHeight;
      const yPosition = height / 2 + baseOffset;

      // Apply hover scale
      const isHovered = hoveredIndex === data.index;
      const scale = isHovered ? 1.05 : 1;

      // Set position and scale
      tempObject.position.set(x, yPosition, z);
      tempObject.scale.set(width * scale, height, depth * scale);
      tempObject.updateMatrix();

      meshRef.current!.setMatrixAt(instanceIndex, tempObject.matrix);

      // Set color (with dim for non-highlighted)
      const opacity =
        shouldDim && isolationMode === 'transparent' ? dimOpacity : 1;
      tempColor.set(data.color);
      if (opacity < 1) {
        // Darken color to simulate transparency on opaque mesh
        tempColor.multiplyScalar(opacity + 0.3);
      }
      if (isHovered) {
        // Brighten on hover
        tempColor.multiplyScalar(1.2);
      }
      meshRef.current!.setColorAt(instanceIndex, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Handle pointer events
  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (
        e.instanceId !== undefined &&
        e.instanceId < visibleBuildings.length
      ) {
        const data = visibleBuildings[e.instanceId];
        onHover?.(data.building);
      }
    },
    [visibleBuildings, onHover]
  );

  const handlePointerOut = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (
        e.instanceId !== undefined &&
        e.instanceId < visibleBuildings.length
      ) {
        const data = visibleBuildings[e.instanceId];
        onClick?.(data.building);
      }
    },
    [visibleBuildings, onClick]
  );

  if (visibleBuildings.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, visibleBuildings.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.1} roughness={0.35} />
    </instancedMesh>
  );
}

// ============================================================================
// Individual Building Component (for small scenes or when spring animation is needed)
// ============================================================================

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
  // Height scaling
  heightScaling: HeightScaling;
  linearScale: number;
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
  heightScaling,
  linearScale,
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
  const fullHeight = calculateBuildingHeight(
    building,
    heightScaling,
    linearScale
  );
  const targetHeight = shouldCollapse ? 0.5 : fullHeight; // Collapsed = very short

  // Use highlight color if highlighted, otherwise base color
  const color = isHighlighted ? highlight.color : baseColor;

  // Calculate staggered delay
  const staggerMs = (animationConfig.staggerDelay || 15) * staggerIndex;

  // Spring animation for height
  // Minimum height of 0.3 with base offset of 0.2 ensures buildings sit above the grid (at y=0) even when flat
  const minHeight = 0.3;
  const baseOffset = 0.2; // Lift buildings above the ground/grid to avoid z-fighting
  const animatedHeight = growProgress * targetHeight + minHeight;
  const { height, yPosition } = useSpring({
    height: animatedHeight,
    yPosition: animatedHeight / 2 + baseOffset,
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

  // Offset floor based on path depth to avoid z-fighting between nested districts
  // Using large negative Y to ensure districts are always below buildings
  const pathDepth = district.path.split('/').length;
  const floorY = -5 - pathDepth * 0.1;

  return (
    <group position={[centerX, 0, centerZ]}>
      {/* Border only - floor plates removed to avoid z-fighting */}
      <lineSegments
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY, 0]}
        renderOrder={-1}
      >
        <edgesGeometry
          args={[new THREE.PlaneGeometry(width, depth)]}
          attach="geometry"
        />
        <lineBasicMaterial color="#475569" depthWrite={false} />
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

// Animated camera controller - simple tilt from top-down to angled view
interface AnimatedCameraProps {
  citySize: number;
  isFlat: boolean;
  animationConfig: AnimationConfig;
}

// Store reset function globally so it can be called from outside the canvas
let cameraResetFn: (() => void) | null = null;

export function resetCamera() {
  cameraResetFn?.();
}

function AnimatedCamera({
  citySize,
  isFlat,
}: Omit<AnimatedCameraProps, 'animationConfig'>) {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const resetToInitial = useCallback(() => {
    const targetHeight = isFlat ? citySize * 1.5 : citySize * 1.1;
    const targetZ = isFlat ? 0 : citySize * 1.3;

    camera.position.set(0, targetHeight, targetZ);
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [isFlat, citySize, camera]);

  // Set camera position when isFlat changes
  useEffect(() => {
    resetToInitial();
  }, [resetToInitial]);

  // Expose reset function
  useEffect(() => {
    cameraResetFn = resetToInitial;
    return () => {
      cameraResetFn = null;
    };
  }, [resetToInitial]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={50} near={1} far={citySize * 10} />
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
  const rawExt = building.fileExtension || building.path.split('.').pop() || '';
  const ext = rawExt.replace(/^\./, ''); // Strip leading dot
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
        {building.lineCount !== undefined && (
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
  onResetCamera: () => void;
}

function ControlsOverlay({
  isFlat,
  onToggle,
  onResetCamera,
}: ControlsOverlayProps) {
  const buttonStyle = {
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
  };

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
      <button onClick={onResetCamera} style={buttonStyle}>
        ↺ Reset View
      </button>
      <button onClick={onToggle} style={buttonStyle}>
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
  // Height scaling
  heightScaling: HeightScaling;
  linearScale: number;
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
  heightScaling,
  linearScale,
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
  // Returns an array where staggerIndices[originalIndex] = staggerOrder
  const staggerIndices = useMemo(() => {
    const centerX = (cityData.bounds.minX + cityData.bounds.maxX) / 2;
    const centerZ = (cityData.bounds.minZ + cityData.bounds.maxZ) / 2;

    const withDistance = cityData.buildings.map((b, originalIndex) => ({
      originalIndex,
      distance: Math.sqrt(
        Math.pow(b.position.x - centerX, 2) +
          Math.pow(b.position.z - centerZ, 2)
      ),
    }));

    // Sort by distance and create mapping
    withDistance.sort((a, b) => a.distance - b.distance);

    // Create array where index is original building index, value is stagger order
    const indices: number[] = new Array(cityData.buildings.length);
    withDistance.forEach((item, staggerOrder) => {
      indices[item.originalIndex] = staggerOrder;
    });

    return indices;
  }, [cityData.buildings, cityData.bounds]);

  // Find hovered building index
  const hoveredIndex = useMemo(() => {
    if (!hoveredBuilding) return null;
    return cityData.buildings.findIndex((b) => b.path === hoveredBuilding.path);
  }, [hoveredBuilding, cityData.buildings]);

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

      {/* Environment removed - HDR files don't load in Electron asar bundles */}

      {/* Districts (floor plates) */}
      {cityData.districts.map((district) => (
        <DistrictFloor
          key={district.path}
          district={district}
          centerOffset={centerOffset}
          opacity={1}
        />
      ))}

      {/* Buildings - using instanced mesh for performance */}
      <InstancedBuildings
        buildings={cityData.buildings}
        centerOffset={centerOffset}
        onHover={onBuildingHover}
        onClick={onBuildingClick}
        hoveredIndex={hoveredIndex}
        growProgress={growProgress}
        animationConfig={animationConfig}
        highlightLayers={highlightLayers}
        isolationMode={isolationMode}
        hasActiveHighlights={activeHighlights}
        dimOpacity={dimOpacity}
        heightScaling={heightScaling}
        linearScale={linearScale}
        staggerIndices={staggerIndices}
      />
    </>
  );
}

// Main content component props
export interface FileCity3DPanelProps {
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
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Message to display while loading */
  loadingMessage?: string;
  /** Message to display when there's no data */
  emptyMessage?: string;
  /** Height scaling mode: 'logarithmic' (default) or 'linear' */
  heightScaling?: HeightScaling;
  /** Scale factor for linear mode (height per line, default 0.05) */
  linearScale?: number;
}

/**
 * FileCity3DPanelContent - Core visualization component
 * Can be used directly with props or via the framework wrapper
 */
export function FileCity3DPanelContent({
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
  isLoading = false,
  loadingMessage = 'Loading file city...',
  emptyMessage = 'No file tree data available',
  heightScaling = 'logarithmic',
  linearScale = 0.05,
}: FileCity3DPanelProps) {
  const { theme } = useTheme();
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

  // Handle loading state
  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          position: 'relative',
          background: theme.colors.background,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.textSecondary,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          ...style,
        }}
      >
        {loadingMessage}
      </div>
    );
  }

  // Handle empty state
  if (!cityData || cityData.buildings.length === 0) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          position: 'relative',
          background: theme.colors.background,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.textSecondary,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          ...style,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        background: theme.colors.background,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Canvas
        shadows
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        onCreated={({ gl }) => {
          console.info('[FileCity3D] Canvas created, WebGL renderer:', gl.info);
        }}
      >
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
          heightScaling={heightScaling}
          linearScale={linearScale}
        />
      </Canvas>
      <InfoPanel building={hoveredBuilding} />
      {showControls && (
        <ControlsOverlay
          isFlat={!isGrown}
          onToggle={handleToggle}
          onResetCamera={resetCamera}
        />
      )}
    </div>
  );
}

/**
 * FileCity3DPanelPreview - Small preview component for panel switcher
 */
export const FileCity3DPanelPreview: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px',
        fontSize: '12px',
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {/* Mini isometric building representation */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
        <div
          style={{
            width: 8,
            height: 20,
            background: '#3178c6',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 32,
            background: '#61dafb',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 14,
            background: '#f7df1e',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 26,
            background: '#3572A5',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 8,
            height: 18,
            background: '#dea584',
            borderRadius: 2,
          }}
        />
      </div>
      <div style={{ color: theme.colors.textSecondary, fontSize: '10px' }}>
        3D Code City
      </div>
    </div>
  );
};

/**
 * FileCity3DPanel - Panel Framework compatible component
 * Extracts data from panel context and renders FileCity3DPanelContent
 */
export const FileCity3DPanel: React.FC<FileCity3DPanelPropsTyped> = ({
  context,
  events,
}) => {
  // Get data slice from typed context
  const fileTreeSlice = context.fileTree;

  // Extract data
  const fileTree = fileTreeSlice?.data;
  const isLoading = fileTreeSlice?.loading || false;

  // Build city data from file tree
  const cityData = useMemo(() => {
    if (!fileTree) return null;

    // Get root path from file tree metadata
    const rootPath = fileTree.metadata?.id || '';

    // Build and enrich city data
    const rawCityData = buildCityDataFromFileTree(fileTree, rootPath);
    return estimateLineCounts(rawCityData);
  }, [fileTree]);

  // Handle building click - emit file:open event
  const handleBuildingClick = useCallback(
    (building: CityBuilding) => {
      events?.emit({
        type: 'file:open',
        source: 'file-city-3d-panel',
        timestamp: Date.now(),
        payload: { path: building.path },
      });
    },
    [events]
  );

  return (
    <FileCity3DPanelContent
      cityData={cityData!}
      width="100%"
      height="100%"
      isLoading={isLoading}
      onBuildingClick={handleBuildingClick}
      showControls={true}
      animation={{ startFlat: true, autoStartDelay: 300 }}
    />
  );
};

// Legacy export for backwards compatibility
export const FileCity3D = FileCity3DPanelContent;
export default FileCity3DPanelContent;
