# Design System Kit — Figma Plugin

A production Figma plugin that generates a complete, on-brand design system in one click: **design tokens**, **50+ production components**, linked **Figma styles and variables**, organized **pages**, plus **token export** (CSS, Tailwind, JSON, W3C DTCG) and a **usage scanner**.

## What it builds

- **Tokens** — color ramps (50–950) for primary / secondary / success / warning / danger / neutral, OKLCH gradients, type scales (Material / System / Custom), modular spacing, radius, and elevation (shadow) scales. Dark-mode counterparts are generated when enabled.
- **Styles & Variables** — Paint styles and Figma Variables for every shade and semantic token, Text styles for every type token, and Effect styles for every shadow.
- **Components** — 50 components across Buttons, Inputs, Forms, Cards, Feedback, Navigation, Data Display, Overlays, Media, and Layout. Components are generated with full Auto-Layout, variant sets, and real vector iconography.
- **Pages** — `🎨 Tokens` (foundations board), `🧩 Components` (by category), `📐 Patterns` (composed examples), `📚 Documentation`, `🎮 Playground`.
- **Export** — tokens as CSS variables, Tailwind `theme.extend`, plain JSON, or **W3C DTCG** (2025.10 draft).
- **Scan & Audit** — counts component instances, local styles, and detects unbound fills across the file.

## Getting started

```bash
npm install
npm run build      # → dist/code.js with inlined UI and embedded Geist fonts
npm run check      # typecheck, lint, config schema, DTCG spec, and snapshot tests
```

### Load in Figma

1. Open Figma → **Plugins → Development → Import plugin from manifest**.
2. Select the repo-root **`manifest.json`** (its `main` points at `dist/code.js`).
3. **Plugins → Development → Design System Kit → Run**.
4. Configure foundations via the instrument rail or pick a preset, select components, and click **Build**.

## Architecture

```
src/
  shared/            # framework-agnostic model + pure utils (no Figma API)
    types.ts         # GenerationConfig, DesignTokens, component-definition model
    color-utils.ts   # hex↔hsl, shade/scale + semantic + dark generation
    typography-utils.ts # type scales, spacing/shadow/radius tokens
    component-definitions.ts # the 50 component definitions (data)
    naming.ts        # DS/Buttons/Button/Primary style naming
  plugin/            # runs inside the Figma sandbox (uses `figma`)
    main.ts          # postMessage router
    commands/
      generate.ts    # tokens → styles → pages → components
      export.ts      # token export (json/css/tailwind/dtcg)
      scan.ts        # usage report
    utils/
      styleKeys.ts   # canonical style-name keys (writer + reader agree)
      tokenAccess.ts # read resolved values from DesignTokens
      primitives.ts  # low-level Figma node builders
      tokensStore.ts # holds last tokens for export/scan
      factory/       # data-driven component factory
        templates.ts       # per-component visual templates
        categoryFallback.ts# labeled fallback for any missing template
        index.ts            # builds category frames + sibling sets
  ui/                # React 18 + TypeScript panel (runs in the webview)
    App.tsx, store.ts, plugin.ts, components/*
```

The UI and plugin communicate only via `postMessage` (`GENERATE_DESIGN_SYSTEM`,
`EXPORT_TOKENS`, `SCAN_USAGE`, `GET_FONTS`, and the `…_PROGRESS` / `…_COMPLETE`
replies). Shared types live in `src/shared/types.ts` so both sides agree on the
`GenerationConfig` contract.

## Known limitations (by design)

- **Flat components, not Figma component sets.** Each variant/size/state is a
  separate `ComponentNode` with a clear name (`DS/Buttons/Button/Primary`,
  `DS/Buttons/Button/Hover`, …) rather than one `componentSet` with variant
  *properties*. This is more reliable to generate and still organizes cleanly.
- **Dark mode** generates dark Paint styles + dark token shades; it does not
  auto-swap component fills in-file.
- Runtime behaviour can only be fully verified inside Figma desktop; the
  verifiable bar here is a clean `tsc --noEmit` and a successful `vite build`.
