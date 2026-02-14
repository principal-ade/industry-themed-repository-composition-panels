# Repository Analysis Guide

Guide for analyzing repositories to determine appropriate sprite characteristics.

## Analysis Workflow

1. **Explore the repository structure**
2. **Identify key characteristics**
3. **Map to sprite parameters**
4. **Generate metadata JSON**
5. **Run sprite generation script**

## Step 1: Repository Exploration

Use these tools to understand the repository:

**File structure analysis:**
```bash
# Look for package files
ls -la  # Check root directory
find . -name "package.json" -o -name "Cargo.toml" -o -name "go.mod" -o -name "setup.py"

# Check for monorepo indicators
ls packages/ workspaces/ apps/ libs/  # Common monorepo structures
cat package.json | grep -E "workspaces|lerna|nx|turbo"
```

**Technology detection:**
- Use Glob to find config files: `package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, `Dockerfile`
- Use Read to examine `README.md` for project description
- Use Grep to search for key technologies and frameworks

**Purpose identification:**
- Read the README.md introduction
- Check the package.json "description" field
- Look at main entry points (src/, lib/, cmd/)
- Review dependencies for clues about purpose

## Step 2: Identify Key Characteristics

### Repository Type Determination

**Indicators for `monorepo` (size: 3):**
- Multiple `package.json` files in subdirectories
- `workspaces` field in root package.json
- Directories like `packages/`, `apps/`, `libs/`
- Presence of Lerna, Nx, Turbo, pnpm workspaces

**Indicators for `castle` (size: 3):**
- Very high GitHub stars (>5000)
- Root/main package in an ecosystem
- Framework or platform (React, Vue, Express, etc.)
- Widespread adoption indicators

**Indicators for `fortress` (size: 2):**
- High GitHub stars (1000-5000)
- Large codebase (many files/directories)
- Important infrastructure library
- Production-critical dependency

**Indicators for `tower` (size: 2):**
- Specialized single purpose
- Tool or utility focus
- CLI application
- Unique/distinctive functionality

**Indicators for `house` (size: 2):**
- Standard library or package
- Moderate scope
- General-purpose utility
- Regular npm/cargo/pip package

**Indicators for `git-repo` (size: 2):**
- Single package repository
- Not clearly fitting other categories
- Standard application or library
- Default choice for single-package repos

**Indicators for `pipe` (size: 1):**
- Entry point or minimal package
- Wrapper or proxy
- Simple configuration
- Very small scope

### Theme (Biome) Determination

**grass** - Default, Node.js ecosystem
- JavaScript/TypeScript projects
- package.json with Node.js dependencies
- Frontend frameworks (React, Vue, Svelte)
- General-purpose projects

**desert** - Python ecosystem
- setup.py or requirements.txt
- Python package
- Data science/ML libraries (if not cutting-edge)

**water** - Database and data storage
- Database projects (PostgreSQL, MongoDB, Redis)
- Data processing tools
- Storage systems
- Anything data-persistence focused

**volcano** - Systems programming, high-performance
- Rust (Cargo.toml)
- Backend/API services
- Performance-critical code
- Low-level systems

**ice** - Go and microservices
- go.mod present
- Microservice architecture
- Kubernetes/Docker focused
- Cloud-native applications

### Feature Identification

**windows** - Add for:
- Frontend/UI projects
- Web applications
- User-facing tools
- Visual/interactive software

**antenna** - Add for:
- API services
- Real-time applications
- Networking tools
- Communication systems

**flag** - Add for:
- Flagship/main repositories
- High-star projects
- Framework or platform repos
- Organizational standards

**gears** - Add for:
- Build tools (webpack, vite, rollup)
- Task runners
- Automation utilities
- DevOps tools

**smokestack** - Add for:
- Compilers
- Bundlers
- Processing pipelines
- Build systems

## Step 3: Map to Sprite Parameters

Create a metadata JSON structure:

```json
{
  "repositoryName": "extracted-from-package-or-dirname",
  "repositoryType": "git-repo|monorepo|castle|fortress|tower|house|pipe",
  "theme": "grass|desert|water|volcano|ice",
  "size": 2,
  "features": ["windows", "antenna", "flag"]
}
```

### Decision Matrix

| Characteristic | Type | Theme | Size | Features |
|----------------|------|-------|------|----------|
| Monorepo workspace | monorepo | varies | 3 | windows |
| >5000 stars | castle | varies | 3 | flag |
| 1000-5000 stars | fortress | varies | 2 | flag |
| CLI tool | tower | varies | 2 | gears |
| Frontend app | git-repo | grass | 2 | windows |
| Backend API | git-repo | volcano | 2 | antenna |
| Database | fortress | water | 2 | - |
| Python lib | house | desert | 2 | - |
| Go service | tower | ice | 2 | antenna |
| Rust systems | fortress | volcano | 2 | gears |
| Build tool | tower | grass | 2 | gears, smokestack |

## Step 4: Generate Metadata JSON

Example decision process:

**Repository**: A TypeScript monorepo with React apps and shared libraries

Analysis:
- Has `packages/` directory with multiple package.json files → **monorepo**
- TypeScript + React → **grass** theme
- Monorepo always size **3**
- Frontend focus → **windows** feature

```json
{
  "repositoryName": "my-monorepo",
  "repositoryType": "monorepo",
  "theme": "grass",
  "size": 3,
  "features": ["windows"]
}
```

**Repository**: A Rust CLI tool for code analysis

Analysis:
- Cargo.toml present → Rust project
- Single package → Not monorepo
- CLI tool → **tower** type
- Rust → **volcano** theme
- Size **2** (standard for tower)
- Utility tool → **gears** feature

```json
{
  "repositoryName": "code-analyzer",
  "repositoryType": "tower",
  "theme": "volcano",
  "size": 2,
  "features": ["gears"]
}
```

**Repository**: Express.js REST API with high stars

Analysis:
- Node.js backend → grass or volcano theme
- API service → **antenna** feature
- Popular (3000 stars) → **fortress** type
- Backend API → **volcano** theme
- Size **2**

```json
{
  "repositoryName": "express-api",
  "repositoryType": "fortress",
  "theme": "volcano",
  "size": 2,
  "features": ["antenna", "flag"]
}
```

## Step 5: Run Sprite Generation

Once metadata is created, execute the script:

```bash
# Ensure dependencies are installed
cd /path/to/skill/scripts
npm install

