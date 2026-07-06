# Landing Page Teardown

Paste a URL, get back a full-page screenshot marked up against conversion
best practices for headline clarity, call-to-action strength, and trust
signals. Pure rule-based scoring — no external API, no API key, runs
entirely on your machine.

## Structure

- `server/` — Node/Express API. Uses Playwright (headless Chromium) to load
  the page, screenshot it, and extract headline/CTA/trust-signal DOM data;
  `server/src/scoring.js` grades that data against a fixed rubric.
- `web/` — Vite/React UI. URL input → annotated screenshot with numbered
  pins + pass/fail checklists per category.

## Running it

```bash
# Terminal 1 — API + screenshotting (installs a headless Chromium on first run)
cd server
npm install
npx playwright install chromium
npm start          # http://localhost:3001

# Terminal 2 — UI
cd web
npm install
npm run dev         # http://localhost:5173
```

Open http://localhost:5173, enter a URL (e.g. `stripe.com`), click "Tear it
down →".

## How scoring works

Each category is scored 0–100 from a fixed set of weighted checks — see
`server/src/scoring.js` for the full rubric:

- **Headline** — single clear H1, scannable length, above the fold,
  visually prominent, avoids generic phrasing, states a concrete benefit.
- **Call to action** — exists, above the fold, action-oriented text,
  contrast ratio, tap-target size, not overloaded with competing CTAs,
  removes signup friction nearby.
- **Trust signals** — customer/partner logos, security badges, testimonials
  or ratings, quantified social proof, guarantee/risk-reversal copy, real
  contact info.

Screenshots are written to `server/screenshots/` and served statically —
clear that folder any time to free disk space.
