# Custom Building Sprite Guidelines

This document provides guidelines for creating custom building sprites for the Overworld Map panel.

## Image Specifications

### Dimensions
- **Recommended size:** 128×128 pixels
- **Maximum size:** 256×256 pixels (larger images will be scaled down automatically)
- **Aspect ratio:** Square (1:1) or close to it works best

### Format
- **File format:** PNG
- **Transparency:** Alpha channel supported and recommended
- **Color depth:** 24-bit RGB or 32-bit RGBA

## Visual Design

### Isometric Style
The overworld map uses an isometric (2.5D) visual style:
- Buildings should have a pseudo-3D appearance
- Front face should be visible
- Optional: Add a side face angling up and to the right for depth

### Footprint
- Buildings occupy a **2×2 tile footprint** on the map
- Each tile is 64×32 pixels in isometric view
- Your sprite should visually fit within this space

### Anchor Point
The sprite anchor (where the sprite is positioned) is at:
- **X: 0.61** (61% from left) - Slightly right of center to account for isometric depth
- **Y: 0.45** (45% from top) - Slightly above center to leave space for label below

**Design tip:** The visual center of your building should be at approximately (78px, 58px) in a 128×128 canvas.

## Style Recommendations

### 8-Bit Aesthetic
- Use pixel art or low-resolution graphics
- Limited color palettes work well
- Crisp edges (avoid anti-aliasing on small details)

### Building Characteristics
- Clear, recognizable silhouette
- Distinct from neighboring buildings
- Visible even at small sizes
- Good contrast against map background

### Examples
Good sprite characteristics:
- Office building: Rectangular with visible windows
- Factory: Industrial with smokestacks
- Repository: Modern tech building with glass facades
- Monorepo: Cluster of connected buildings

## Technical Details

### File Location
Custom sprites should be accessible via URL:
- Local: `/assets/sprites/my-building.png`
- Remote: `https://example.com/sprites/my-building.png`
- GitHub: `https://raw.githubusercontent.com/user/repo/main/sprites/building.png`

### Configuration
Add to your project configuration:

```typescript
{
  id: 'my-project',
  name: 'My Project',
  customSprite: '/assets/sprites/my-building.png',
  // ... other fields
}
```

### Automatic Scaling
If your sprite exceeds 128×128 pixels:
- It will be automatically scaled down proportionally
- Aspect ratio is preserved
- Maximum dimensions: 256×256 before scaling

## Testing Your Sprite

1. View in Storybook at different zoom levels
2. Check hover highlight alignment (should create a border around the building)
3. Verify label positioning below the building
4. Test with multiple sprites side-by-side

## Common Issues

### Sprite appears offset
- Check that the visual center is where the anchor point expects it
- Ensure isometric side faces angle up-right, not down-right

### Label too close/far from building
- Adjust vertical centering of your building within the canvas
- Leave empty space at the bottom for the label

### Sprite looks blurry
- Use pixel-perfect dimensions (128×128 exactly)
- Avoid fractional pixel positions in your artwork
- Use nearest-neighbor scaling if resizing

## Examples

See the default procedurally generated buildings for reference:
- `src/panels/overworld-map/spriteGenerator.ts`
- Building types: house, tower, castle, pipe, git-repo, monorepo
