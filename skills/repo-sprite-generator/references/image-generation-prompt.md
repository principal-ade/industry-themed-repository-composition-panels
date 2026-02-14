# Image Generation Prompt Template

This template is used to generate repository sprites using AI image generation APIs (DALL-E, Stable Diffusion, etc.).

## Base Prompt Structure

```
Create an isometric pixel art sprite in 8-bit retro NES style. The sprite should be [BUILDING_TYPE_DESCRIPTION].

Style Requirements:
- 8-bit pixel art aesthetic with crisp, clean edges (no anti-aliasing)
- Isometric 2.5D projection showing front face and right side face
- Limited color palette using [THEME_COLOR] theme colors: [PRIMARY] (main), [SECONDARY] (shading), [ACCENT] (highlights)
- Size: 128x128 pixels on transparent background
- Building should be centered in the canvas

Building Details:
[TYPE-SPECIFIC_DETAILS]

[FEATURE-SPECIFIC_DETAILS]

[OPTIONAL_PURPOSE_DESCRIPTION]

Important: The sprite MUST be pixel-perfect 8-bit style with no gradients or smooth shading. Use only solid colors from the palette. The isometric perspective should show the front face as a rectangle and the right side as a parallelogram going up and to the right.
```

## Variable Substitutions

### [BUILDING_TYPE_DESCRIPTION]

- **git-repo**: "a modern glass office building with a grid of windows, representing a single-package repository"
- **monorepo**: "a cluster of 2-3 connected buildings with bridges between them, representing multiple packages in one repository"
- **castle**: "a grand fortress with towers and battlements, representing a major/flagship repository"
- **fortress**: "a large defensive fortification, representing an important infrastructure library"
- **tower**: "a tall, narrow building with multiple floors and distinctive top, representing a specialized tool or utility"
- **house**: "a modest residential building with peaked roof, representing a standard library or package"
- **pipe**: "a simple green warp pipe (Mario-style), representing a minimal entry point package"

### [THEME_COLOR] and Color Palettes

- **grass** (Node.js/JavaScript): green - `#22c55e` (primary), `#16a34a` (secondary), `#86efac` (accent)
- **desert** (Python): yellow/orange - `#fbbf24` (primary), `#f59e0b` (secondary), `#fde68a` (accent)
- **water** (Database): cyan/blue - `#06b6d4` (primary), `#0891b2` (secondary), `#67e8f9` (accent)
- **volcano** (Rust/Backend): red/orange - `#ef4444` (primary), `#dc2626` (secondary), `#fca5a5` (accent)
- **ice** (Go/Microservices): light blue - `#3b82f6` (primary), `#2563eb` (secondary), `#dbeafe` (accent)

### [TYPE-SPECIFIC_DETAILS]

**Tower:**
```
- Tall (40px height), narrow structure (24px width)
- Multiple distinct floors (4 levels) indicated by horizontal dividing lines
- Flat or distinctive roof cap at the top
```

**Monorepo:**
```
- Main building 40px tall, with two smaller connected buildings (28px and 24px tall)
- Three small gold dots on the main building's roof representing multiple packages
- Connected with bridges or shared foundation
```

**Castle:**
```
- Large central structure 44px tall with crenellated battlements
- Two corner towers 52px tall
- Imposing, authoritative appearance
```

**Git-Repo:**
```
- Modern office building 36px tall
- Blue glass appearance (#3b82f6)
- Orange accent stripe on roof (#f97316)
- Grid of windows (3 columns × 4 rows)
```

**Fortress:**
```
- Large boxy structure 32px tall, 40px wide
- Thick walls with battlement details on top
- Industrial, defensive appearance
```

**House:**
```
- Modest building 24px tall, 28px wide
- Peaked roof (triangular)
- Simple door at ground level
```

**Pipe:**
```
- Cylindrical green pipe 20px tall
- Mario-style warp pipe aesthetic
- Dark opening at top
- Rim detail around opening
```

### [FEATURE-SPECIFIC_DETAILS]

Add based on features array:

