# Design System — Landing Page Teardown Tool

A clean, light, Apple-inspired system: white/light-gray surfaces, near-black ink, one production-blue accent, and a five-color "Boggle" palette reserved for the five teardown criteria. Every color pair below is WCAG AA-verified against the specific background it appears on (not assumed). No serif anywhere — one clean sans throughout.

Source of truth: `web/src/index.css` (tokens + global rules) and `web/src/App.css` (component rules). This document is a reference snapshot of those files — if they drift, the CSS wins.

---

## 1. Color

### 1.1 Surfaces

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f5f7` | Page background (Apple's signature light gray) |
| `--surface` | `#ffffff` | Cards, panels, popovers |
| `--surface-2` | `#e8e8ed` | Recessed fills — pills, track backgrounds, disabled states |
| `--border` | `rgba(0,0,0,0.08)` | Hairline borders, default |
| `--border-strong` | `rgba(0,0,0,0.14)` | Hover/emphasis borders |

### 1.2 Ink (text)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1d1d1f` | Primary text (Apple's near-black, not pure `#000`) |
| `--ink-soft` | `rgba(29,29,31,0.68)` | Secondary text |
| `--ink-faint` | `rgba(29,29,31,0.45)` | Tertiary / placeholder / disabled text |

### 1.3 Inverted controls

| Token | Value | Use |
|---|---|---|
| `--invert-bg` | `#1d1d1f` | Dark fill for low-emphasis inverted buttons (e.g. API-key Save) |
| `--invert-ink` | `#ffffff` | Text/icon on inverted or accent fills |

### 1.4 Accent

One accent, one job everywhere it appears — buttons, links, focus rings, active states. No two-step fill/text split needed since white-on-blue and blue-on-white both clear 4.5:1 independently.

| Token | Value | Contrast | Use |
|---|---|---|---|
| `--accent` | `#0071e3` | 4.7:1 on white | Primary actions, links, focus |
| `--accent-strong` | `#0058b0` | 6.95:1 on white | Hover/press state of accent |
| `--accent-soft` | `rgba(0,113,227,0.1)` | — | Wash backgrounds (focused input, callout box) |

### 1.5 Semantic (status only — never reused decoratively)

| Token | Value | Soft variant | Use |
|---|---|---|---|
| `--success` | `#15803d` | `rgba(21,128,61,0.1)` | Strong score tier, "key added" dot |
| `--warning` | `#b45309` | `rgba(180,83,9,0.1)` | Needs-work score tier, mock-data badge |
| `--danger` | `#b71c1c` | `rgba(183,28,28,0.1)` | Weak score tier, error banner |

### 1.6 Criterion palette ("Boggle" colors)

Five bold, distinct colors — one per teardown criterion — each independently verified to clear 4.5:1 as both text and a solid fill under white text, against `--bg`. Loosely thematic (trust = teal, urgency = red, friction = caution) but functionally arbitrary/systematic, not literal. Reused for the input screen's three example-URL chips.

| Criterion | Token / value |
|---|---|
| Message & Value Prop | `#7c3aed` (violet) |
| Call to Action | `#2563eb` (blue) |
| Trust & Credibility | `#0f766e` (teal) |
| Friction & Clarity | `#8a5a05` (gold/brown) |
| Urgency & Motivation | `#b71c1c` (red) |

Applied via a CSS custom property set inline per-instance (`--criterion-color`, `--tab-color`, `--chip-color`) so one color drives every part of that criterion's UI — tab dot, active-card border/background, score-bar fill, rating pips, "Change this" box — never mixed with the semantic success/warning/danger set.

### 1.7 Misc fixed colors (not tokenized)

| Value | Use |
|---|---|
| `#4a3826` | API-key Save button hover fill (darkened `--invert-bg`) |
| `#fff` | `::selection` text color; mixed into `.criterion-fix` background via `color-mix` |

---

## 2. Typography

### 2.1 Families

