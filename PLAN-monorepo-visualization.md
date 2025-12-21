# Plan: Monorepo Root-Level Detection Visualization

**Date**: 2025-12-21
**Related**: `@principal-ai/codebase-composition` monorepo detection feature

## Overview

The `@principal-ai/codebase-composition` library now detects:
- Monorepo orchestrators (Turbo, Nx, Lerna, pnpm, Rush)
- Root-level configs that propagate to workspace packages
- Inherited vs local configuration files
- Task definitions from orchestrator configs (turbo.json, nx.json)

This document outlines UI changes needed to visualize these features in the PackageCompositionPanel.

---

## New Types from codebase-composition

```typescript
// ConfigFile now includes inheritance tracking
interface ConfigFile {
  path: string;
  exists: boolean;
  type: 'json' | 'yaml' | 'toml' | 'js' | 'ts' | 'ini' | 'custom';
  isInline?: boolean;
  inlineField?: string;
  // NEW: Inheritance tracking
  isInherited?: boolean;
  inheritedFrom?: string;
  inheritanceType?: 'root' | 'parent' | 'explicit';
}

// NEW: Monorepo orchestrator types
type MonorepoOrchestrator = 'turbo' | 'nx' | 'lerna' | 'pnpm' | 'rush' | 'none';

// NEW: Monorepo metadata (on root package only)
interface MonorepoMetadata {
  orchestrator: MonorepoOrchestrator;
  orchestratorConfigPath?: string;
  workspacePatterns?: string[];
  definedTasks?: {
    name: string;
    tool?: string;
    filter?: string;
  }[];
  rootConfigs?: {
    tool: string;
    configPath: string;
    isInline?: boolean;
  }[];
}

// PackageLayer.packageData now includes:
packageData: {
  // ...existing fields
  monorepoMetadata?: MonorepoMetadata;  // Only on root packages
}
```

---

## UI Changes

### Phase 1: Types + Orchestrator Badge

**Goal**: Show which orchestrator manages the monorepo

1. **Clean up types** - Import from `@principal-ai/codebase-composition` instead of duplicating
2. **Create `OrchestratorBadge` component**
   - Shows: Turbo, Nx, Lerna, pnpm, Rush icon/label
   - Location: PackageSummaryCard header (for root packages only)

**Visual**:
```
┌─────────────────────────────────────────────┐
│ my-monorepo                    [⚡ Turbo]   │
│ Root Package                                │
└─────────────────────────────────────────────┘
```

### Phase 2: Root Configs Display

**Goal**: Show which configs are defined at root and will propagate

1. **Create `RootConfigsSection` component**
   - Collapsible section in root package detail view
   - Lists configs that apply to all workspace packages
   - Shows if inline (in package.json) or file-based

**Visual**:
```
┌─ Root Configurations ───────────────────────┐
│ These configs apply to all workspace packages│
│                                              │
│ ✓ prettier (package.json inline)             │
│ ✓ eslint (.eslintrc.json)                    │
│ ✓ typescript (tsconfig.base.json)            │
└──────────────────────────────────────────────┘
```

### Phase 3: Inheritance Indicators

**Goal**: Show workspace packages which configs they inherit

1. **Create `InheritedConfigIndicator` component**
   - Badge/icon showing "inherits from root"
   - Location: PackageSummaryCard for workspace packages

2. **Update config count display**
   - Show "2 local + 3 inherited" instead of just "5 configs"

**Visual**:
```
┌─────────────────────────────────────────────┐
│ @scope/utils                                │
│ packages/utils                              │
├─────────────────────────────────────────────┤
│ [↓ Inherits: prettier, eslint, typescript]  │
├─────────────────────────────────────────────┤
│ 5 deps  |  2+3 configs  |  4 commands       │
│           local↑ ↑inherited                 │
└─────────────────────────────────────────────┘
```

### Phase 4: Full Config Panel

**Goal**: Dedicated view for all configuration files

1. **Create `ConfigFilesSection` component**
   - Either new tab in PackageCard OR collapsible section
   - Groups: Local Configs vs Inherited Configs
   - Shows source path for inherited configs