- **windows**: "Multiple windows arranged in a grid pattern on the front face, colored [ACCENT_COLOR]"
- **antenna**: "Antenna or satellite dish on the roof for API/networking functionality"
- **flag**: "Small red flag on a pole at the highest point"
- **gears**: "Visible gears or mechanical elements indicating build/automation tools"
- **smokestack**: "Industrial smokestack or chimney on the roof indicating processing/compilation"

### [PURPOSE_DESCRIPTION]

Optional context about the repository's actual purpose, derived from:
- README.md description
- Primary language and frameworks
- Package.json description
- Main features

Examples:
- "a React component library for building user interfaces"
- "a Python machine learning framework for neural networks"
- "a Rust-based CLI tool for code analysis"
- "a full-stack TypeScript monorepo with Next.js apps"

## Example Complete Prompts

### Example 1: Tower (TypeScript Visualization Tool)

```
Create an isometric pixel art sprite in 8-bit retro NES style. The sprite should be a tall, narrow building with multiple floors and distinctive top, representing a specialized tool or utility.

Style Requirements:
- 8-bit pixel art aesthetic with crisp, clean edges (no anti-aliasing)
- Isometric 2.5D projection showing front face and right side face
- Limited color palette using green theme colors: #22c55e (main), #16a34a (shading), #86efac (highlights)
- Size: 128x128 pixels on transparent background
- Building should be centered in the canvas

Building Details:
- Tall (40px height), narrow structure (24px width)
- Multiple distinct floors (4 levels) indicated by horizontal dividing lines
- Flat or distinctive roof cap at the top
- Multiple windows arranged in a grid pattern on the front face, colored #86efac

The building should visually represent: a TypeScript visualization library for rendering interactive panel extensions with PixiJS graphics

Important: The sprite MUST be pixel-perfect 8-bit style with no gradients or smooth shading. Use only solid colors from the palette. The isometric perspective should show the front face as a rectangle and the right side as a parallelogram going up and to the right.
```

### Example 2: Monorepo (Full-Stack Project)

```
Create an isometric pixel art sprite in 8-bit retro NES style. The sprite should be a cluster of 2-3 connected buildings with bridges between them, representing multiple packages in one repository.

Style Requirements:
- 8-bit pixel art aesthetic with crisp, clean edges (no anti-aliasing)
- Isometric 2.5D projection showing front face and right side face
- Limited color palette using green theme colors: #22c55e (main), #16a34a (shading), #86efac (highlights)
- Size: 128x128 pixels on transparent background
- Building should be centered in the canvas

Building Details:
- Main building 40px tall (purple #8b5cf6), with two smaller connected buildings (28px and 24px tall)
- Three small gold dots (#fbbf24) on the main building's roof representing multiple packages
- Connected with bridges or shared foundation
- Multiple windows arranged in a grid pattern on the front face

The building should visually represent: a full-stack monorepo with React frontend apps and Node.js backend services

Important: The sprite MUST be pixel-perfect 8-bit style with no gradients or smooth shading. Use only solid colors from the palette. The isometric perspective should show the front face as a rectangle and the right side as a parallelogram going up and to the right.
```

## Tips for Better Results

1. **Be specific about dimensions**: Include pixel measurements to help the model understand scale
2. **Emphasize pixel art style**: Mention "no anti-aliasing", "crisp edges", "8-bit" multiple times
3. **Specify exact colors**: Use hex codes rather than color names when possible
4. **Describe the isometric view**: Clearly explain front face + side face perspective
5. **Add purpose context**: Including what the repository does helps create relevant visual metaphors
6. **Request transparency**: Explicitly ask for transparent background
7. **Limit the palette**: Stress that only 3-4 colors should be used for authentic pixel art look

## API Providers

### DALL-E 3 (OpenAI)
- **Pros**: High quality, good at following complex prompts, understands pixel art
- **Cons**: Minimum 1024x1024 size (need to crop/resize), costs per image
- **Best for**: High-quality sprites with distinctive character

### Stable Diffusion (via Replicate)
- **Pros**: Open source, can fine-tune for pixel art, cheaper
- **Cons**: May need specific pixel art model/LoRA, more prompt engineering
- **Best for**: Batch generation, custom styling

### Ideogram
- **Pros**: Very good at pixel art and retro game graphics
- **Cons**: Newer service, API availability may vary
- **Best for**: Authentic 8-bit/16-bit sprites