```css
--font-display: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Helvetica, Arial, sans-serif;
--font-body:    -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Helvetica, Arial, sans-serif;
--font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

One family, two roles — display and body are the same stack (real San Francisco on Apple devices via `-apple-system`, Inter as the web fallback everywhere else). They differ only in size/weight, never in typeface. Mono is reserved for the raw API-key input field.

### 2.2 Type scale (as used, largest to smallest)

| Size | Weight | Letter-spacing | Line-height | Used for |
|---|---|---|---|---|
| `clamp(40px, min(9vw,11vh), 128px)` | 400 | −0.01em | 1.02 | Masthead title (`.masthead-title`) |
| 19px→17px | 600 | −0.01em | — | Report title (`.report-head-title`) |
| 17px | 600 | −0.01em | — | Criterion card title |
| 16px | 400 | — | 1.6 | Masthead subhead |
| 16px | 500 | — | 1.5 | Score-head verdict text |
| 16px | — | — | — | URL input text |
| 15px | 500/400 | — | 1.5 | Criterion "Change this" body / callout body |
| 14px | 500 | — | 1.02 | Masthead eyebrow |
| 14px | 400 | — | 1.5 | Findings text, loading status, banner text |
| 14px | 600 | — | — | URL-bar submit button |
| 13px | 400/600 | — | 1.5 | Popover trigger text, API-key popover body, loading percent |
| 12px | 600/700 | 0.04em | — | URL-bar prefix ("URL"), example chips, mock badge |
| 11px | 700 | 0.06em | — | Eyebrow labels (uppercase): "Teardown summary", "Highest-leverage fix", "Change this" |
| 10px | 600 | 0.04em | — | Mock-data badge |

### 2.3 Text behavior utilities

- `text-wrap: balance` — masthead title, report title (short headline-like text)
- `text-wrap: pretty` — all `<p>` globally, plus `.criteria-eyebrow` (orphan/widow control)
- `font-variant-numeric: tabular-nums` — `.tabular-nums` utility, score digits, loading percent, finding index numbers (so digits don't wobble as values change)

---

## 3. Spacing

4px base scale. Every margin/padding/gap in the app traces to one of these eight steps — no one-off pixel values picked by eye.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |

### Viewport-aware spacing (input screen only)

To keep the input screen usable on short/split-screen windows without ever scrolling, several vertical margins use `clamp()` against `vh` instead of a fixed token:

```css
margin-bottom: clamp(16px, 5vh, 48px);  /* .masthead */
margin-bottom: clamp(8px, 2vh, 16px);   /* eyebrow, title, settings-row, url-bar */
```

---

## 4. Radius

Five steps + one "full" pill value. Every rounded corner traces to one of these — nothing is a one-off.

| Token | Value | Typical use |
|---|---|---|
| `--radius-xs` | 6px | Provider tab (inside model picker) |
| `--radius-sm` | 8px | Popover option rows |
| `--radius-md` | 14px | Inputs, save/cancel buttons, screenshot image corners, findings box, "Change this" box |
| `--radius-lg` | 24px | `.panel` (cards) |
| `--radius-xl` | 28px | *(reserved, not currently used)* |
| `--radius-full` | 999px | Pills, toggle track/thumb, score bars, tab switchers, badges |

**Squircle progressive enhancement:** `corner-shape: squircle` is applied alongside `border-radius` on `.panel` and most `--radius-md`/`--radius-sm` elements — a true squircle curve instead of a circular-arc rounded corner on Chrome 139+, with a plain rounded-rect fallback everywhere else.

---

## 5. Shadows

Only one shadow in the entire system — deliberately flat, no elevation ladder.

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.03);
```

Used for: active provider-tab in the model picker, active criterion-tab, URL-bar-submit hover state.

---

## 6. Motion

### 6.1 Easing library

Physics-based curves only — never `linear`, never a plain `ease`/`ease-in-out` default.

```css
--ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);      /* fast start, soft landing — entrances, hover */
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);  /* slight overshoot — settling, popovers, toggles */
--ease-in-out-soft: cubic-bezier(0.45, 0, 0.55, 1);     /* gentle, symmetrical — currently unused, reserved */
--ease-out-quick:   cubic-bezier(0.25, 0.46, 0.45, 0.94); /* instant snap — press states */
```

