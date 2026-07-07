# How This Tool Was Built (A Gentle Intro to Programming)

This file is different from a user manual. It's not about what happens when
you click the button — it's about **what the code actually is**, and what
an AI coding assistant (like Claude Code) is really doing when it "builds"
or "fixes" something like this. If you've never written a line of code,
this should still make sense by the end.

---

## 1. What even *is* "code"?

Code is just very precise, very literal instructions, written in a
language a computer can follow exactly — no guessing, no "you know what I
mean." A computer will do *exactly* what the code says, even if that's
obviously not what you meant, which is why so much of programming is about
being painfully specific.

This whole project is written in **JavaScript**, one of the most common
programming languages, mostly because it's the language web browsers
understand natively.

---

## 2. The big picture: two programs that talk to each other

This tool is actually two separate little programs living in two folders:

```
server/   →  the "backend" — does the real work, invisible to you
web/      →  the "frontend" — the page you actually look at and click
```

**Why split them up?** Because they need different superpowers:

- The backend needs to control a real web browser, visit other websites,
  and take screenshots — your browser tab can't do that (a webpage isn't
  allowed to reach out and control other websites for security reasons).
  So the backend is a plain Node.js program — JavaScript running directly
  on a computer, not inside a browser tab.
- The frontend just needs to draw boxes, text, and buttons on your screen
  — a job browsers are built for. It's written using **React**, a very
  popular toolkit for building interactive pages out of reusable pieces
  (buttons, cards, score badges) instead of one giant tangle of HTML.

They talk to each other the same way your browser talks to any website: by
sending a **request** ("please analyze etoro.com") to a fixed address and
waiting for a **response** ("here's the score and screenshot") to come
back. This request/response pattern is called an **API** — think of it
like a restaurant's order window: you don't walk into the kitchen
yourself, you hand your order to a specific window (here, that "window" is
the address `/api/analyze`) and the kitchen hands a plate back out.

---

## 3. A few building blocks you'll see everywhere in the code

These four ideas cover almost everything happening in this project.

### Variables — labeled boxes

```js
const url = "etoro.com";
```

This just means: "make a box, put the text `etoro.com` in it, and label
the box `url` so I can refer to it later." Nearly every line of code is
either making a box, putting something in a box, or reading what's in one.

### Functions — reusable recipes

```js
function scoreHeadline(data) { ... }
```

A function is a named, reusable set of steps — a recipe. You "call" it by
name whenever you need that recipe done again, instead of retyping all the
steps every time. `scoreHeadline(data)` means: "run the headline-scoring
recipe, using this specific `data` as the ingredients."

This project is built almost entirely out of small functions like this,
each with one clear job: `analyzeUrl()` visits a page and gathers facts,
`scorePage()` grades those facts, `hideInterstitials()` hides popups
before the screenshot, and so on. Big programs are just lots of small,
clearly-named recipes calling each other.

### Objects and arrays — how information gets organized

```js
const heading = { tag: "h1", text: "Yep, it's all in one app", fontSize: 98 };
const headings = [heading, anotherHeading, aThirdHeading];
```

- An **object** (the `{ ... }` part) is a labeled bundle of related facts
  — like a single index card with several fields filled in.
- An **array** (the `[ ... ]` part) is just an ordered list of things —
  here, a list of index cards, one per heading found on the page.

Almost every piece of data in this app — the list of buttons found on a
page, the three category scores, the checklist of pass/fail items — is
just objects and arrays nested inside each other. Once you can read
`{ score: 85, verdict: "Strong" }` as "an index card with two fields on
it," you can read most of this codebase.

There's a specific text format for writing objects/arrays that both the
backend and frontend agree on, called **JSON** — it's genuinely just
`{ }`s and `[ ]`s written out as plain text, sent over the network and
turned back into real objects on the other end.

### Waiting for slow things: `async` and `await`

Visiting a website and waiting for it to load takes real time — maybe a
few seconds. Code that just froze the whole program for those few seconds
would be unusable. So JavaScript has a special way of saying "start this
slow thing, and let me know when it's done, without freezing everything
else in the meantime":

```js
const page = await browser.newPage();
await page.goto(url);
```

`await` literally means "pause *this specific recipe* here until the slow
thing finishes, then continue with the result" — while the rest of the
program can still respond to other things. You'll see the word `await`
in front of almost every line that talks to the browser, the screenshot
system, or the AI — anything that takes real-world time.

---

## 4. Following one real request through the code

