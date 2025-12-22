import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { graphStratify, sugiyama, decrossOpt, coordCenter } from 'd3-dag';
import type { ExtendedCanvas } from '@principal-ai/principal-view-core';

interface SimNode extends SimulationNodeDatum {
  id: string;
  width: number;
  height: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export interface ForceLayoutOptions {
  /** Strength of repulsion between nodes (-300 default, more negative = more spread) */
  chargeStrength?: number;
  /** Target distance between linked nodes (150 default) */
  linkDistance?: number;
  /** Collision radius multiplier based on node size (1.2 default) */
  collisionMultiplier?: number;
  /** Number of simulation iterations (300 default) */
  iterations?: number;
  /** Center X coordinate (auto-calculated if not provided) */
  centerX?: number;
  /** Center Y coordinate (auto-calculated if not provided) */
  centerY?: number;
}

/**
 * Apply D3 force-directed layout to an ExtendedCanvas.
 * Handles cycles naturally since force simulation doesn't assume hierarchy.
 */
export function applyForceLayout(
  canvas: ExtendedCanvas,
  options: ForceLayoutOptions = {}
): ExtendedCanvas {
  const {
    chargeStrength = -400,
    linkDistance = 180,
    collisionMultiplier = 1.2,
    iterations = 300,
    centerX,
    centerY,
  } = options;

  if (!canvas.nodes || canvas.nodes.length === 0) {
    return canvas;
  }

  // Calculate center from existing positions or use provided values
  const existingCenterX =
    centerX ??
    canvas.nodes.reduce((sum, n) => sum + (n.x || 0) + (n.width || 100) / 2, 0) /
      canvas.nodes.length;
  const existingCenterY =
    centerY ??
    canvas.nodes.reduce((sum, n) => sum + (n.y || 0) + (n.height || 80) / 2, 0) /
      canvas.nodes.length;

  // Convert canvas nodes to simulation nodes
  const simNodes: SimNode[] = canvas.nodes.map((node) => ({
    id: node.id,
    x: (node.x || 0) + (node.width || 100) / 2, // Start from center of node
    y: (node.y || 0) + (node.height || 80) / 2,
    width: node.width || 100,
    height: node.height || 80,
  }));

  // Convert canvas edges to simulation links
  const simLinks: SimLink[] = (canvas.edges || []).map((edge) => ({
    source: edge.fromNode,
    target: edge.toNode,
  }));

  // Calculate collision radius based on node size
  const getCollisionRadius = (node: SimNode) => {
    const radius = Math.max(node.width, node.height) / 2;
    return radius * collisionMultiplier;
  };

  // Create and run the simulation
  const simulation = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(linkDistance)
        .strength(0.5)
    )
    .force('charge', forceManyBody<SimNode>().strength(chargeStrength))
    .force('center', forceCenter(existingCenterX, existingCenterY))
    .force(
      'collide',
      forceCollide<SimNode>()
        .radius(getCollisionRadius)
        .strength(0.8)
    )
    .stop();

  // Run simulation synchronously
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Create node position map
  const positionMap = new Map<string, { x: number; y: number }>();
  for (const simNode of simNodes) {
    positionMap.set(simNode.id, {
      x: Math.round((simNode.x || 0) - simNode.width / 2), // Convert back to top-left
      y: Math.round((simNode.y || 0) - simNode.height / 2),
    });
  }

  // Create updated canvas with new positions
  const updatedCanvas: ExtendedCanvas = {
    ...canvas,
    nodes: canvas.nodes.map((node) => {
      const newPos = positionMap.get(node.id);
      if (newPos) {
        return {
          ...node,
          x: newPos.x,
          y: newPos.y,
        };
      }
      return node;
    }),
  };

  return updatedCanvas;
}

export interface SugiyamaLayoutOptions {
  /** Direction of the layout: 'TB' (top-bottom), 'BT', 'LR' (left-right), 'RL' */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** Horizontal spacing between nodes */
  nodeSpacingX?: number;
  /** Vertical spacing between layers */
  nodeSpacingY?: number;
  /** Starting X offset */
  offsetX?: number;
  /** Starting Y offset */
  offsetY?: number;
}

