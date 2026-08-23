# Design System Kit — project context

Portable brief for use in other tools. Written 2026-08-23. Everything below was
verified against the repo, not recalled.

---

## 1. What this is

A Figma plugin (`design-system-kit`, MIT, private) that generates a complete
design system in one run: design tokens, Figma styles and variables, ~50
components across 10 categories, organised pages, plus token export and a usage
scanner.

- **Repo:** https://github.com/Tejas-v-krishna/figma-design-system-plugin
- **Local path:** `C:\Users\tejas\figma-design-system-plugin`
- **Stack:** TypeScript (strict), React 18, zustand, lucide-react, culori
  (OKLCH), Vite 7, ESLint 9 + typescript-eslint, tsx for check scripts
- **No test framework.** Correctness is pinned by four custom check scripts
  (see §5), not by Jest/Vitest.

### What it produces

| Output | Detail |
|---|---|
| Tokens | Colour ramps 50–950 for primary/secondary/success/warning/danger/neutral, gradients (OKLCH-derived), type scale (Material/System/Custom), spacing, radius, stroke, elevation, motion. Dark counterparts when enabled. |
| Figma styles | Paint per shade, Text per type token, Effect per shadow. Components bind to these. |
| Components | ~50, drawn by a token-driven factory; main instance plus bounded variant/size/state siblings. |
| Pages | `🎨 Tokens`, `🧩 Components`, `📐 Patterns`, `📚 Documentation`, `🎮 Playground` |
| Export | CSS variables, Tailwind `theme.extend`, plain JSON, **W3C DTCG** (2025.10 draft) |
| Scan | Counts instances and local styles, detects unbound fills |

---

## 2. Architecture

Three realms, and the boundary is enforced:

```
src/shared/   pure, framework-agnostic model + utils. NEVER touches `figma` or DOM.
src/plugin/   runs in the Figma sandbox. Has `figma`. main.ts is a postMessage router.
src/ui/       React panel in the iframe. Has DOM, no `figma`.
```

They communicate only by `postMessage`: `GENERATE_DESIGN_SYSTEM`,
`EXPORT_TOKENS`, `SCAN_USAGE`, `GET_FONTS`, plus `…_PROGRESS` / `…_COMPLETE`
replies. `src/shared/types.ts` holds the `GenerationConfig` contract both sides
agree on.

### Build pipeline (two Vite passes, order matters)

```bash
npm run build
# 1. vite build --config vite.ui.config.ts   → dist/ui.js (IIFE) + dist/ui.css
# 2. vite build --config vite.config.ts      → dist/code.js
#    its `inline-manifest` plugin inlines ui.js + ui.css into code.js as
#    __html__, then DELETES dist/ui.js and dist/ui.css
```

Figma renders inline `__html__` in an iframe with an **opaque base URL**, so the
UI cannot reference any external file. Everything must be inlined.

### Key docs in-repo

- `docs/DESIGN.md` (141 lines) — the visual contract. It is normative: a change
  it can't justify shouldn't ship.
- `docs/ARCHITECTURE.md` (62 lines)
- `README.md` (88 lines) — **partly stale**: it still describes a "wizard
  (Brand → Type → Components → Review)", which the rail + sheet replaced in
  `b0d470d`. Worth fixing.

---

## 3. Current state

```
branch    feat/instrument-rail-shell
HEAD      b0d470d feat(ui): replace three levels of nav with the rail and sheet
tree      clean
PR #1     MERGED into main on origin at 2026-08-23T08:12Z
local main  a779893 — 6 behind origin/main (just needs a pull)
stash@{0}  wip: geist redesign (tokens.css + rewritten theme.css + fontsource deps)
```

166 commits, all authored 2026-08-23, starting from
`fe1e5db chore: import existing plugin source as baseline` — so ~162 commits of
work on top of an imported baseline. Commit style: conventional prefixes, and
subject lines state *why* rather than *what* (`fix(picker): stop rounding HSV,
which shifted the colour on open`).