### 6.2 Standard durations

| Duration | Easing | Use |
|---|---|---|
| 100ms | `ease-out-quick` | Press/active-state snap (buttons, toggles, chevron icons) |
| 150ms | `ease-out-expo` | Color/border/background transitions (hover, focus) |
| 200ms | `ease-spring` | Release-from-press bounce-back; toggle thumb slide; chevron rotate; popover enter |
| 250ms | `ease-out-expo` | Loading-bar width fill; criterion-card entrance |
| 300ms | `ease-out-expo` | Screen swap; score-bar width fill; loading-status crossfade; stamp pop-in |
| 400ms | `ease-out-expo` | Score-ring stroke draw-in; findings-list item entrance |

### 6.3 Press/release pattern

The standard interactive-element recipe (buttons, pills, save/cancel):

```css
.el {
  transform: translateY(0);
  transition: background-color 150ms var(--ease-out-expo), transform 200ms var(--ease-spring);
}
.el:hover { transform: translateY(-1px); }        /* max 2px lift, never more */
.el:active {
  transform: scale(0.97);
  transition-duration: 100ms;
  transition-timing-function: var(--ease-out-quick); /* fast snap down */
}
/* releasing falls back to the base rule's 200ms spring — the bounce-back */
```

### 6.4 Keyframe animations

| Name | Duration | Applied to | Effect |
|---|---|---|---|
| `screen-in` | 300ms `ease-out-expo` | `.screen` (input ↔ report swap) | opacity 0→1, translateX(8px)→0 |
| `popover-in` | 200ms `ease-spring` | `.model-picker-popover`, `.api-key-popover` | opacity 0→1, translateY(−4px)→0 + scale(0.97)→1 |
| `card-in` | 250ms `ease-out-expo` | `.criterion-card` (on tab switch) | opacity 0→1, translateY(6px)→0 |
| `finding-in` | 400ms `ease-out-expo`, staggered | `.criterion-findings li` | opacity 0→1, translateY(8px)→0; delay = 50ms × index, capped at 250ms (item 6+) |
| `stamp-in` | 300ms `ease-spring` | `.stamp` (score ring, on mount) | opacity 0→1, scale(0.9)→1 |
| `fade-in` | 300ms `ease-out-expo` | `.loading-status` (rotating tip crossfade) | opacity 0→1 |

### 6.5 Scroll animation

Two content regions page through overflow via JS `scrollTo()` instead of resizing their box (findings list, verdict summary). Both carry `scroll-behavior: smooth` so the programmatic scroll glides rather than jumping — even though `overflow: hidden` also hides the scrollbar itself.

### 6.6 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6.7 Motion principles

1. **Physics over timing** — every curve decelerates or overshoots like a real object; nothing moves at constant speed.
2. **Purposeful** — every animation ties to a real state change (hover, press, mount, data update, pagination). Nothing loops or plays decoratively — verified: zero `animation-iteration-count: infinite` anywhere in the app.
3. **Felt, not noticed** — hover lifts never exceed 1px, press-scale never drops below 0.9, durations stay in the 100–400ms band.

---

## 7. Sizing

### 7.1 Layout containers

| Element | Constraint |
|---|---|
| `.page` | `max-width: 960px`, `padding: var(--space-5)` (24px), centered |
| `.masthead-sub`, `.settings-row`, `.url-bar`, `.below-url-row` | `max-width: 640px`, centered |
| `.model-picker-popover` | `width: 260px` |
| `.api-key-popover` | `width: 280px` |
| Popovers (both) | `max-height: min(360px, calc(100vh - var(--space-8)))` — never runs off-screen |
| `.loading-panel` | `max-width: 640px` |
| `.report-grid` | `grid-template-columns: minmax(0,1.4fr) minmax(0,1fr)` (criteria : screenshot) |

### 7.2 Controls

