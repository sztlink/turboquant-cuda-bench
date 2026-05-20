# GitHub visual design envelope

This repo can support a strong visual layer without leaving GitHub, but the surface has two different constraints.

## README / Markdown surface

Use for:

```txt
hero SVG
process diagrams
boundary seals
small metric cards
Mermaid diagrams
<details> receipt drill-down
```

Practical constraints from GitHub docs:

```txt
Markdown and rendered previews are reliable when files are small, generally under 2 MB.
Single Git object recommended max: 1 MB; hard limit: 100 MB.
SVG/image files render in GitHub, but SVG inline scripting/animation is not supported.
Markdown HTML is sanitized; scripts, inline styles, class/id attributes are stripped or unreliable.
CSV rendering is interactive up to about 512 KB.
```

Design rule:

```txt
README = poster plus routing layer, not application shell.
```

## GitHub Pages / docs surface

Use for:

```txt
static microsite
full HTML/CSS layout
local JavaScript if needed
visual navigation across receipts
print-like artifact pages
```

GitHub Pages constraints:

```txt
published site max: 1 GB
source repo recommended limit: 1 GB for Pages
build timeout: 10 min
soft bandwidth limit: 100 GB/month
soft build limit: 10/hour unless using custom Actions
```

Design rule:

```txt
Pages = visual exhibit, still static and receipt-linked.
```

## Visual system tokens

Adapted from the szt.link light editorial image system:

```txt
surface: warm paper
ink: dark charcoal
accent red: boundary / warning
accent green: validator pass
accent yellow: compatibility / ambiguous state
accent blue: navigation / structural path
texture: subtle notebook grain, not decoration
layout: generous margins, few large numbers, receipts as drill-down
```

Avoid:

```txt
SaaS dashboard look
dark neon tech default
leaderboard framing
attention-like heatmaps
animated SVG / script in README
large GIFs
raw selected-position samples as visual surface
```

## Current implementation

Generator:

```txt
07-scripts/generate-github-visual-system.mjs
```

README assets:

```txt
bench-public/assets/github-hero-evidence-path.svg
bench-public/assets/evidence-path-ledger-v19.svg
bench-public/assets/github-entry-map.svg
bench-public/assets/boundary-seal-v19.svg
```

Optional static microsite folder:

```txt
docs/index.html
docs/assets/
```

## Boundary copy

Keep visible:

```txt
offline receipts
compatibility states
not attention
not evidence-use proof
not serving readiness
```
