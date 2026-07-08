# Landing Page Teardown

Paste a URL, get back a full-page screenshot and a Claude-powered conversion
teardown — five criteria (message & value prop, call to action, trust &
credibility, friction & clarity, urgency & motivation), each with a handful
of short findings (rated 1-5) and one concrete "change this" fix. Bring your
own Claude API key; there's no free rule-based mode.

## Quickstart

```bash
git clone https://github.com/yarinbruner/landing-page-teardown-tool.git
cd landing-page-teardown-tool
npm run setup   # installs both server + web deps, and Playwright's Chromium
npm run dev     # runs both dev servers together
```

Open http://localhost:5173. Either add your own Claude API key (click "add
one"), or check "Test mode — mock data, no API cost" to try the UI for free
with canned data. Enter a URL (e.g. `stripe.com`) and click "Tear it down →".

## Structure

- `server/` — Node/Express API. Uses Playwright (headless Chromium) to load
  the page, screenshot it, and extract headline/CTA/trust/form DOM data;
  `server/src/expertTeardown.js` sends that data plus the screenshots to
  Claude, which runs the Chain of Thought teardown described in
  `TEARDOWN_EXPERT.md` (Observe → Hypothesize → Find the Conflict → Rate,
  applying MECLABS, Fogg, JTBD, Cialdini, and a practical conversion
  playbook as internal reasoning) and returns the five-criteria report.
  `server/src/scoreAggregation.js` turns Claude's per-finding 1-5 ratings
  into the section bars and the overall 1-10 score.
- `web/` — Vite/React UI, dark/monochrome design. URL input → report with
  the full-page screenshot alongside a tabbed criteria panel (bars, rated
  findings, one emphasized fix per section).

Screenshots are written to `server/screenshots/` and served statically —
clear that folder any time to free disk space.

## Scoring

Each finding gets a 1-5 rating from Claude (5 = working well, 1 = seriously
broken). The app computes everything else — it's not a plain average and
not bottlenecked by the single weakest thing: stronger findings are weighted
more heavily than weak ones, so a page that's mostly excellent with one real
gap scores better than an average would suggest, while still surfacing that
gap as the section's "change this" fix.

## How the teardown works

It's bring-your-own-key: in the UI, click "add one" next to "No Claude API
key added" and paste a key from console.anthropic.com. The key is saved only
in your browser's `localStorage` and sent to this app's own backend as a
request header on each teardown call — the server never stores it or reads
it from its own environment. Every user of a shared deployment pays for
their own usage.

```bash
curl -X POST http://localhost:3001/api/expert-teardown \
  -H "Content-Type: application/json" \
  -H "x-anthropic-api-key: sk-ant-..." \
  -d '{"url":"stripe.com"}'
```

Without a key (and test mode off), the endpoint returns a 400 asking for
one; an invalid key returns a 401 rather than failing the rest of the app.

### Test mode (no API key needed)

Check "Test mode — mock data, no API cost" in the UI, or pass `"mock": true`
in the request body, to run the real screenshot/DOM-extraction pipeline but
skip the Claude call in favor of canned data — useful for trying out or
developing the UI without spending API credits.