/**
 * Apply Sugiyama (hierarchical/layered) layout to an ExtendedCanvas.
 * Best for DAGs and directed graphs. Falls back to force layout if cycles exist.
 */
export function applySugiyamaLayout(
  canvas: ExtendedCanvas,
  options: SugiyamaLayoutOptions = {}
): ExtendedCanvas {
  const {
    direction = 'TB',
    nodeSpacingX = 200,
    nodeSpacingY = 150,
    offsetX = 50,
    offsetY = 50,
  } = options;

  if (!canvas.nodes || canvas.nodes.length === 0) {
    return canvas;
  }

  // Build adjacency info for the graph
  const nodeIds = new Set(canvas.nodes.map((n) => n.id));
  const edges = (canvas.edges || []).filter(
    (e) => nodeIds.has(e.fromNode) && nodeIds.has(e.toNode)
  );

  // Build parent map for stratify
  const childToParents = new Map<string, string[]>();
  for (const node of canvas.nodes) {
    childToParents.set(node.id, []);
  }
  for (const edge of edges) {
    const parents = childToParents.get(edge.toNode);
    if (parents) {
      parents.push(edge.fromNode);
    }
  }

  // Find root nodes (nodes with no incoming edges)
  const rootNodes = canvas.nodes.filter(
    (n) => (childToParents.get(n.id)?.length || 0) === 0
  );

  // If no clear roots, fall back to force layout
  if (rootNodes.length === 0) {
    console.warn('No root nodes found for Sugiyama layout, falling back to force layout');
    return applyForceLayout(canvas);
  }

  try {
    // Create stratify operator
    const stratify = graphStratify();

    // Build graph data for d3-dag
    const graphData = canvas.nodes.map((node) => ({
      id: node.id,
      parentIds: childToParents.get(node.id) || [],
    }));

    // Create the DAG
    const dag = stratify(graphData);

    // Create and apply the Sugiyama layout
    const layout = sugiyama()
      .decross(decrossOpt())
      .coord(coordCenter());

    // Get layout dimensions
    const { height: layoutHeight } = layout(dag);

    // Create node size map
    const nodeSizeMap = new Map<string, { width: number; height: number }>();
    for (const node of canvas.nodes) {
      nodeSizeMap.set(node.id, {
        width: node.width || 100,
        height: node.height || 80,
      });
    }

    // Calculate scale factors based on spacing
    const scaleX = nodeSpacingX;
    const scaleY = nodeSpacingY;

    // Create position map from DAG nodes
    const positionMap = new Map<string, { x: number; y: number }>();
    for (const dagNode of dag.nodes()) {
      const nodeSize = nodeSizeMap.get(dagNode.data.id) || { width: 100, height: 80 };

      let x: number, y: number;

      if (direction === 'TB') {
        x = dagNode.x * scaleX + offsetX - nodeSize.width / 2;
        y = dagNode.y * scaleY + offsetY - nodeSize.height / 2;
      } else if (direction === 'BT') {
        x = dagNode.x * scaleX + offsetX - nodeSize.width / 2;
        y = (layoutHeight - dagNode.y) * scaleY + offsetY - nodeSize.height / 2;
      } else if (direction === 'LR') {
        x = dagNode.y * scaleY + offsetX - nodeSize.width / 2;
        y = dagNode.x * scaleX + offsetY - nodeSize.height / 2;
      } else {
        // RL
        x = (layoutHeight - dagNode.y) * scaleY + offsetX - nodeSize.width / 2;
        y = dagNode.x * scaleX + offsetY - nodeSize.height / 2;
      }

      positionMap.set(dagNode.data.id, {
        x: Math.round(x),
        y: Math.round(y),
      });
    }

    // Create updated canvas with new positions
    const updatedCanvas: ExtendedCanvas = {
      ...canvas,
      nodes: canvas.nodes.map((node) => {
        const newPos = positionMap.get(node.id);
        if (newPos) {
          return {
            ...node,
            x: newPos.x,
            y: newPos.y,
          };
        }
        return node;
      }),
    };

    return updatedCanvas;
  } catch (error) {
    // d3-dag throws on cycles, fall back to force layout
    console.warn('Sugiyama layout failed (likely due to cycles), falling back to force layout:', error);
    return applyForceLayout(canvas);
  }
}
