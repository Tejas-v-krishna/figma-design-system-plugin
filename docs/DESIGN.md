# Design System Kit — interface design direction

This document is the brief the UI is built against. If a change to the interface
can't be justified from something written here, it probably shouldn't ship.

## The subject

A Figma plugin that manufactures a design system on canvas. The audience is UI/UX
designers and product teams — people who already spend all day inside Figma's own
interface. The panel has one job: let you decide a system's foundations, see what
you're about to get, and commit it to the canvas.

## Thesis: the panel is a specimen sheet

A design system's native artifact is the specimen sheet — the printed page a type
foundry ships to show what a face does at every size, or the fan deck a paint
manufacturer ships to show a colour range. That is this subject's own vernacular.

So the panel is not a settings form with a preview pane bolted on. The panel *is*
the specimen. Tokens are rendered at full size, in the medium they describe, and
edited in place. A radius token is shown as a corner. A shadow token is shown as
a shadow. A type scale is shown as type.

The old UI showed a spacing scale as one number input labelled "Base Grid
Spacing (px)". That is a form. This is the thing being fixed.

## Colour

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#14161A` | Instrument chrome — the rail and bars. Cool near-black. |
| `--graphite` | `#1E2126` | Raised chrome: inputs, hover states. |
| `--rule` | `#2E333B` | Hairlines on the instrument. |
| `--paper` | `#FBFBF9` | The specimen surface. A hair warm. |
| `--wire` | `#E3E3DF` | Hairlines on paper. |
| `--brand` | *derived at runtime* | Accent. Taken from the user's primary colour. |

The chrome is deliberately achromatic. This is a functional constraint, not a
taste call: the entire content of this tool is colour — arbitrary user colour, at
eleven steps across eight families. Chrome with a hue in it would sit next to
every swatch and corrupt the colour judgement the tool exists to support. Figma's
own canvas is grey for the same reason.

`--paper` is `#FBFBF9`, not a cream. Cream is warm enough to shift how a cool
swatch reads.

## The tool wears your system

There is no fixed accent colour. `--brand` is set from the user's own primary
colour, so the active rail item, focus rings, selection states and the build
button all take the colour being configured. The chosen radius is applied to the
panel's own controls. The chosen heading typeface sets the panel's specimen
headings.

This is the design's one real risk. It pays for itself twice: the interface can
never read as a template, because it is a different interface for every user, and
applying a brand colour to real interactive UI is the fastest legibility check a
designer can get.

Failure mode: a near-white or near-black brand colour would leave the chrome with
no contrast. Mitigated by `--brand-chrome`, a lightness-clamped variant used
anywhere the brand meets the instrument. That clamp is the same contrast maths the
audit view needs, so the risk funds a feature.

## Type

Three roles. No webfonts are possible — `manifest.json` sets
`networkAccess.allowedDomains: ["none"]`, which blocks font requests along with
everything else — so every face is a system face or user-supplied.

- **Chrome / body** — the system UI stack. Correct for tool chrome: it should be
  invisible and it should match Figma.
- **Specimen display** — `var(--font-heading)`, live, the user's configured
  heading font. Specimen headings are set in the face you picked.
- **Utility / data** — monospace, and this is where the personality goes. Every
  hex, pixel value, ratio, step number, token name and eyebrow label is mono,
  tracked out, upper case. A spec sheet sets its data in mono. Used structurally,
  not decoratively.

## Layout

The old UI had three levels of navigation for four destinations: a top tab bar, a
left sidebar, and a floating action pill. The new layout collapses that to one.

A dark instrument rail on the left carries all navigation. The specimen sheet
fills the rest.

```
┌───────────────────────────────────────────────────────────┐
│ ▓ DESIGN        │  ┌ COLOUR ─────────────────── 8 ramps ┐ │
│ ▓ SYSTEM KIT    │  │                                     │ │
│ ▓ ─── 1.0.0     │  │ Primary        #2563EB  Royal Blue  │ │
│ ▓               │  │ ██▓▓▒▒░░  50 → 950 (11 steps)       │ │
│ ▓ FOUNDATIONS   │  │ ─────────────────────────────────── │ │
│ ▓ ▸ Colour   8  │  │ Secondary      #F97316  Tangerine   │ │
│ ▓   Type     9  │  │ ██▓▓▒▒░░                            │ │
│ ▓   Space   12  │  │ ─────────────────────────────────── │ │
│ ▓   Shape    8  │  │ ...                                 │ │
│ ▓   Depth    4  │  └─────────────────────────────────────┘ │
│ ▓   Motion   6  │                                          │
│ ▓               │                                          │
│ ▓ LIBRARY       │                                          │
│ ▓   Components  │                                          │
│ ▓   Audit       │                                          │
│ ▓   Export      │                                          │
│ ▓               │                                          │
│ ▓───────────────│                                          │
│ ▓ 47 tokens     │                                          │
│ ▓ [Build ▸]     │                                          │
└───────────────────────────────────────────────────────────┘
```

The rail is 184px, the sheet 536px, in a 720×800 iframe. The rail shows a live
token count per category. That is structure encoding something true — how large
your system actually is — rather than decoration.

## Signature: the ramp strip

Each colour family renders its eleven shades as one continuous flush strip: no
gaps, no corner radius, no gutters. A press colour bar. Step numbers sit beneath
in mono, and hovering a segment lifts it and reveals its hex.

This is the subject's vernacular, and it is the functionally correct rendering. A
colour ramp is judged on whether its steps are perceptually evenly spaced. Only a
flush strip lets you see that. Gapped, rounded swatch cards — which is what the
old UI did, and what most colour tools do — actively hide the banding and dead
zones you most need to catch.

## Restraint

One accessory removed: no ambient motion, no gradient chrome, no glass blur, no
shadows anywhere on the instrument. The chrome is flat and matte.

Every bit of colour, depth and curvature in the interface comes from the user's
own tokens. That discipline is what lets the ramp strip land.

## Quality floor

Not negotiable, and not announced in the UI: visible keyboard focus on every
control, `prefers-reduced-motion` respected, no text below 11px, and a contrast
ratio of at least 4.5:1 for body text against its own surface.
