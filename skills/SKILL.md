---
name: repo-sprite-generator
description: Generate custom isometric 8-bit pixel art sprites for repositories in the overworld map visualization. Use when users want to (1) create a custom sprite for a repository, (2) generate a visual representation of a codebase, or (3) replace the default procedural sprites with repository-specific artwork. The sprite is stored in the repository and can be loaded by the overworld map system.
---

# Repository Sprite Generator

## Overview

Generate custom isometric pixel art sprites that visually represent a repository's purpose, technology stack, and characteristics. Creates 8-bit style building sprites following the overworld map's aesthetic guidelines.

## Workflow

### 1. Analyze the Repository

First, explore the repository to understand its characteristics:

**Check for monorepo structure:**
```bash
find . -maxdepth 3 -name "package.json" | wc -l  # Multiple = monorepo
ls packages/ workspaces/ apps/ libs/ 2>/dev/null  # Monorepo directories
```

Use Glob to find configuration files:
- `package.json` → Node.js/JavaScript
- `Cargo.toml` → Rust
- `go.mod` → Go
- `setup.py` or `requirements.txt` → Python
- `composer.json` → PHP

Read the README.md to understand:
- Project purpose and description
- Main features
- Technology stack

**Determine repository type** (see references/analysis-guide.md for full decision matrix):
- `monorepo` - Multiple packages (size: 3)
- `castle` - Very popular/important (>5k stars, size: 3)
- `fortress` - Large important package (1k-5k stars, size: 2)
- `tower` - Specialized tool/CLI (size: 2)
- `house` - Standard library (size: 2)
- `git-repo` - Default single package (size: 2)
- `pipe` - Minimal/entry point (size: 1)

**Determine theme** (biome):
- `grass` - Node.js/JavaScript/TypeScript (default)
- `desert` - Python
- `water` - Database/data storage
- `volcano` - Rust/backend/systems
- `ice` - Go/microservices

**Identify visual features:**
- `windows` - Frontend/UI projects
- `antenna` - API/networking services
- `flag` - Flagship/popular repositories
- `gears` - Build tools/utilities
- `smokestack` - Compilers/processors

For detailed analysis guidance, read references/analysis-guide.md.

### 2. Create Metadata JSON

Write the sprite configuration to a temporary file:

```json
{
  "repositoryName": "my-awesome-repo",
  "repositoryType": "git-repo",
  "theme": "grass",
  "size": 2,
  "features": ["windows", "antenna"]
}
```

Save this as `sprite-metadata.json` in the repository root.

### 3. Generate the Sprite

Install dependencies and run the generator script:

```bash
# Navigate to skill scripts directory
cd /Users/griever/.claude/skills/repo-sprite-generator/scripts

# Install dependencies (first time only)
npm install

# Generate sprite
node generate_sprite.js /path/to/repo/sprite-metadata.json /path/to/repo/.claude/repo-sprite.png
```

This creates an isometric pixel art PNG sprite following the style guidelines.

### 4. Store the Sprite

Place the generated sprite in the repository at one of these locations:

**Primary location** (recommended):
```
.claude/repo-sprite.png
```

**Alternative locations:**
```
assets/repo-sprite.png
.github/repo-sprite.png
```

Optionally, keep the metadata file alongside it:
```
.claude/repo-sprite.json
```

### 5. Verify the Sprite

Open the generated PNG to ensure:
- Correct size (128×128 for size 2, 192×160 for size 3)
- Appropriate colors for the theme
- Features are visible
- Isometric perspective looks correct
- Readable at different scales

## Style Guidelines

The sprite must follow the 8-bit isometric aesthetic. Key requirements:

- **Isometric projection**: 64×32 pixel diamond tiles, correct angles
- **Limited palette**: 3 colors per theme + black/white/gray for details
- **Pixel-perfect**: No anti-aliasing, crisp edges
- **Distinctive**: Recognizable purpose/technology at small size

For complete style specifications, read references/sprite-style-guide.md.

## Example Workflows

**Frontend React monorepo:**
1. Detect multiple packages → type: `monorepo`
2. TypeScript + React → theme: `grass`
3. Frontend focus → features: `["windows"]`
4. Generate with size: `3`

**Rust CLI tool:**
1. Cargo.toml, single package → type: `tower`
2. Rust → theme: `volcano`
3. CLI utility → features: `["gears"]`
4. Generate with size: `2`

**Express.js API (popular):**
1. 3000+ stars → type: `fortress`
2. Backend API → theme: `volcano`
3. API service → features: `["antenna", "flag"]`
4. Generate with size: `2`

## Troubleshooting

**Script fails with "canvas" module error:**
```bash
cd scripts && npm install canvas
```

**Sprite looks wrong:**
- Review metadata JSON parameters
- Check references/sprite-style-guide.md for type specifications
- Verify theme colors are appropriate
- Adjust features array

**Need custom modifications:**
Read and modify `scripts/generate_sprite.js` to add new building types or features.

## References

- **references/sprite-style-guide.md** - Complete visual style specifications, color palettes, and building types
- **references/analysis-guide.md** - Detailed repository analysis decision matrix and examples