**All quality gates green** at HEAD, with 44 snapshots matching.

---

## 4. What has been done

Grouped by theme. Every item is a landed, pushed commit unless marked otherwise.

### Token pipeline correctness
- Dark ramp was never actually built when dark mode was on — fixed, and dark
  paint styles now group under `Color/Dark`.
- Shadow steps named semantically instead of by index; **intensity now scales
  the whole ramp** rather than trimming steps off it (breaking change).
- Radius scale given semantic step names; radius preset moved into the scale
  generator instead of four hardcoded ternaries in templates.
- Stroke steps named after their width, not their index.
- Shadow opacity carried as a real number, not only embedded in a string.
- Token accessors now report an unknown step name instead of failing quietly.
- Semantic + component alias tables moved into `src/shared/`.
- Paint alpha put on `opacity`, not inside the RGB colour.

### Export
- **A real W3C DTCG serializer** targeting the 2025.10 draft, with the plugin's
  DTCG export delegating to it.
- The DTCG check validates against the *spec*, not against yesterday's output —
  a deliberate choice so the test can't ratify a regression.
- CSS / Tailwind / JSON exporters kept in lockstep via snapshots.

### Component factory
- Variant sets and boards got real auto-layout.
- Real vector icons replace grey placeholder dots.
- Six non-null assertions dropped — they were hiding a real bug.
- Both shape boards (radius + stroke) build from one composite target.

### Colour picker (`ColorPickerModal.tsx`, 375 lines)
- Removed the alpha slider, which never affected the colour.
- Fixed the hue slider collapsing to zero height.
- Stopped rounding HSV, which visibly shifted the colour on open.
- Added WCAG contrast readout against white and black.

### The rail-and-sheet shell (the last increment, `b0d470d`)
Replaced **three parallel levels of navigation** — a tab bar over `view`, a
sidebar over `tokenCategory`, and a per-view footer action — with one rail plus
one sheet, which is what `docs/DESIGN.md` set out to collapse.

`src/ui/destinations.ts` is now the single table driving navigation, the sheet
head, per-item token counts, and the Build button's target. Ten destinations:

- **Foundations:** Colour, Gradients, Type, Space, Shape, Depth, Motion
- **Library:** Components, Audit, Export

