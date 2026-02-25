# Collection Map Panel

The Collection Map Panel visualizes Alexandria Collections as interactive overworld maps, where repositories are rendered as isometric sprites that users can organize into regions.

## What It Does

- **Visualizes repository collections** as interactive 2D isometric maps
- **Supports drag-and-drop** for adding and repositioning repositories
- **Organizes repositories into regions** (customizable areas on the map)
- **Shows repository metadata** through visual indicators (size, age, language)

## Key Operations

### Data Transformation

When a collection loads, repositories are converted to `GenericNode` objects for rendering. This involves calculating sizes, aging effects, and package subdivisions.

### Layout Initialization

On first load, the panel computes initial positions for all repositories using circle-packing algorithms and creates default regions based on repository age.

### User Interactions

- **Drag & Drop**: Add new repositories or reposition existing ones
- **Click**: Select a repository to view details
- **Region Management**: Create, rename, or delete regions

## Design Decisions

1. **Lazy tracer initialization**: The OTEL tracer is fetched at span-creation time to ensure the provider is registered (Storybook addon timing).

2. **Region-relative coordinates**: Repository positions are stored relative to their region, allowing regions to be reordered without recalculating all positions.

3. **Batch layout updates**: Initial layout computation saves regions, assignments, and positions in a single batch to minimize re-renders.

## Error Scenarios

- **Missing repository data**: Warns and skips nodes that can't be matched to collection memberships
- **Region deletion blocked**: Prevents deleting the last region to ensure valid layout state