**Visual**:
```
┌─ Configuration ─────────────────────────────┐
│ Local Configs                               │
│   ✓ tsconfig.json                           │
│   ✓ jest.config.js                          │
│                                             │
│ Inherited from Root                         │
│   ↳ prettier (package.json)                 │
│   ↳ eslint (.eslintrc.json)                 │
│   ↳ typescript (tsconfig.base.json)         │
└─────────────────────────────────────────────┘
```

### Phase 5: Monorepo Tasks Display

**Goal**: Show tasks defined in turbo.json/nx.json

1. **Create `MonorepoTasksSection` component**
   - Only visible on root package
   - Shows task name, inferred tool, and any filters

**Visual**:
```
┌─ Monorepo Tasks (from turbo.json) ──────────┐
│ lint        → eslint                        │
│ typecheck   → typescript                    │
│ test        → jest                          │
│ build       → (build)                       │
│ opencode#test → jest (filtered)             │
└─────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
PackageCompositionPanel
├── PackageSummaryCard
│   ├── OrchestratorBadge (root only)        ← NEW
│   ├── InheritedConfigIndicator (workspace) ← NEW
│   └── Stats row (updated config count)
│
└── PackageCard (detail view)
    ├── Dependencies Tab (existing)
    ├── Lenses Tab (existing)
    └── [Configuration display]              ← NEW
        ├── RootConfigsSection (root only)
        ├── ConfigFilesSection
        └── MonorepoTasksSection (root only)
```

---

## Suggested Icons (Lucide React)

| Feature | Icon | Usage |
|---------|------|-------|
| Turbo | `Zap` | OrchestratorBadge |
| Nx | `Box` | OrchestratorBadge |
| Lerna | `Boxes` | OrchestratorBadge |
| pnpm | `Package` | OrchestratorBadge |
| Inherited config | `ArrowDownFromLine` | InheritedConfigIndicator |
| Local config | `FileCode` | ConfigFilesSection |
| Root configs | `FolderRoot` | RootConfigsSection |
| Tasks | `ListTodo` | MonorepoTasksSection |

---

## Color Scheme (using theme)

| Element | Color |
|---------|-------|
| Orchestrator badge | `theme.colors.primary` |
| Inherited config badge | `theme.colors.accent` + 20% opacity |
| Local config | `theme.colors.success` |
| Root indicator | `theme.colors.warning` |

---

## Implementation Order

1. **Phase 1** - Foundation
   - [ ] Clean up types (import from codebase-composition)
   - [ ] Create OrchestratorBadge component
   - [ ] Add to PackageSummaryCard for root packages

2. **Phase 2** - Root visibility
   - [ ] Create RootConfigsSection component
   - [ ] Add to root package detail view

3. **Phase 3** - Inheritance indicators
   - [ ] Create InheritedConfigIndicator component
   - [ ] Update config count in PackageSummaryCard
   - [ ] Add to workspace package cards

4. **Phase 4** - Config details
   - [ ] Create ConfigFilesSection component
   - [ ] Add to PackageCard (new section or tab)

5. **Phase 5** - Tasks
   - [ ] Create MonorepoTasksSection component
   - [ ] Add to root package detail view

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/composition.ts` | Import types from codebase-composition instead of duplicating |
| `src/panels/PackageCompositionPanel.tsx` | Integrate new components |
| `src/panels/components/PackageSummaryCard.tsx` | Add orchestrator badge, inheritance indicator |
| `src/panels/components/PackageCard.tsx` | Add config section/tab |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/panels/components/OrchestratorBadge.tsx` | Turbo/Nx/Lerna badge |
| `src/panels/components/RootConfigsSection.tsx` | Root config list |
| `src/panels/components/InheritedConfigIndicator.tsx` | Inheritance badge |
| `src/panels/components/ConfigFilesSection.tsx` | Full config display |
| `src/panels/components/MonorepoTasksSection.tsx` | Task list from orchestrator |

---

## Testing

Update Storybook stories to include:
- Monorepo with Turbo orchestrator
- Root package with propagating configs
- Workspace package with inherited configs
- Package with mixed local + inherited configs