Say you type `etoro.com` and click the button. Here's the actual path
through the real files, in order:

1. **`web/src/App.jsx`** (frontend) — your click runs a function that
   sends a request to the backend: "please analyze `etoro.com`."
2. **`server/src/index.js`** (backend, the "order window") — receives
   that request at the address `/api/analyze` and hands it off.
3. **`server/src/analyzer.js`** — does the actual browsing:
   - Opens an invisible Chrome browser using a tool called **Playwright**
     (a library — pre-written code someone else built that we get to
     reuse instead of writing our own browser-controller from scratch).
   - Visits the real website.
   - Scrolls down, waits for images/fonts, and hides popups/cookie
     banners/accessibility widgets (functions written specifically for
     this project).
   - Takes two screenshots and reads the page's structure — its
     **DOM**, which is just the browser's internal map of every element
     on the page (this heading, that button, this image) — using
     something called **CSS selectors**: tiny search patterns like
     `"h1, h2"` (find every `h1` and `h2` element) or `"button, a"` (find
     every button and every link).
4. **`server/src/scoring.js`** — takes the facts `analyzer.js` gathered
   and runs them through a fixed checklist, using things like **regular
   expressions** (regex) — a mini pattern-matching language for text,
   e.g. `/\bcookies?\b/i` means "find the word 'cookie' or 'cookies'
   anywhere in this text, ignoring capitalization." This is how the tool
   spots things like guarantee language or social-proof numbers in a
   page's text.
5. Back through `index.js`, the whole result (screenshots + scores, all
   packed as JSON) is sent back to the browser.
6. **`web/src/App.jsx`** receives it and draws the report card you see.

That's the entire trip — six files, each with one job, calling into the
next.

---

## 5. What is Claude Code actually *doing* when it "fixes a bug"?

This project went through several real rounds of debugging in this
conversation, and they're a genuinely good example of what programming
work actually looks like day to day — it's much more about **investigating**
than about typing new code.

**Round 1 — cookie banners showing up in screenshots.**
The fix wasn't guessing at code — it was: read the existing file to
understand what was already there, notice the screenshot was taken
*before* any cleanup happened, and reorder the steps so cleanup happens
first. Then — importantly — *test it*: write a tiny fake webpage with a
fake cookie banner, run the real code against it, and look at the actual
screenshot to confirm the banner was really gone. Code that "looks right"
isn't trusted until it's been run and observed.

**Round 2 — an accessibility icon that wouldn't go away.**
This one is a great example of real debugging. The first fix (hiding the
element with code) *looked* correct but didn't work when tested live. Instead
of guessing again, the next step was forming a hypothesis ("maybe something
is un-hiding it") and writing a tiny throwaway experiment: hide it, wait a
moment, then check if it's still hidden. That experiment revealed the real
cause — the widget's own script was watching for tampering and reversing
it within milliseconds, on purpose (a legitimate anti-tampering design by
that vendor). Once the *real* cause was known, the fix changed
completely: instead of fighting the widget after it loads, block its
script from ever being downloaded in the first place, using Playwright's
network controls.

**The pattern in both cases:**

```
1. Something's wrong
2. Read the relevant code — don't assume, actually look
3. Form a specific, testable guess about *why*
4. Run a small, real test to check that guess
5. If the test disproves the guess, form a new one and repeat
6. Once the real cause is confirmed, make the smallest fix that addresses it
7. Test the actual fix against the real thing, not just "it should work"
```

That loop — guess, test, learn, adjust — is most of what programming
actually is, far more than memorizing syntax.

---

## 6. A tiny glossary, for looking things up later

| Term | Plain-English meaning |
|---|---|
| Function | A named, reusable set of steps |
| Variable | A labeled box holding a piece of information |
| Object | A labeled bundle of related facts (`{ score: 85 }`) |
| Array | An ordered list of things (`[a, b, c]`) |
| JSON | The plain-text format used to send objects/arrays between programs |
| API / endpoint | A fixed address one program listens on for requests from another |
| `async` / `await` | How code waits for slow things without freezing everything else |
| DOM | A browser's internal map of every element on a page |
| CSS selector | A tiny search pattern for finding elements on a page (`"h1"`, `".button"`) |
| Regex | A tiny pattern-matching language for text (`/\bcookies?\b/i`) |
| Library | Pre-written code someone else built that you reuse instead of rewriting |
| Frontend | The part of an app that draws what you see and click |
| Backend | The part of an app that does work invisibly, behind the scenes |
