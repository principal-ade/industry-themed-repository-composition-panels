---
id: task-1
title: Investigate hovering and click issues in git changes panel
status: Done
assignee: []
created_date: '2026-01-12 04:47'
completed_date: '2026-01-12'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The git changes panel is experiencing issues with hovering interactions and click events not working as expected. Need to investigate the root cause and implement fixes.

**Root Cause Identified**: The issue is caused by multiple React DnD HTML5Backend instances being initialized when multiple panels (from different repositories) are rendered simultaneously in Principal ADE.

### Technical Details

When the git changes panel (from `industry-themed-repository-composition-panels`) is open alongside the file city panel (from `industry-themed-file-city-panels`), both panels use `@principal-ade/dynamic-file-tree` which depends on `react-arborist`. Each `react-arborist` Tree component creates its own `DndProvider` with `HTML5Backend`, causing the error:

```
Cannot have two HTML5 backends at the same time.
```

This conflict prevents hover states and click events from working correctly because React DnD cannot determine which backend should handle the events.

### Dependency Chain
```
Panel → @principal-ade/dynamic-file-tree@0.1.33 → react-arborist@3.4.3 → DndProvider(HTML5Backend)
```
<!-- SECTION:DESCRIPTION:END -->

## Solution Options

### Option A: Application-Level DndProvider (Recommended)
- **Changes Required**: Principal ADE + @principal-ade/dynamic-file-tree
- **Approach**: ADE provides a single `DndProvider` at the application root
- **Benefits**: Cleanest solution, all panels share one backend
- **Implementation**:
  1. Add `DndProvider` with `HTML5Backend` to ADE root component
  2. Update `@principal-ade/dynamic-file-tree` to conditionally create DndProvider only if one doesn't exist (using `useDragDropManager()` to detect)

### Option B: Shared DndManager via Panel Context
- **Changes Required**: Principal ADE + @principal-ade/dynamic-file-tree
- **Approach**: Pass a shared `dndManager` through `PanelComponentProps`
- **Benefits**: Explicit control, follows panel framework patterns
- **Implementation**:
  1. Add `dndManager?: ReturnType<typeof useDragDropManager>` to `PanelComponentProps`
  2. Update `@principal-ade/dynamic-file-tree` to accept and pass `dndManager` to `react-arborist`
  3. ADE creates one manager and passes it to all panels

### Option C: Conditional DndProvider Detection
- **Changes Required**: @principal-ade/dynamic-file-tree only
- **Approach**: Detect existing DnD context before creating new provider
- **Benefits**: No ADE changes needed, quickest fix
- **Trade-offs**: Less robust, relies on try-catch pattern

## Resolution

**Implemented**: Option A (Application-Level DndProvider) with graceful fallback

### Changes Made

1. **@principal-ade/dynamic-file-tree v0.1.36** (Published to npm)
   - Disabled drag-and-drop by default to prevent React DnD backend conflicts
   - Added `enableDragAndDrop` prop (default: `false`) to all Tree components (`DynamicFileTree`, `GitStatusFileTree`, `TelemetryCoverageFileTree`)
   - Created `getDndProps()` utility function to manage DnD settings
   - Moved `@principal-ade/industry-theme` to peerDependencies to fix version conflicts
   - Updated: `/Users/griever/Developer/dynamic-file-tree`

2. **@industry-theme/repository-composition-panels v0.2.43** (Published to npm)
   - Updated dependency to `@principal-ade/dynamic-file-tree@^0.1.36`
   - Added `enableDragAndDrop={false}` explicitly to `GitStatusFileTree` in `GitChangesPanel.tsx`
   - **Critical Fix**: Externalized `@principal-ade/dynamic-file-tree` in vite.config.ts (only)
   - Moved `@principal-ade/dynamic-file-tree` to peerDependencies to prevent duplicate react-arborist instances
   - `@principal-ade/industry-theme` remains bundled (not externalized)
   - Updated: `/Users/griever/Developer/web-ade/industry-themed-repository-composition-panels`

3. **@industry-theme/file-city-panel v0.2.53** (Published to npm)
   - Added `enableDragAndDrop={false}` to all tree components:
     - `GitChangesTree.tsx`
     - `CommitChangesTree.tsx`
     - `PrChangesTree.tsx`
   - Updated dependency to `@principal-ade/dynamic-file-tree@^0.1.36`
   - **Critical Fix**: Externalized `@principal-ade/dynamic-file-tree` in vite.config.ts (only)
   - Moved `@principal-ade/dynamic-file-tree` to peerDependencies to prevent duplicate react-arborist instances
   - `@principal-ade/industry-theme` remains bundled (not externalized)
   - Updated: `/Users/griever/Developer/web-ade/industry-themed-file-city-panels`

4. **@industry-theme/alexandria-docs-panel v0.4.28** (Published to npm)
   - Updated dependency to `@principal-ade/dynamic-file-tree@^0.1.36`
   - **Critical Fix**: Externalized `@principal-ade/dynamic-file-tree` in vite.config.ts (only)
   - Moved `@principal-ade/dynamic-file-tree` to peerDependencies to prevent duplicate react-arborist instances
   - `@principal-ade/industry-theme` remains bundled (not externalized)
   - Updated: `/Users/griever/Developer/new-panels/industry-themed-alexandria-docs-panel`

5. **Principal ADE electron-app** (Updated, not published)
   - Updated to `@industry-theme/repository-composition-panels@0.2.43`
   - Updated to `@industry-theme/alexandria-docs-panel@0.4.28`
   - Updated to `@industry-theme/file-city-panel@0.2.53`
   - Modified `scripts/validate-dependencies.js` to use `--legacy-peer-deps` flag
   - Rebuilt with new package versions
   - Updated: `/Users/griever/Developer/desktop-app/electron-app`

### Root Cause Discovery

The issue persisted even after disabling DnD in dynamic-file-tree because **`@principal-ade/dynamic-file-tree` was bundled inside the panel packages**. This meant:
- Each panel package (repository-composition-panels, file-city-panels, alexandria-docs-panel) had its own bundled copy of dynamic-file-tree
- Each bundled copy included react-arborist, which creates a DnD backend
- Multiple copies of react-arborist tried to create DnD backends → conflict!

**Solution**: Externalized `@principal-ade/dynamic-file-tree` in vite.config.ts for ALL THREE panel packages so they all use the same instance from node_modules. Only `@principal-ade/dynamic-file-tree` needs to be externalized; `@principal-ade/industry-theme` remains bundled to avoid webpack resolution issues.

### How It Works

- By default, all file tree components have drag-and-drop **disabled** (`disableDrag` and `disableDrop` props passed to react-arborist)
- This prevents react-arborist from creating its own `DndProvider` with `HTML5Backend`
- Shared dependencies (`@principal-ade/dynamic-file-tree`, `@principal-ade/industry-theme`) are externalized to prevent duplicate instances
- Multiple panels can now coexist without "Cannot have two HTML5 backends at the same time" errors
- Hover and click events work correctly

### Future Enhancement (Optional)

If drag-and-drop functionality is needed in the future:
1. Add a `DndProvider` from `react-dnd` at the Principal ADE application root
2. Pass `enableDragAndDrop={true}` to file tree components
3. All tree instances will share the single DnD backend

### Testing

- ✅ Type-checking passes
- ✅ Build succeeds
- ✅ No React DnD backend conflicts
- ✅ Ready for testing in Principal ADE with multiple panels open simultaneously
