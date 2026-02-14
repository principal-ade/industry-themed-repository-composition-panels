# Sprite Style Guide

Comprehensive guide for generating 8-bit isometric pixel art repository sprites.

## Isometric Projection Rules

### Tile Dimensions
- **Base tile**: 64×32 pixels (2:1 diamond ratio)
- **Size multipliers**:
  - Size 1 (pipe): 64×96px
  - Size 2 (house/tower/fortress/git-repo): 128×128px
  - Size 3 (castle/monorepo): 192×160px

### Isometric Angles
- Buildings have **THREE visible faces**: front, right side, and roof
- Front face angle: ~26.565° from horizontal
- Each isometric "block" is 32px wide × 16px tall in diamond shape
- Building height = vertical pixels above the base diamond

### Drawing Sequence
1. Draw isometric base (diamond footprint)
2. Draw right side face (darkest shade)
3. Draw front face (medium shade)
4. Draw windows/details on faces
5. Draw roof (lightest, with accent color)
6. Add unique identifying features

## Biome Color Palettes

Each repository sprite uses a theme-based color palette:

### Grass (Default - Node.js/JavaScript)
```
Primary:   #22c55e (main walls)
Secondary: #16a34a (shading/depth)
Accent:    #86efac (highlights/windows)
```

### Desert (Python)
```
Primary:   #fbbf24
Secondary: #f59e0b
Accent:    #fde68a
```

### Water (Database)
```
Primary:   #06b6d4
Secondary: #0891b2
Accent:    #67e8f9
```

### Volcano (Rust/Backend)
```
Primary:   #ef4444
Secondary: #dc2626
Accent:    #fca5a5
```

### Ice (Go/Microservices)
```
Primary:   #3b82f6
Secondary: #2563eb
Accent:    #dbeafe
```

## Repository Type Guidelines

### git-repo (Modern Office Building)
- **Height**: 24-36px above base
- **Characteristics**: Modern, clean lines
- **Color**: Blue (#3b82f6) regardless of theme
- **Features**:
  - 3×4 grid of windows (light blue)
  - Flat or peaked roof with orange accent (#f97316)
  - Single cohesive structure
- **Use for**: Single package git repositories

### monorepo (Cluster of Buildings)
- **Height**: Main building 32-40px, side buildings 24-28px
- **Characteristics**: Multiple connected structures
- **Color**: Purple (#8b5cf6) regardless of theme
- **Features**:
  - Main building + 2 smaller side buildings
  - Connecting bridges or shared base
  - 3 gold dots (#fbbf24) on roof = multiple packages
  - Visual variety showing different components
- **Use for**: Multi-package monorepos

### castle (Grand Fortress)
- **Height**: 40-52px tall
- **Characteristics**: Imposing, authoritative
- **Color**: Uses biome theme colors
- **Features**:
  - Crenellated walls (battlements)
  - Corner towers or turrets
  - Flag or banner on top
- **Use for**: Main/root packages, highly popular repos

### fortress (Large Complex)
- **Height**: 32-40px tall
- **Characteristics**: Defensive, industrial
- **Color**: Uses biome theme colors
- **Features**:
  - Thick walls
  - Multiple levels
  - Strong, boxy appearance
- **Use for**: Large important packages

### tower (Tall Specialized)
- **Height**: 36-44px tall
- **Characteristics**: Vertical emphasis, specialized
- **Color**: Uses biome theme colors
- **Features**:
  - Narrow footprint, tall height
  - Multiple floors indicated by horizontal lines
  - Distinctive top (antenna, dome, or spire)
- **Use for**: Special-purpose packages, tools

### house (Regular Building)
- **Height**: 20-28px tall
- **Characteristics**: Modest, residential
- **Color**: Uses biome theme colors
- **Features**:
  - Peaked or flat roof
  - Door at ground level
  - 2-4 windows
  - Simple, clean design
- **Use for**: Regular packages, libraries

### pipe (Entry Point)
- **Height**: 16-24px tall
- **Characteristics**: Simple, compact
- **Color**: Green (warp pipe style)
- **Features**:
  - Cylindrical appearance
  - Simple opening at top
  - Mario-style warp pipe aesthetic
- **Use for**: Entry points, minimal packages

## Distinctive Feature Patterns

Add visual elements that hint at the repository's purpose:

### By Technology/Purpose

**Frontend/UI Projects**
- Colorful multi-pane windows
- Modern glass-building aesthetic
- Bright accent colors
- Grid patterns

**Backend/API Projects**
- Server rack patterns
- Antenna/satellite dish
- Industrial appearance
- Darker, more utilitarian colors

**Database Projects**
- Boxy, storage-focused design
- Horizontal bands (storage layers)
- Vault-like appearance
- Cyan/blue water theme

**ML/AI Projects**
- Futuristic elements
- Glowing accents
- Neural network patterns
- Tech-forward appearance

**CLI Tools**
- Compact, efficient design
- Terminal-like grid patterns
- Monospace aesthetic
- Simple, functional

**Build Tools**
- Gears or cogs
- Smokestacks (processing)
- Industrial chimney
- Factory-like

**Documentation**
- Book-like appearance
- Library shelves pattern
- Scroll or paper elements
- Academic/scholarly look

### Feature Elements

**Windows** - For UI, frontend, user-facing projects
- Grid of small rectangles
- Light blue/accent color
- 3-4 rows × 3-4 columns

**Antenna** - For APIs, networking, real-time
- Thin vertical line from roof
- Red or gray tip
- Signal waves optional

**Flag** - For important/flagship repos
- Small triangular flag on pole
- Red or brand color
- Positioned at highest point

**Gears** - For utilities, build tools
- Circular gear shape
- Visible teeth
- Mechanical appearance

**Smokestacks** - For processing, build systems
- Vertical cylinders on roof
- Optional smoke particles
- Industrial feel

**Glowing elements** - For cutting-edge tech
- Bright accent color pixels
- Strategic placement
- Futuristic appearance

## Style Requirements Checklist

- [ ] **8-bit pixel art aesthetic** - No anti-aliasing, crisp edges
- [ ] **Limited color palette** - Only 3 biome colors + black/white/gray for details
- [ ] **Distinctive silhouette** - Recognizable at small size
- [ ] **Thematic details** - Reflects repository's purpose
- [ ] **Isometric projection** - Correct angles and perspective
- [ ] **Proper lighting** - Right side darker, roof lighter
- [ ] **Pixel-perfect edges** - Clean, sharp boundaries
- [ ] **Readable at scale** - Clear at both 100% and 50% zoom

## Technical Constraints

- **Maximum sprite size**: 256×256 pixels
- **Format**: PNG with transparency
- **Anti-aliasing**: Disabled (pixel-perfect rendering)
- **Color depth**: 8-bit compatible
- **Sprite anchoring**: Buildings use 61% horizontal, 45% vertical offset