Design notes worth keeping: `target` is deliberately separate from `id` (the
sandbox's target vocabulary is fixed and an unrecognised value falls through to
a full rebuild, so rail identity and generation target must be free to differ —
that's what lets Shape be one destination over two scales). Motion, Audit and
Export have no `target`: Motion isn't generated at all, and the other two own
their action inside the sheet.

Also in this increment: gradients counted and motion kept out of the token
total; utility labels raised to the 11px floor; `PORT` can override the dev
harness port.

### Toolchain and hygiene
- Vite 5 → 7, clearing the last `npm audit` finding; postcss and nanoid
  advisories patched; `vite-plugin-static-copy` dropped (nothing imported it).
- Check scripts and Vite configs are themselves typechecked
  (`tsconfig.scripts.json`).
- `tsx` installed so the check scripts actually run.
- Shared code no longer reaches for a Figma sandbox global.
- Dead store fields and a dead `View` union member removed.
- A successful export or scan no longer clears an unread error.

---

## 5. Quality gates

```bash
npm run check
# = typecheck && lint && check:config && check:dtcg && check:snapshot
```

- `typecheck` — `tsc --noEmit` twice: app, then `tsconfig.scripts.json`
- `check:config` — `scripts/check-config-schema.ts`
- `check:dtcg` — `scripts/check-dtcg-spec.ts`, validates against the spec
- `check:snapshot` — `scripts/check-token-snapshot.ts`, **44 on-disk snapshots**
  in `scripts/__snapshots__/`: 11 config fixtures × 4 formats
  (`.css`, `.dtcg.json`, `.json`, `.tailwind.js`). Update with
  `npm run check:snapshot -- --update`.

Fixtures: `defaults`, `brand-crimson`, `dark-mode-off`, `effects-none/subtle/strong`,
`radius-pill`, `radius-sharp`, `spacing-base-8`, `type-scale-custom-20`,
`type-scale-system`. **All derive from `DEFAULT_CONFIG`** (`src/shared/presets.ts`),
so any change to it moves all 44.

Dev harness: `npm run dev` (`vite.dev.config.ts`, port 5178, `strictPort`,
`PORT` env overrides). `.claude/launch.json` defines it as `dsk-ui`.

TS config is strict plus `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`. **No `.d.ts` files anywhere** in the project.

---

## 6. Hard-won constraints — do not rediscover these

1. **`manifest.json:10` sets `networkAccess.allowedDomains: ["none"]`.** No CDN,
   no network fonts. Any webfont must be base64-embedded in the bundle.
2. **`vite.ui.config.ts` must NOT pin `build.target`.** There's a header comment
   explaining why: `build.cssTarget` inherits `build.target`, and a bare ES-year
   target tells esbuild nothing about browsers, so it stops emitting
   `-webkit-backdrop-filter`. This UI uses `backdrop-filter` in four places and
   Figma desktop runs Safari, where the unprefixed property isn't enough.
3. **CSS travels as a JS template literal** inside `dist/code.js`. A base64
   `data:` URI survives it (base64's alphabet contains no backtick).
4. **`:focus-visible` cannot match when `document.hasFocus() === false`.** The
   preview pane is never OS-focused, so focus rings can't be verified at runtime
   there — they must be checked statically off parsed `document.styleSheets`.
5. **`src/ui/index.tsx` import order is load-bearing:** `styles.css` then
   `theme.css`. theme.css re-points palette variables that styles.css declares,
   and later `:root` wins on equal specificity.
6. **`src/shared/contrast.ts:105`** picks its nudge direction from
   `relativeLuminance(against)`, so `nudgeToContrast` adapts to light or dark
   surfaces automatically.
7. **`src/plugin/utils/fonts.ts`** degrades safely:
   `GUARANTEED_FAMILIES` → `AVAILABLE[0]` → Inter.
8. Frame is a fixed **720×800** in Figma; rail is 184px (`--rail-w`), sheet 536px.

---

## 7. Known problems, currently unfixed

These were found while verifying the shell increment. All still true at HEAD.

1. **Two parallel control kits.** `src/ui/components/controls.tsx` renders
   `field` / `text-input` / `segmented` / `seg` / `btn` / `toggle`, styled in
   `styles.css`. `theme.css` declares a *second, entirely unused* kit —
   `dsk-field` / `dsk-input` / `dsk-seg` / `dsk-ghost-btn`. Nothing matches
   anything.
2. **A rail text tier fails WCAG.** `--on-ink-faint` `#5C636D` on `--ink`
   `#14161A` measures **2.98:1**, and it carries the group labels, the version
   string and the idle per-item token counts at 11px. Lifting it to ~`#7A818B`
   reaches 4.5:1 but collapses the gap to `--on-ink-dim` (5.77:1), which is the
   separation the tiers exist to create.
3. **`styles.css` is 1733 lines**, with ~350 lines of dead CSS no component
   references (`.sidebar`, `.brand-block`, `.nav-item`, `.hero`, `.preview`,
   `.category-*`, `.preset-card`, `.review-*`, `.format-tab`, `.scan-*`,
   `.empty-state`, `.chip-soft` …), dark-theme leftovers with hardcoded hex
   (`.dsk-search-input { background:#242424; color:#fff }`,
   `.dsk-component-card { background:#242424 }`,
   `.dsk-code-block-wrapper { background:#141414 }` …), `rgba(255,255,255,…)`
   hover fills on what are now light surfaces, and a trailing block of
   `!important` animation overrides fighting the base rules.
4. **Borders doing a surface's job** — most of the panel is hairline-separated
   list rows, which reads dense at 720px.
5. **README is stale** (see §2).

---

## 8. Next planned increment — UI redesign (planned, approved, NOT implemented)

Brief: make the whole panel more minimal, clean and usable, inspired by two
reference designs (a light settings screen with grouped nav, count badges,
status pills and two-column rows; and a light dashboard with large grey cards,
one black hero card, and very large numerals). Explicitly **no Inter, no
Montserrat**.

Four decisions locked:

| Decision | Choice |
|---|---|
| Panel typeface | **Geist Sans + Geist Mono**, base64-embedded (no CDN possible) |
| Rail | **Light**, with a **near-black active pill** — rail and sheet differ by one surface step, not a light/dark boundary |
| Accent | **Near-black for structural actions**; the user's brand colour keeps focus rings, selection, the wordmark tick and in-content selected states |
| Generated-system default font | **Also changes** — `DEFAULT_CONFIG.fontFamily` → Geist / Geist / Geist Mono, which regenerates all 44 snapshots |

Proposed token layer (all three text tiers clear 4.5:1 on all three surfaces,
which is what the dark rail could not do):

```
--surface       #FFFFFF   the sheet (neutral white, not today's warm #FBFBF9)
--surface-rail  #F7F7F6   the rail, one step down, no right border
--surface-sunk  #F4F4F2   inset panels, input fills, idle segmented track
--ink           #16181C   near-black: primary buttons, hero stat cards
--hairline      #E8E8E5   one rule per section, maximum

--text       #16181C   17.8:1 / 16.6:1 / 16.1:1
--text-dim   #5C6169    6.2:1 /  5.8:1 /  5.7:1
--text-faint #6B7078    5.0:1 /  4.7:1 /  4.5:1

--r-card 14px   --r-control 10px   --r-pill 999px   --r-chip 8px
```

Two open design tensions the plan resolves explicitly:

- **`--radius-user` vs. the redesign.** DESIGN.md asks the panel's own controls
  to wear the user's chosen radius. Applied literally, picking the *Sharp*
  preset squares off the entire interface and the redesign evaporates. Plan:
  `--radius-user` survives only where it genuinely *demonstrates the token*
  (Build button, swatch tiles, specimen previews); structural chrome takes the
  fixed scale above.
- **Brand derivation must invert.** `useBrandTheme.ts` currently clamps dark
  brands *up* to be legible on a near-black rail. On a light rail that's
  backwards — it has to clamp *down* (roughly `20, 62`, targeting 4.5:1 rather
  than 3:1, since the tick sits beside text).

Font budget, measured not guessed: Geist latin 29,400 B + Geist Mono latin
23,128 B = 52,528 B raw ≈ **70 KB base64**, versus 146,868 B ≈ 196 KB for all
normal subsets. Requires `build.assetsInlineLimit: 4_000_000` in
`vite.ui.config.ts` — Vite's `shouldInline()` has no font-type exclusion, so
woff2 does inline. Note: Fontsource registers the family as `'Geist Variable'`,
not `'Geist'`, and its CSS uses the legacy `format('woff2-variations')`; writing
your own `@font-face` against the latin `.woff2` files with `format('woff2')`
and `font-weight: 100 900` avoids both.

**Status: reverted, not abandoned.** Implementation started (a new
`src/ui/tokens.css` and a rewritten `theme.css`), then was undone on request.
It lives in `stash@{0}`; `git stash pop` restores it. The full approved plan is
at `C:\Users\tejas\.claude\plans\cozy-percolating-music.md`. Its planned step
order is: ship the font → new `tokens.css` → one control kit → shell/rail/sheet
→ invert brand derivation → rewrite panels → change the generated default font →
reconcile `docs/DESIGN.md` and delete legacy aliases.

The snapshots are the hard guard for this work: they must stay **byte-identical**
through every step except the default-font change, where the only permitted diff
is `fontFamily` strings. Anything else moving means the redesign leaked into the
token pipeline.
