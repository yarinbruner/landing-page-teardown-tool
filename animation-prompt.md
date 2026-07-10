# Animation Polish Prompt — Apple-feel

Do NOT touch layout, colors, spacing, or typography. Animations only.

---

## THE APPLE ANIMATION PHILOSOPHY

Apple animations follow three rules:
1. Physics over timing — things decelerate like real objects, never move at constant speed
2. Purposeful — every animation communicates a state change, never decorates for its own sake
3. Felt, not noticed — if the user consciously thinks "nice animation," it's probably too much

---

## THE EASING LIBRARY (use only these — never linear, never ease-in-out default)

```css
/* Fast start, soft landing — most common, use for entrances and hover */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

/* Spring with slight overshoot — modals, cards popping in, confirmations */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Gentle, symmetrical — toggles, tabs, subtle state changes */
--ease-in-out-soft: cubic-bezier(0.45, 0, 0.55, 1);

/* Quick snap in, instant out — press states, micro-interactions */
--ease-out-quick: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

---

## ANIMATION RULES BY ELEMENT TYPE

**Buttons / clickable elements**
- Hover: `transform: translateY(-1px)` + shadow increase, `150ms var(--ease-out-expo)`
- Press (active): `transform: scale(0.97)`, `100ms var(--ease-out-quick)`
- Release: spring back with `--ease-spring`, `200ms`
- Never move buttons more than 2px — subtlety is the point

**Cards**
- Hover: `transform: translateY(-3px)` + shadow upgrade (sm → md), `200ms var(--ease-out-expo)`
- Do not scale cards — translateY only
- Shadow transition must be included or it looks broken

**Modals / sheets / drawers**
- Enter: `opacity: 0 → 1` + `transform: scale(0.96) → scale(1)`, `300ms var(--ease-spring)`
- Exit: `opacity: 1 → 0` + `transform: scale(0.96)`, `200ms var(--ease-in-out-soft)` — exits are always faster than entrances
- Backdrop: `opacity: 0 → 0.4`, `300ms var(--ease-out-expo)`

**Dropdowns / tooltips / popovers**
- Enter: `opacity: 0 → 1` + `transform: translateY(-4px) → translateY(0)` + `scale(0.97) → scale(1)`, `200ms var(--ease-spring)`
- Exit: reverse, `150ms var(--ease-in-out-soft)` — snappy exit

**Lists and grids (staggered entrance)**
- Each item: `opacity: 0 → 1` + `transform: translateY(8px) → translateY(0)`, `400ms var(--ease-out-expo)`
- Stagger delay: `50ms × item index` (cap at 300ms total — don't stagger more than 6 items)
- Items should feel like they're settling into place, not flying in

**Page / view transitions**
- Outgoing: `opacity: 1 → 0` + `transform: translateX(-8px)`, `200ms var(--ease-in-out-soft)`
- Incoming: `opacity: 0 → 1` + `transform: translateX(8px) → translateX(0)`, `300ms var(--ease-out-expo)`

**Input fields (focus)**
- Border color transition: `150ms var(--ease-out-expo)`
- No transform — inputs don't move
- Optional: subtle ring/glow fade in on focus, same timing

**Toggle / checkbox / switch**
- Thumb slide: `200ms var(--ease-spring)` — the spring overshoot is what makes toggles feel satisfying
- Color change: `150ms var(--ease-out-expo)`

**Loading states**
- Skeleton shimmer: linear gradient animation, `1.5s ease-in-out infinite` — this is the one place ease-in-out is correct
- Spinner: `rotation 800ms linear infinite` — also correct here
- Fade in on data load: `opacity: 0 → 1`, `300ms var(--ease-out-expo)`

**Icons**
- Hover rotation (chevrons, arrows): `transform: rotate(Xdeg)`, `200ms var(--ease-out-expo)`
- State change (e.g. close/open): `200ms var(--ease-spring)` for the overshoot feel

---

## EXECUTION INSTRUCTIONS

1. Audit every interactive element in the UI — buttons, cards, modals, inputs, dropdowns, lists, icons
2. For each element, implement the animation pattern defined above
3. Take a screenshot, then interact with the element and observe the animation
4. Ask: does it feel physical? Does it decelerate naturally? Is it too fast, too slow, too dramatic?
5. Adjust timing first (±50ms), then easing, then transform values — in that order
6. Never add an animation that doesn't correspond to a state change

## TIMING CALIBRATION GUIDE

Too fast (feels broken): < 100ms for anything the eye needs to track
Too slow (feels sluggish): > 400ms for anything except page transitions
The Apple sweet spot: 150–300ms for most interactions

If something feels wrong, halve the duration before changing the easing.

## ONE FINAL CHECK

Play through the entire UI — hover everything, open every modal, click every button.
Ask: does it feel like gravity exists? Do things settle into place rather than snap?
If yes, you're done. If anything still feels digital and rigid, find it and add the appropriate spring.
