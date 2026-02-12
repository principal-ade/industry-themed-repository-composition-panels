# Unified Map Implementation TODO

## Current Status

✅ **Data Layer Complete**
- Created `nodesToUnifiedOverworldMap()` - generates single map with regions
- Created `packagesToUnifiedOverworldMap()` - package-specific wrapper
- Regions are positioned horizontally with spacing
- Each region tracks its bounds and center point

## Panel Component Changes Needed

### 1. Update Rendering (In Progress)

**Current approach:**
- Renders entire map
- Auto-scales to fit viewport
- Centers content

**New approach needed:**
- Render entire unified map (all regions)
- Scale to fit viewport BUT keep original ratio
- Camera focuses on current region
- Smooth pan animation between regions

### 2. Camera System

```typescript
// Add camera animation
const animateCamera = useCallback((targetRegion: MapRegion, duration: number = 1000) => {
  if (!worldContainerRef.current || isAnimating) return;

  setIsAnimating(true);

  // Calculate target position to center region in viewport
  const { centerX, centerY } = targetRegion;
  const targetScreenPos = gridToScreen(centerX, centerY);

  // Animate worldContainer.x and worldContainer.y
  // Use requestAnimationFrame or PixiJS ticker
  // Smooth easing (e.g., ease-out cubic)

  // After animation complete:
  setIsAnimating(false);
}, [isAnimating]);
```

### 3. Region Navigation UI

**Replace current World 1/World 2 nav with:**

```tsx
{mapData.regions.length > 1 && (
  <div style={regionNavigationStyle}>
    {/* Left arrow */}
    <button onClick={() => {
      const newIndex = Math.max(0, currentRegionIndex - 1);
      setCurrentRegionIndex(newIndex);
      animateCamera(mapData.regions[newIndex]);
    }}>
      ← Previous Region
    </button>

    {/* Region indicator */}
    <div>
      {currentRegion.name}
      <div>Region {currentRegionIndex + 1} of {mapData.regions.length}</div>
    </div>

    {/* Right arrow */}
    <button onClick={() => {
      const newIndex = Math.min(mapData.regions.length - 1, currentRegionIndex + 1);
      setCurrentRegionIndex(newIndex);
      animateCamera(mapData.regions[newIndex]);
    }}>
      Next Region →
    </button>
  </div>
)}
```

### 4. Visual Region Separators

Add decorative elements between regions:
- Mountains (gray triangles)
- Rivers (blue wavy lines)
- Forests (green blocks)
- Signs with region names

```typescript
// In region generation:
if (regionIndex > 0) {
  addRegionSeparator(
    currentX - REGION_SPACING,
    0,
    REGION_SPACING,
    maxHeight
  );
}
```

### 5. Minimap (Optional Enhancement)

Show entire map with regions highlighted:
```tsx
<div style={{ position: 'absolute', bottom: 8, right: 8 }}>
  <MinimapComponent
    regions={mapData.regions}
    currentRegion={currentRegionIndex}
    onClick={(index) => {
      setCurrentRegionIndex(index);
      animateCamera(mapData.regions[index]);
    }}
  />
</div>
```

## Benefits of Unified Map

✅ **Better UX**
- No discrete "switching" between worlds
- Smooth Mario-style camera panning
- Can see transitions between regions
- More immersive continuous world feel

✅ **Navigation**
- Arrow keys could pan left/right through regions
- Click to jump to specific regions
- Minimap shows your position in the full map

✅ **Visual Continuity**
- Add landmarks/separators between regions
- Natural boundaries (mountains, rivers)
- Feels like exploring one world, not teleporting

## Example Usage After Complete

```typescript
const map = packagesToUnifiedOverworldMap(packages);

// map.regions[0] = "Core Packages" (12 nodes)
// map.regions[1] = "Frontend" (10 nodes)
// map.regions[2] = "Tools & CLI" (6 nodes)

// Camera starts focused on region 0
// Click → to smoothly pan to region 1
// Click → again to pan to region 2
// All regions exist on same continuous canvas
```

## Next Steps

1. ✅ Finish exporting new functions
2. ⏳ Update OverworldMapPanel to use unified map
3. ⏳ Implement camera panning animation
4. ⏳ Update navigation UI for regions
5. ⏳ Add visual region separators
6. ⏳ Test with large monorepos
7. ✨ Polish: minimap, arrow key navigation, etc.

## Files Modified

- ✅ `types.ts` - Added MapRegion, updated OverworldMap
- ✅ `genericMapper.ts` - Added nodesToUnifiedOverworldMap
- ✅ `dataConverter.ts` - Added packagesToUnifiedOverworldMap
- ⏳ `OverworldMapPanel.tsx` - Needs camera system update
- ✅ `EXAMPLES.md` - Document usage patterns