| Element | Size |
|---|---|
| Toggle switch track | 34×20px |
| Toggle switch thumb | 16×16px, 2px inset |
| Toggle switch tap target | inset −12px (extends to ~44px invisible hit area) |
| Criteria tab (dot button) | 28×28px, dot itself 11×11px |
| Criterion-card dot | 10×10px |
| Model/API-key trigger dot | 6×6px |
| Score-stamp — large | 56px box, 4px stroke |
| Score-stamp — small | 40px box, 3px stroke |
| Findings-toggle pill | 64×22px |
| Verdict-toggle circle | 22×22px |
| Score bar height | 8px |
| Loading bar height | 6px |
| Chevron icon (SVG) | 10×10px viewBox, 1.5px stroke |
| Model-picker chevron (SVG) | 10×6px viewBox |
| Rating pip | 6×6px dot, 3px gap |
| Screenshot pane scrollbar | 8px wide (WebKit) |

### 7.3 Score stamp ring math (`ScoreStamp.jsx`)

```js
const SIZES = { lg: { box: 56, stroke: 4 }, sm: { box: 40, stroke: 3 } };
const r = (box - stroke) / 2;
const circumference = 2 * Math.PI * r;
const offset = circumference * (1 - pct / 100);
```
Tier thresholds: `pct >= 80` → success ("Strong"), `pct >= 50` → warning ("Needs work"), else danger ("Weak"). Score is always rounded to a whole number for display.

---

## 8. Breakpoints & responsive rules

No traditional min-width breakpoint ladder — this app uses `clamp()`/`min()`/`vh` fluid scaling plus one content-visibility cutoff:

```css
/* Masthead title shrinks on EITHER a short OR narrow viewport */
font-size: clamp(40px, min(9vw, 11vh), 128px);

/* Below 700px viewport height, the page-level "highest-leverage fix"
   callout hides — each criterion card's own "Change this" box still
   carries the same kind of guidance, so nothing critical is lost. */
@media (max-height: 700px) {
  .criteria-callout { display: none; }
}

@media (prefers-reduced-motion: reduce) { /* see §6.6 */ }
```

The report screen's two-column grid (`.report-grid`) is intentionally **not** responsive/stacking — stacking would double total content height (screenshot + criteria, one after another), which can't fit one viewport at any width. Narrow side-by-side columns still fit; a stacked layout wouldn't.

---

## 9. Z-index

Only one explicit layer above the base stacking order:

| Value | Element |
|---|---|
| `20` | `.model-picker-popover`, `.api-key-popover` |

---

## 10. Structural / layout invariants

- **Hard zero-scroll guarantee**: `html, body { overflow: hidden; height: 100%; }` plus `#root`, `.page`, `.screen--report`, `.criteria-report`, `.criterion-card` all chain `height:100%; min-height:0; overflow:hidden`. The only two exceptions, both deliberate and both scrollable-in-place rather than resizing: the screenshot pane (`.shot-frame`, `overflow-y:auto`) and the paginated findings/verdict text boxes (JS `scrollTo`, not a visible scrollbar).
- **`box-sizing: border-box`** globally via `* { box-sizing: border-box; }`.
- **Focus ring**: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` globally; a few controls (URL bar, API-key input) override with a bespoke focus treatment instead (background wash / border-color) rather than the default ring.
- **`.sr-only`**: standard visually-hidden-but-announced pattern for form labels that have redundant visible context.

---

## 11. Component color-binding pattern

Rather than hard-coding a color per component, five places accept a color *in* via an inline CSS custom property set from JS, then every visual detail of that component reads from it with a fallback:

```css
background: var(--criterion-color, var(--accent-strong));
```

| Custom property | Set by | Consumed by |
|---|---|---|
| `--criterion-color` | `CriteriaReport.jsx` (active criterion) | card border/bg, score-bar fill, rating pips, dot, "Change this" box, finding index number |
| `--tab-color` | `CriteriaTabs.jsx` (per tab) | tab dot color |
| `--chip-color` | `App.jsx` (per example URL) | example-chip text tint |

This is the mechanism that lets one five-color palette (§1.6) drive an arbitrary number of UI details without duplicating color logic per component.
