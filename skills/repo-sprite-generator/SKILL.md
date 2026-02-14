---
name: repo-sprite-generator
description: Generate custom isometric 8-bit pixel art sprites for repositories using AI image generation APIs (DALL-E, Stable Diffusion). Use when users want to (1) create a custom sprite for a repository, (2) generate a unique visual representation of a codebase, or (3) replace the default procedural sprites with AI-generated artwork. The sprite is stored in the repository and can be loaded by the overworld map system.
---

# Repository Sprite Generator

## Overview

Generate custom isometric pixel art sprites using AI image generation that visually represent a repository's purpose, technology stack, and characteristics. Uses APIs like OpenAI's DALL-E to create unique 8-bit style building sprites following the overworld map's aesthetic guidelines.

**Prerequisites**: OpenAI API key (set `OPENAI_API_KEY` environment variable)

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

Run the API-based generator script:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Generate sprite using DALL-E
node skills/repo-sprite-generator/scripts/generate_sprite_api.js sprite-metadata.json assets/repo-sprite.png
```

This calls the OpenAI DALL-E API to generate a unique pixel art sprite. The script will:
1. Build a detailed prompt based on the metadata
2. Call DALL-E 3 to generate the image
3. Download and save it to the output path

**Note**: DALL-E 3 generates 1024x1024 images. You may need to crop/resize to 128x128 if desired.

### 4. Store the Sprite

Place the generated sprite in the repository at one of these locations:

**Primary location** (recommended):
```
assets/repo-sprite.png
```

**Alternative locations:**
```
.claude/repo-sprite.png
.github/repo-sprite.png
```

Optionally, keep the metadata file alongside it:
```
assets/repo-sprite.json
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
4. Purpose: "full-stack monorepo with React apps and shared UI components"
5. Generate with DALL-E → unique cluster of connected buildings in green theme

**Rust CLI tool:**
1. Cargo.toml, single package → type: `tower`
2. Rust → theme: `volcano`
3. CLI utility → features: `["gears"]`
4. Purpose: "command-line tool for code analysis and linting"
5. Generate with DALL-E → tall red tower with mechanical details

**Express.js API (popular):**
1. 3000+ stars → type: `fortress`
2. Backend API → theme: `volcano`
3. API service → features: `["antenna", "flag"]`
4. Purpose: "REST API framework for Node.js"
5. Generate with DALL-E → large fortification with antenna and flag

## Alternative: Procedural Generation (Fallback)

If you don't have access to image generation APIs, there's a fallback procedural generator:

```bash
cd skills/repo-sprite-generator/scripts
npm install  # Installs canvas dependency
node generate_sprite.js /path/to/metadata.json /path/to/output.png
```

This creates basic procedural sprites but they won't be as unique or distinctive as AI-generated ones.

## Advanced: Customizing the Prompt

The AI-generated sprites are based on carefully crafted prompts. To customize or improve results:

1. Read **references/image-generation-prompt.md** for the complete prompt template
2. Modify `scripts/generate_sprite_api.js` in the `buildPrompt()` function
3. Add more specific details about the repository's visual characteristics
4. Experiment with different feature combinations

You can also add a `purpose` field to the metadata JSON to give the AI more context:

```json
{
  "repositoryType": "tower",
  "theme": "grass",
  "size": 2,
  "features": ["windows"],
  "purpose": "TypeScript visualization library for rendering interactive panels"
}
```

## Troubleshooting

**API key error:**
```bash
export OPENAI_API_KEY="sk-your-key-here"
# Or add to ~/.bashrc or ~/.zshrc
```

**Generated sprite doesn't look pixel-art enough:**
- The prompt emphasizes pixel art, but DALL-E 3 sometimes adds smooth shading
- Try regenerating (each call produces different results)
- Consider using the procedural fallback generator for guaranteed pixel-perfect results
- Or use Stable Diffusion with a pixel-art specific model via Replicate

**Wrong colors or style:**
- Verify the metadata JSON has the correct theme
- Check that features array matches the repository's purpose
- Review and adjust the prompt in `generate_sprite_api.js`

**Image too large (1024x1024):**
- DALL-E 3 requires 1024x1024 minimum
- Use imagemagick or similar to resize: `convert sprite.png -resize 128x128 sprite-small.png`
- The overworld map system can handle any size, but smaller is more performant

## References

- **references/sprite-style-guide.md** - Complete visual style specifications, color palettes, and building types
- **references/analysis-guide.md** - Detailed repository analysis decision matrix and examples
- **references/image-generation-prompt.md** - Full prompt template and customization guide for AI generation