# Generate sprite
node generate_sprite.js metadata.json output.png
```

The script will create a PNG sprite at the specified output location.

## Storage Location

Store the generated sprite in the repository:

**Recommended locations:**
- `.claude/repo-sprite.png` - Dedicated Claude directory
- `assets/repo-sprite.png` - If assets directory exists
- `.github/repo-sprite.png` - GitHub-specific assets

**Metadata sidecar** (optional):
Create `repo-sprite.json` alongside the PNG with the metadata used to generate it.

## Quality Checks

After generation, verify:
- [ ] Sprite renders correctly (open PNG)
- [ ] Appropriate size (128×128 or 192×160)
- [ ] Colors match theme
- [ ] Features are visible and appropriate
- [ ] Isometric perspective looks correct
- [ ] Readable at 100% and 50% scale

## Common Patterns

**Full-stack monorepo**:
- Type: monorepo, Theme: grass, Size: 3, Features: ["windows"]

**Python ML library**:
- Type: house, Theme: desert, Size: 2, Features: []

**Go microservice**:
- Type: tower, Theme: ice, Size: 2, Features: ["antenna"]

**Rust systems tool**:
- Type: fortress, Theme: volcano, Size: 2, Features: ["gears"]

**React component library**:
- Type: house, Theme: grass, Size: 2, Features: ["windows"]

**Database system**:
- Type: fortress, Theme: water, Size: 2, Features: []

**Build tool/bundler**:
- Type: tower, Theme: grass, Size: 2, Features: ["gears", "smokestack"]
