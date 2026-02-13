# Overworld Map Visual Iteration Plan

How to iterate and improve the buildings, tiles, and map components.

## Current State

### What We Have Now

**Tiles:**
- ✅ Isometric grass tiles (5 biomes: grass, desert, water, volcano, ice)
- ✅ Basic texture detail (small pixel clusters)
- ✅ Diamond shape (64x32 pixels)
- ✅ 3 colors per biome (primary, secondary, accent)

**Buildings:**
- ✅ Castle (large, 48px height, red roof, windows)
- ✅ Tower/Fortress (medium, 32px height)
- ✅ House (small, 24px height, brown roof, door)
- ✅ Pipe (Mario-style warp pipe, 28px height)
- ✅ Isometric 3D effect (front face + side face)
- ✅ Size variants (1x, 2x, 3x base)

**Paths:**
- ✅ Lines connecting buildings (Graphics API)
- ✅ Color coding (blue = production, gray = dev)
- ✅ Alpha transparency

**Environment:**
- ✅ Sky blue background (#87ceeb)
- ❌ No clouds
- ❌ No decorations
- ❌ No animations

## Iteration Areas

### 1. Building Sprite Quality

**Current Issues:**
- Too simple/blocky
- Limited detail
- All same architectural style
- No category differentiation

**Improvement Ideas:**

#### A. Add Building Variety Based on Package Type

```typescript
// Map package types to building styles
const BUILDING_STYLES = {
  // Node.js packages
  'node': 'modern-office',      // Glass/steel building

  // Python packages
  'python': 'library',          // Classical columns

  // Rust packages
  'cargo': 'factory',           // Industrial/steampunk

  // Go packages
  'go': 'warehouse',            // Minimal/geometric

  // Unknown/default
  'package': 'house',           // Generic building
};
```

**Building Styles to Add:**

1. **Modern Office** (Node.js)
   - Rectangular glass building
   - Window grid pattern
   - Antenna on top
   - Blue/gray colors

2. **Library** (Python)
   - Classical columns
   - Triangular pediment
   - Steps at entrance
   - Cream/tan colors

3. **Factory** (Rust/Cargo)
   - Smokestack
   - Brick pattern
   - Industrial details
   - Red/brown colors

4. **Warehouse** (Go)
   - Simple rectangular
   - Large door
   - Minimal details
   - Gray/blue colors

5. **Data Center** (Important/root packages)
   - Multiple sections
   - Cooling vents
   - Server rack details
   - Metal gray colors

#### B. Add Status Indicators to Buildings

```typescript
// Visual overlays on buildings
const STATUS_INDICATORS = {
  'outdated': '⚠️ flag',      // Yellow warning flag
  'error': '🔥 fire/smoke',   // Red smoke particles
  'success': '✅ green light', // Green glow/light
  'building': '🔧 crane',     // Construction crane
  'deprecated': '💀 skull',   // Skull and crossbones
};
```

**Implementation:**
- Add small icon/animation above building
- Pulse animation for attention
- Color-coded flags/banners

#### C. Add Building Details

**Enhancement List:**
- Chimneys with smoke particles
- Flags on roofs (waving animation)
- Multiple window styles
- Door variations (open/closed)
- Balconies
- Garden plots around base
- Shadow casting on ground

### 2. Tile Variety & Transitions

**Current Issues:**
- Single tile type per biome
- No tile variation
- Sharp biome boundaries
- No terrain features

**Improvements:**

#### A. Tile Variations

```typescript
// Generate 3-4 variations per tile type
generateGrassTile(theme, variant: 1-4)

// Variants could have:
// - Different grass tufts positions
// - Small flowers (1-2 pixels)
// - Darker/lighter shading
// - Small rocks
```

**Per-Biome Variations:**

**Grass:**
- Plain grass
- Grass with flowers (red, yellow pixels)
- Grass with small rocks
- Darker grass (shadow areas)

**Desert:**
- Smooth sand
- Sand with cactus (small 4-6px)
- Sand with rocks
- Rippled sand patterns

**Water:**
- Still water
- Ripple pattern 1
- Ripple pattern 2
- Foam/wave edges

**Volcano:**
- Cracked ground
- Lava cracks (red glow)
- Ash piles
- Smoke vents

**Ice:**
- Smooth ice
- Cracked ice
- Snow drifts
- Ice crystals

#### B. Transition Tiles

Create edge tiles where biomes meet:
```typescript
generateTransitionTile(biome1: 'grass', biome2: 'desert')
// Returns: Half grass, half desert diamond
```

**Example:**
```
Grass -> Desert transition:
┌─────────┐
│  Green  │
│ ◇ Sand  │
│  Half   │
└─────────┘
```

#### C. Terrain Features

Add special tiles:
- Trees (on grass)
- Palm trees (on desert)
- Ice spikes (on ice)
- Lava pools (on volcano)
- Whirlpools (on water)

### 3. Path Visual Improvements

**Current Issues:**
- Plain lines
- No texture
- Doesn't look like paths

**Improvements:**

#### A. Dashed/Dotted Paths

```typescript
// Instead of solid lines, use:
graphics.setLineDash([8, 4]); // 8px dash, 4px gap
```

#### B. Animated Paths

```typescript
// Moving dashes along the path
let dashOffset = 0;
app.ticker.add(() => {
  dashOffset += 0.5;
  graphics.setLineDash([8, 4]);
  graphics.lineDashOffset = dashOffset;
  graphics.stroke();
});
```

**Effect:** Creates "marching ants" effect showing data flow direction

#### C. Path Decorations

Instead of lines, draw:
- Footprints along path
- Dotted trail
- Arrows showing direction
- Pulsing dots that travel

#### D. Bezier Curves Instead of Straight Lines

```typescript
// Smooth curves between nodes
graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
```

### 4. Environmental Decorations

**Add Background Elements:**

#### A. Clouds

```typescript
// Floating clouds that drift slowly
class Cloud {
  x: number;
  y: number;
  speed: number; // 0.1-0.3 pixels/frame

  update() {
    this.x += this.speed;
    if (this.x > screenWidth) this.x = -cloudWidth;
  }
}
```

**Cloud Sprites:**
- 3-4 cloud shapes
- White with light gray shading
- 16x8 to 32x16 pixels
- Semi-transparent (alpha 0.6-0.8)

#### B. Biome-Specific Decorations

**Grass:**
- Small trees (4-8px tall)
- Bushes
- Flowers
- Butterflies (animated)

**Desert:**
- Cacti
- Tumbleweeds (rolling animation)
- Heat shimmer effect
- Sand dunes

**Water:**
- Small islands
- Boats/ships
- Fish jumping
- Seagulls

**Volcano:**
- Smoke plumes
- Lava bubbles
- Falling ash particles
- Glowing cracks

**Ice:**
- Snowflakes falling
- Icicles
- Penguins/seals
- Aurora borealis in sky

### 5. Animation & Life

**Add Movement:**

#### A. Ambient Animations

```typescript
// Water shimmer
waterTile.tint = lerp(0x06b6d4, 0x67e8f9, Math.sin(time) * 0.5 + 0.5);

// Flag waving
flag.rotation = Math.sin(time * 2) * 0.1;

// Smoke particles
emitParticle(x, y, velocityY: -0.5, alpha: 0.8);
```

#### B. Interactive Animations

**On Hover:**
- Building windows light up
- Door opens slightly
- Flag waves faster
- Particles emit

**On Click:**
- Building "jumps" (scale pulse)
- Star particles burst
- Sound effect (blip)

### 6. Color Palette Refinement

**Current Colors:** Modern Tailwind (too vibrant)

**Authentic 8-bit Palettes:**

#### NES Palette (52 colors)
```typescript
const NES_COLORS = {
  // Greens
  grass1: '#00A800',
  grass2: '#00F800',
  grass3: '#58F898',

  // Reds
  volcano1: '#F83800',
  volcano2: '#A80020',
  volcano3: '#F87858',

  // Blues
  water1: '#0058F8',
  water2: '#3CBCFC',
  water3: '#00A8E0',

  // Yellows/Tan
  desert1: '#F8B800',
  desert2: '#FCE0A8',
  desert3: '#F0D0B0',
};
```

#### SNES Palette (32,768 colors, but use limited subset)
```typescript
const SNES_COLORS = {
  grass1: '#229944',
  grass2: '#44BB66',
  grass3: '#88DD99',
  // ... more nuanced shades
};
```

**Recommendation:** Create toggleable palette modes
- "Modern" (current Tailwind)
- "NES Classic"
- "SNES Enhanced"
- "Game Boy" (4-shade green)

### 7. Lighting & Depth

**Add Visual Depth:**

#### A. Shadows

```typescript
// Drop shadow under buildings
ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
ctx.ellipse(
  width/2, baseY + height,
  width * 0.6, height * 0.2,
  0, 0, Math.PI * 2
);
ctx.fill();
```

#### B. Height Indicators

- Taller buildings cast longer shadows
- Important packages have glow/aura
- Root packages have special base (podium)

#### C. Day/Night Cycle (Advanced)

```typescript
// Time of day affects colors
const timeOfDay = 0.5; // 0=midnight, 0.5=noon, 1=midnight

// Adjust tile brightness
tileTint = lerp(NIGHT_TINT, DAY_TINT, timeOfDay);

// Building windows glow at night
if (timeOfDay < 0.3 || timeOfDay > 0.7) {
  ctx.fillStyle = '#FFF700'; // Yellow glow
  ctx.fillRect(windowX, windowY, windowW, windowH);
}
```

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. **Add cloud decorations** (easy, big visual impact)
2. **Add tile variations** (4 variants per biome)
3. **Improve path styling** (dashed lines, better colors)
4. **Add building shadows** (simple ellipse)

### Phase 2: Building Variety (2-3 days)

1. **Create 5 building style templates**
2. **Map package types to building styles**
3. **Add detail sprites** (windows, doors, roofs)
4. **Status indicator flags**

### Phase 3: Animation (2-3 days)

1. **Cloud drift animation**
2. **Water shimmer effect**
3. **Animated paths** (marching ants)
4. **Hover animations** (building bounce)

### Phase 4: Polish (3-4 days)

1. **Transition tiles between biomes**
2. **Biome-specific decorations** (trees, cacti, etc.)
3. **Particle effects** (smoke, snow, sparkles)
4. **Authentic color palettes** (NES/SNES mode)

### Phase 5: Advanced (Optional, 5+ days)

1. **Day/night cycle**
2. **Weather effects** (rain, snow)
3. **Seasonal variations**
4. **Interactive decorations** (clickable trees, etc.)

## Testing Strategy

**Visual Comparison:**
1. Screenshot current version
2. Implement changes
3. Screenshot new version
4. Side-by-side comparison
5. User feedback

**Reference Images:**
- Super Mario World map screenshots
- Final Fantasy VI world map
- Chrono Trigger overworld
- Earthbound town map

**Iteration Cycle:**
1. Design mockup (Figma/Aseprite)
2. Implement in code
3. View in Storybook
4. Gather feedback
5. Refine
6. Repeat

## Tools for Iteration

**Pixel Art Editors:**
- Aseprite ($19.99, best for animation)
- Pixelorama (free, open source)
- Piskel (free, web-based)
- GraphicsGale (free)

**Workflow:**
1. Draw sprite in editor
2. Export as PNG
3. Convert to procedural code OR
4. Load as texture atlas

**Code vs. Assets:**

**Procedural (Current):**
- ✅ No asset management
- ✅ Easy to modify colors
- ✅ Scales with code
- ❌ Limited detail
- ❌ Time-consuming to code

**Asset-Based:**
- ✅ Higher quality possible
- ✅ Faster iteration (draw instead of code)
- ✅ Can use real pixel art tools
- ❌ Need to manage files
- ❌ Harder to dynamically change

**Recommendation:** Hybrid approach
- Use assets for complex buildings
- Use procedural for tiles (easy color variants)
- Use sprites for decorations

## Next Steps

Would you like to:

1. **Quick visual test** - Add clouds and shadows right now (30 min)
2. **Building variety** - Create the 5 building styles (2-3 hours)
3. **Tile improvements** - Add variations and transitions (2-3 hours)
4. **Animation demo** - Add water shimmer and cloud drift (1 hour)
5. **Asset workflow** - Set up Aseprite and import sprites (1 hour)
6. **Color palette** - Switch to authentic NES colors (30 min)

Pick one and we can start iterating immediately!
