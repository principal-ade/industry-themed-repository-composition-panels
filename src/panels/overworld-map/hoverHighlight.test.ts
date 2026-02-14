/**
 * Tests for hover highlight positioning and sprite footprint coverage
 */

import { describe, expect, test } from 'bun:test';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './isometricUtils';

describe('hoverHighlight', () => {
  describe('highlight diamond dimensions', () => {
    test('size 1 building (pipe) highlight matches base tile size', () => {
      const size = 1;
      const tileSize = ISO_TILE_WIDTH * size; // 64px
      const tileHeight = ISO_TILE_HEIGHT * size; // 32px

      // Highlight diamond vertices (centered at origin)
      const vertices = {
        top: { x: 0, y: -tileHeight / 2 }, // (0, -16)
        right: { x: tileSize / 2, y: 0 }, // (32, 0)
        bottom: { x: 0, y: tileHeight / 2 }, // (0, 16)
        left: { x: -tileSize / 2, y: 0 }, // (-32, 0)
      };

      // Verify dimensions
      const width = vertices.right.x - vertices.left.x; // 64
      const height = vertices.bottom.y - vertices.top.y; // 32

      expect(width).toBe(ISO_TILE_WIDTH * size);
      expect(height).toBe(ISO_TILE_HEIGHT * size);
    });

    test('size 2 building highlight matches base tile size', () => {
      const size = 2;
      const tileSize = ISO_TILE_WIDTH * size; // 128px
      const tileHeight = ISO_TILE_HEIGHT * size; // 64px

      // Highlight diamond vertices (centered at origin)
      const vertices = {
        top: { x: 0, y: -tileHeight / 2 }, // (0, -32)
        right: { x: tileSize / 2, y: 0 }, // (64, 0)
        bottom: { x: 0, y: tileHeight / 2 }, // (0, 32)
        left: { x: -tileSize / 2, y: 0 }, // (-64, 0)
      };

      // Verify dimensions
      const width = vertices.right.x - vertices.left.x; // 128
      const height = vertices.bottom.y - vertices.top.y; // 64

      expect(width).toBe(ISO_TILE_WIDTH * size);
      expect(height).toBe(ISO_TILE_HEIGHT * size);
    });

    test('size 3 building highlight matches base tile size', () => {
      const size = 3;
      const tileSize = ISO_TILE_WIDTH * size; // 192px
      const tileHeight = ISO_TILE_HEIGHT * size; // 96px

      const vertices = {
        top: { x: 0, y: -tileHeight / 2 }, // (0, -48)
        right: { x: tileSize / 2, y: 0 }, // (96, 0)
        bottom: { x: 0, y: tileHeight / 2 }, // (0, 48)
        left: { x: -tileSize / 2, y: 0 }, // (-96, 0)
      };

      const width = vertices.right.x - vertices.left.x;
      const height = vertices.bottom.y - vertices.top.y;

      expect(width).toBe(ISO_TILE_WIDTH * size);
      expect(height).toBe(ISO_TILE_HEIGHT * size);
    });
  });

  describe('highlight offset calculation', () => {
    test('size 1 building (pipe): offset does NOT align highlight with base diamond center', () => {
      const size = 1;
      const canvasHeight = ISO_TILE_HEIGHT * size + 64; // 96px
      const tileHeight = ISO_TILE_HEIGHT * size; // 32px

      // Sprite properties
      const spriteAnchorY = canvasHeight / 2; // 48px

      // Base diamond in sprite canvas
      const baseY = canvasHeight - ISO_TILE_HEIGHT * size; // 64px (top of diamond)
      const baseCenterY = baseY + tileHeight / 2; // 80px (center of diamond)

      // Highlight positioning with current formula
      const highlightOffset = tileHeight / 2; // 16px
      const highlightCenterY = spriteAnchorY + highlightOffset; // 48 + 16 = 64px

      // This demonstrates the problem for size 1!
      // Highlight center (64) does NOT align with base diamond center (80)
      // There's a 16px misalignment - highlight is too HIGH

      expect(highlightCenterY).toBe(64);
      expect(baseCenterY).toBe(80);
      expect(highlightCenterY).not.toBe(baseCenterY); // Misaligned!

      const misalignment = baseCenterY - highlightCenterY;
      expect(misalignment).toBe(16); // 16px too high
    });

    test('size 2 building: offset aligns highlight with base diamond center', () => {
      const size = 2;
      const canvasHeight = ISO_TILE_HEIGHT * size + 64; // 128px
      const tileHeight = ISO_TILE_HEIGHT * size; // 64px

      // Sprite properties
      const spriteAnchorY = canvasHeight / 2; // 64px

      // Base diamond in sprite canvas
      const baseY = canvasHeight - ISO_TILE_HEIGHT * size; // 64px (top of diamond)
      const baseCenterY = baseY + tileHeight / 2; // 96px (center of diamond)

      // Highlight positioning
      // Highlight is drawn centered at (0, 0), so when positioned at screenY,
      // its center is at screenY
      const highlightOffset = tileHeight / 2; // 32px
      const highlightCenterY = spriteAnchorY + highlightOffset; // 64 + 32 = 96px

      // Highlight center should align with base diamond center
      expect(highlightCenterY).toBe(baseCenterY);

      // Alternative verification: highlight at screenY + offset
      // Sprite anchor at canvas Y=64 (which is baseY, top of diamond)
      // Base diamond center is at baseY + 32 = 96
      // Highlight center is at screenY + 32 = 64 + 32 = 96
      expect(spriteAnchorY + highlightOffset).toBe(baseY + tileHeight / 2);
    });

    test('size 3 building: offset aligns highlight with base diamond center', () => {
      const size = 3;
      const canvasHeight = ISO_TILE_HEIGHT * size + 64; // 160px
      const tileHeight = ISO_TILE_HEIGHT * size; // 96px

      // Sprite properties
      const spriteAnchorY = canvasHeight / 2; // 80px

      // Base diamond in sprite canvas
      const baseY = canvasHeight - ISO_TILE_HEIGHT * size; // 64px (top of diamond)
      const baseCenterY = baseY + tileHeight / 2; // 64 + 48 = 112px (center of diamond)

      // Highlight positioning
      const highlightOffset = tileHeight / 2; // 48px
      const highlightCenterY = spriteAnchorY + highlightOffset; // 80 + 48 = 128px

      // This demonstrates the problem!
      // Highlight center (128) does NOT align with base diamond center (112)
      // There's a 16px misalignment for size 3 buildings

      expect(highlightCenterY).toBe(128);
      expect(baseCenterY).toBe(112);
      expect(highlightCenterY).not.toBe(baseCenterY); // Misaligned!

      const misalignment = highlightCenterY - baseCenterY;
      expect(misalignment).toBe(16); // 16px too low
    });

    test('correct offset should account for anchor position relative to base', () => {
      // For proper alignment, the offset should be:
      // offset = (baseCenterY - spriteAnchorY)

      // Size 1:
      const size1CanvasHeight = ISO_TILE_HEIGHT * 1 + 64; // 96
      const size1BaseY = 64;
      const size1TileHeight = ISO_TILE_HEIGHT * 1; // 32
      const size1BaseCenterY = size1BaseY + size1TileHeight / 2; // 80
      const size1SpriteAnchorY = size1CanvasHeight / 2; // 48

      const size1CorrectOffset = size1BaseCenterY - size1SpriteAnchorY; // 80 - 48 = 32
      expect(size1CorrectOffset).toBe(32);
      expect(size1CorrectOffset).not.toBe(size1TileHeight / 2); // Does NOT match current formula (16)!

      // Size 2:
      const size2CanvasHeight = ISO_TILE_HEIGHT * 2 + 64; // 128
      const size2BaseY = 64;
      const size2TileHeight = ISO_TILE_HEIGHT * 2; // 64
      const size2BaseCenterY = size2BaseY + size2TileHeight / 2; // 96
      const size2SpriteAnchorY = size2CanvasHeight / 2; // 64

      const size2CorrectOffset = size2BaseCenterY - size2SpriteAnchorY; // 96 - 64 = 32
      expect(size2CorrectOffset).toBe(32);
      expect(size2CorrectOffset).toBe(size2TileHeight / 2); // Matches current formula!

      // Size 3:
      const size3CanvasHeight = ISO_TILE_HEIGHT * 3 + 64; // 160
      const size3BaseY = 64;
      const size3TileHeight = ISO_TILE_HEIGHT * 3; // 96
      const size3BaseCenterY = size3BaseY + size3TileHeight / 2; // 112
      const size3SpriteAnchorY = size3CanvasHeight / 2; // 80

      const size3CorrectOffset = size3BaseCenterY - size3SpriteAnchorY; // 112 - 80 = 32
      expect(size3CorrectOffset).toBe(32);
      expect(size3CorrectOffset).not.toBe(size3TileHeight / 2); // Does NOT match current formula (48)!
    });
  });

  describe('sprite footprint coverage', () => {
    test('size 1 building (pipe): highlight does NOT cover full base diamond footprint', () => {
      const size = 1;
      const canvasHeight = ISO_TILE_HEIGHT * size + 64; // 96
      const baseY = 64;
      const tileHeight = ISO_TILE_HEIGHT * size; // 32

      // Sprite at screen position (100, 100)
      const screenY = 100;

      // Sprite anchor (0.5, 0.5) is at canvas center Y=48
      // So sprite's baseY is at screenY - 48 + 64 = 116

      // Base diamond bounds (in world coordinates)
      const spriteTopY = screenY - canvasHeight / 2; // 100 - 48 = 52
      const baseYWorld = spriteTopY + baseY; // 52 + 64 = 116
      const baseDiamondTop = baseYWorld; // 116
      const baseDiamondBottom = baseYWorld + tileHeight; // 148

      // Highlight positioning with current formula
      const highlightOffset = tileHeight / 2; // 16
      const highlightY = screenY + highlightOffset; // 116
      const highlightTop = highlightY - tileHeight / 2; // 100
      const highlightBottom = highlightY + tileHeight / 2; // 132

      // Verify misalignment
      expect(highlightTop).toBe(100);
      expect(baseDiamondTop).toBe(116);
      expect(highlightTop).not.toBe(baseDiamondTop); // Highlight starts 16px too high!

      expect(highlightBottom).toBe(132);
      expect(baseDiamondBottom).toBe(148);
      expect(highlightBottom).not.toBe(baseDiamondBottom); // Highlight ends 16px too high!

      // The bottom 16px of the base diamond is NOT highlighted
      const bottomGap = baseDiamondBottom - highlightBottom;
      expect(bottomGap).toBe(16);
    });

    test('size 2 building: highlight covers full base diamond footprint', () => {
      const size = 2;
      const canvasHeight = ISO_TILE_HEIGHT * size + 64; // 128
      const baseY = 64;
      const tileHeight = ISO_TILE_HEIGHT * size; // 64

      // Sprite at screen position (100, 100)
      const screenY = 100;

      // Sprite anchor (0.5, 0.5) is at canvas center Y=64
      // So sprite's baseY is at screenY = 100

      // Base diamond bounds (in world coordinates)
      const baseDiamondTop = screenY; // 100
      const baseDiamondBottom = screenY + tileHeight; // 164
      const baseDiamondCenter = screenY + tileHeight / 2; // 132

      // Highlight positioning (centered at origin, then positioned)
      const highlightOffset = tileHeight / 2; // 32
      const highlightY = screenY + highlightOffset; // 132
      const highlightTop = highlightY - tileHeight / 2; // 100
      const highlightBottom = highlightY + tileHeight / 2; // 164

      // Verify highlight covers base diamond
      expect(highlightTop).toBe(baseDiamondTop);
      expect(highlightBottom).toBe(baseDiamondBottom);
      expect(highlightY).toBe(baseDiamondCenter);
    });

    test('size 3 building: highlight does NOT cover full base diamond footprint', () => {
      const size = 3;
      const canvasHeight = ISO_TILE_HEIGHT * size + 64; // 160
      const baseY = 64;
      const tileHeight = ISO_TILE_HEIGHT * size; // 96

      // Sprite at screen position (100, 100)
      const screenY = 100;

      // Sprite anchor (0.5, 0.5) is at canvas center Y=80
      // So sprite's baseY is at screenY - 16 = 84

      // Base diamond bounds (in world coordinates)
      // Base starts at baseY in canvas, which is at screenY - (canvasHeight/2 - baseY)
      const spriteTopY = screenY - canvasHeight / 2; // 100 - 80 = 20
      const baseYWorld = spriteTopY + baseY; // 20 + 64 = 84
      const baseDiamondTop = baseYWorld; // 84
      const baseDiamondBottom = baseYWorld + tileHeight; // 180

      // Highlight positioning with current formula
      const highlightOffset = tileHeight / 2; // 48
      const highlightY = screenY + highlightOffset; // 148
      const highlightTop = highlightY - tileHeight / 2; // 100
      const highlightBottom = highlightY + tileHeight / 2; // 196

      // Verify misalignment
      expect(highlightTop).toBe(100);
      expect(baseDiamondTop).toBe(84);
      expect(highlightTop).not.toBe(baseDiamondTop); // Highlight starts 16px too low!

      expect(highlightBottom).toBe(196);
      expect(baseDiamondBottom).toBe(180);
      expect(highlightBottom).not.toBe(baseDiamondBottom); // Highlight ends 16px too low!

      // The top 16px of the base diamond is NOT highlighted
      const topGap = highlightTop - baseDiamondTop;
      expect(topGap).toBe(16);
    });

    test('correct offset formula for consistent coverage across sizes', () => {
      // The correct offset should be constant: 32px for all sizes
      // Because baseY is always 64, and we need to reach baseY + tileHeight/2 from sprite anchor

      const constantOffset = 32;

      // Size 1 verification
      const size1SpriteAnchorY = 48; // Canvas center
      const size1BaseY = 64;
      const size1TileHeight = 32;
      const size1BaseCenterY = size1BaseY + size1TileHeight / 2; // 80

      expect(size1SpriteAnchorY + constantOffset).toBe(size1BaseCenterY);

      // Size 2 verification
      const size2SpriteAnchorY = 64; // Canvas center
      const size2BaseY = 64;
      const size2TileHeight = 64;
      const size2BaseCenterY = size2BaseY + size2TileHeight / 2; // 96

      expect(size2SpriteAnchorY + constantOffset).toBe(size2BaseCenterY);

      // Size 3 verification
      const size3SpriteAnchorY = 80; // Canvas center
      const size3BaseY = 64;
      const size3TileHeight = 96;
      const size3BaseCenterY = size3BaseY + size3TileHeight / 2; // 112

      expect(size3SpriteAnchorY + constantOffset).toBe(size3BaseCenterY);
    });
  });

  describe('proposed fix', () => {
    test('using constant offset of 32 instead of tileHeight/2', () => {
      const CONSTANT_OFFSET = 32;

      // Size 1 (pipe)
      const size1 = 1;
      const size1TileHeight = ISO_TILE_HEIGHT * size1; // 32
      const size1CurrentOffset = size1TileHeight / 2; // 16 (WRONG)
      const size1ProposedOffset = CONSTANT_OFFSET; // 32 (CORRECT)

      expect(size1ProposedOffset).not.toBe(size1CurrentOffset);
      expect(size1ProposedOffset).toBe(32);
      expect(size1CurrentOffset).toBe(16);

      // Size 2
      const size2 = 2;
      const size2TileHeight = ISO_TILE_HEIGHT * size2; // 64
      const size2CurrentOffset = size2TileHeight / 2; // 32
      const size2ProposedOffset = CONSTANT_OFFSET; // 32

      expect(size2ProposedOffset).toBe(size2CurrentOffset); // Same for size 2

      // Size 3
      const size3 = 3;
      const size3TileHeight = ISO_TILE_HEIGHT * size3; // 96
      const size3CurrentOffset = size3TileHeight / 2; // 48 (WRONG)
      const size3ProposedOffset = CONSTANT_OFFSET; // 32 (CORRECT)

      expect(size3ProposedOffset).not.toBe(size3CurrentOffset);
      expect(size3ProposedOffset).toBe(32);
      expect(size3CurrentOffset).toBe(48);

      // The fix: use constant offset instead of tileHeight / 2
      // highlight.y = screenY + 32; (not screenY + tileHeight / 2)
    });

    test('alternative fix: calculate offset from base position', () => {
      // Alternative: calculate offset based on canvas structure
      // offset = baseY - (canvasHeight / 2) + tileHeight / 2

      // Size 1
      const size1CanvasHeight = 96;
      const size1BaseY = 64;
      const size1TileHeight = 32;
      const size1Offset = size1BaseY - size1CanvasHeight / 2 + size1TileHeight / 2;
      // = 64 - 48 + 16 = 32
      expect(size1Offset).toBe(32);

      // Size 2
      const size2CanvasHeight = 128;
      const size2BaseY = 64;
      const size2TileHeight = 64;
      const size2Offset = size2BaseY - size2CanvasHeight / 2 + size2TileHeight / 2;
      // = 64 - 64 + 32 = 32
      expect(size2Offset).toBe(32);

      // Size 3
      const size3CanvasHeight = 160;
      const size3BaseY = 64;
      const size3TileHeight = 96;
      const size3Offset = size3BaseY - size3CanvasHeight / 2 + size3TileHeight / 2;
      // = 64 - 80 + 48 = 32
      expect(size3Offset).toBe(32);

      // This formula correctly computes 32 for all sizes!
    });
  });
});
