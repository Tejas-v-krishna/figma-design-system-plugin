# Architecture

## Runtime model

The plugin has two isolated JavaScript contexts that talk only through
`postMessage`:

| Context | Entry | Global | Bundled by |
|---|---|---|---|
| Plugin sandbox | `src/plugin/main.ts` → `dist/code.js` | `figma` | Vite (library) |
| UI webview | `src/ui/index.tsx` → `dist/ui.html` | `window`, `parent` | Vite (HTML) |

`manifest.json` points `main`/`ui` at `dist/code.js` and `dist/ui.html`.

## Message contract

UI → Plugin
- `GENERATE_DESIGN_SYSTEM` `{ config: GenerationConfig }`
- `EXPORT_TOKENS` `{ format: 'json'|'css'|'tailwind'|'dtcg' }`
- `SCAN_USAGE`
- `GET_FONTS`

Plugin → UI
- `GENERATION_PROGRESS` `{ step, progress, message }`
- `GENERATION_COMPLETE` `{ success, message, stats }`
- `EXPORT_COMPLETE` `{ success, tokens, message }`
- `SCAN_COMPLETE` `{ success, report, message }`
- `FONTS_LOADED` `{ fonts }`

`GenerationConfig` is the single source of truth shared via `src/shared/types.ts`.

## Generation pipeline (`commands/generate.ts`)

1. **Load fonts** — heading/body/mono × {Regular, Medium, Semi Bold, Bold}.
2. **Build tokens** — `color-utils.generateSemanticColors` + `typography-utils`
   scales; radius/intensity presets applied.
3. **Create styles** — Paint/Text/Effect styles, keyed by `styleKeys.ts`
   (e.g. `Color/Primary/500`). A `StyleMap` of name→id is returned so the
   factory can bind `fillStyleId`/`textStyleId`/`effectStyleId`.
4. **Create pages** — Tokens (foundations board), Components (filled by the
   factory), Patterns, Documentation, Playground.
5. **Generate components** — `factory/index.ts` groups selected definitions by
   category, builds a frame per category, and for each definition emits a main
   instance plus bounded variant/size/state siblings.
6. **Scan/Export** — the last tokens+config are stored in `tokensStore.ts` so
   `export`/`scan` (separate message handlers) can read them without
   regenerating.

## Component factory

- `primitives.ts` — `makeFrame`/`makeComponent`/`text`/`rect`/`ellipse`/`line`,
  `hbox`/`vbox`, `setFill`/`setStroke`/`setEffect` with optional style binding.
- `tokenAccess.ts` — resolve a shade / type token / radius / spacing / shadow
  from a `DesignTokens` object.
- `templates.ts` — `Record<name, Template>`; each template populates a
  `ComponentNode` using tokens + resolved variant/size/state `ctx`.
- `categoryFallback.ts` — a labeled, token-styled fallback for any component
  without an explicit template (never a bare grey box).
- `index.ts` — orchestrates category frames, sibling generation, naming.

Because templates consume the shared token model, every component stays
visually consistent with the brand and is linked to the generated styles.
