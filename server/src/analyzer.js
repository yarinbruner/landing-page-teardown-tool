import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const VIEWPORT = { width: 1440, height: 900 };
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Some accessibility-overlay vendors (accessiBe confirmed; likely others)
// run a watchdog that reverts DOM/CSS attempts to hide their widget within
// milliseconds — a deliberate anti-tampering design so a page can't silently
// disable accessibility tools. Fighting that in the DOM is a losing battle,
// so instead the vendor's script is never allowed to load: no request, no
// widget, nothing to hide.
const ACCESSIBILITY_WIDGET_DOMAINS = [
  "acsbapp.com", // accessiBe
  "userway.org",
  "equalweb.com",
  "audioeye.com",
  "monsido.com",
  "reciteme.com",
  "nagich.co.il", // Israeli/Hebrew-market vendor
];

function isAccessibilityWidgetRequest(url) {
  return ACCESSIBILITY_WIDGET_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
}

const CONSENT_SELECTORS = [
  "#onetrust-banner-sdk", "#onetrust-consent-sdk", ".onetrust-pc-dark-filter",
  "#CybotCookiebotDialog", "#CybotCookiebotDialogBodyUnderlay",
  ".qc-cmp2-container", "#qc-cmp2-container", ".cmpbox", "#cmpbox", "#cmpwrapper",
  "#didomi-host", ".didomi-popup-backdrop",
  "#truste-consent-track", ".truste_overlay", "#truste-consent-content",
  "#usercentrics-root", "#usercentrics-cmp-ui",
  ".osano-cm-window", ".osano-cm-dialog",
  "#iubenda-cs-banner", ".iubenda-cs-overlay",
  ".cc-window", ".cc-banner", ".cookieconsent",
  "#cookiescript_injected", ".cookiescript_wrapper",
  "#cookie-law-info-bar", ".cli-modal-backdrop",
  "#CookieConsent", ".cookie-consent-banner",
  "#klaro", ".klaro",
  "#termly-code-snippet-support", ".t-cc",
  ".fc-consent-root",
  "div[id^='sp_message_container_']",
  ".evidon-banner", "#_evidon_banner",
  ".borlabs-cookie", "#BorlabsCookieBox",
  "#hs-eu-cookie-confirmation",
  "[class*='cookie-consent' i]", "[id*='cookie-consent' i]",
  "[class*='cookiebanner' i]", "[id*='cookiebanner' i]",
  "[class*='cookie-banner' i]", "[id*='cookie-banner' i]",
  "[aria-label*='cookie' i]", "[aria-label*='consent' i]",
];

// Third-party accessibility-overlay widgets (UserWay, accessiBe, EqualWeb, ...
// and the Hebrew-market equivalents like Nagich) inject a persistent floating
// icon button that isn't part of the site's own design or copy — it just
// pollutes screenshots and gets picked up as a stray CTA/image if not excluded.
const ACCESSIBILITY_WIDGET_SELECTORS = [
  "[id*='userway' i]", "[class*='userway' i]",
  "[id*='accessibe' i]", "[class*='accessibe' i]", "#acsb", ".acsb-trigger",
  "[id*='equalweb' i]", "[class*='equalweb' i]", "[id*='eww-' i]", "[class*='eww-' i]",
  "[id*='audioeye' i]", "[class*='audioeye' i]",
  "[id*='monsido' i]", "[class*='monsido' i]",
  "[id*='reciteme' i]", "[class*='recite-me' i]",
  "[id*='aioa' i]", "[class*='aioa' i]",
  "[id*='nagich' i]", "[class*='nagich' i]",
  "[class*='accessibility-widget' i]", "[id*='accessibility-widget' i]",
  "[class*='accessibility-icon' i]", "[id*='accessibility-icon' i]",
  "[class*='accessibility-menu' i]", "[id*='accessibility-menu' i]",
  "[aria-label*='accessibility' i]", "[title*='accessibility' i]",
  "access-widget-ui", // AccessWidget's custom element (e.g. eToro)
];

/**
 * Evaluated in the page *before* screenshots are taken. Three kinds of chrome
 * get hidden here, none of which are the page's own content:
 *
 * 1. Cookie/consent banners — vendor DOM markers plus a structural fallback
 *    for edge-anchored banners we don't recognize by name.
 * 2. Generic popups/modals — newsletter signups, personalization surveys,
 *    promo interstitials, language pickers. Unlike consent banners there's
 *    no fixed vendor list (every site rolls its own), so this relies on
 *    structure: an ARIA dialog, or a fixed/absolute card of substantial
 *    size with a close ("×"/"close"/"dismiss") affordance, optionally paired
 *    with a dimming backdrop. Centered/large, as opposed to consent banners'
 *    edge-anchored strips.
 * 3. Accessibility-overlay widgets (UserWay, accessiBe, EqualWeb, Nagich,
 *    ...) — a persistent floating icon button that's third-party chrome,
 *    not the site's own design; caught by vendor markers, an
 *    accessibility-labeled aria-label/title (English or Hebrew), or the
 *    structural shape of a small icon-only button pinned to a screen corner.
 *
 * Matches are hidden with display:none so they disappear from both the
 * screenshot and (via the existing isVisible/innerText checks) the
 * extracted page data.
 *
 * Keep dependency-free (no closures over outer scope) — only the function
 * body is serialized by Playwright, so the selector lists are passed in as
 * an argument instead of being referenced directly.
 */
function hideInterstitials({ consentSelectors, accessibilityWidgetSelectors }) {
  const roots = new Set();
  for (const sel of consentSelectors) {
    try {
      document.querySelectorAll(sel).forEach((el) => roots.add(el));
    } catch {
      // Some engines choke on the :i flag / unsupported selectors — skip.
    }
  }

  // Consent fallback #1: an ARIA dialog pinned to a viewport edge, spanning
  // most of the width — the structural shape of almost every consent
  // banner regardless of vendor.
  document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.position !== "fixed" && style.position !== "sticky") return;
    const r = el.getBoundingClientRect();
    const nearEdge = r.top <= 4 || window.innerHeight - r.bottom <= 4;
    const wide = r.width >= window.innerWidth * 0.6;
    if (nearEdge && wide) roots.add(el);
  });

  // Consent fallback #2: a fixed/sticky, edge-anchored banner shape whose
  // own text reads as a cookie notice in English or Hebrew. Covers
  // home-grown banners that don't match a known CMP's selectors. Requiring
  // the structural shape *and* the text (not text alone) keeps this from
  // misfiring on ordinary content that just happens to mention "cookies".
  const COOKIE_TEXT_PATTERNS = [
    /\bcookies?\b/i,
    /\bcookie (policy|settings|preferences|notice)\b/i,
    /\bmanage (cookie )?preferences\b/i,
    /עוגי(ה|ות)/, // "cookie(s)" in Hebrew
  ];
  const consentRootsSoFar = Array.from(roots);
  Array.from(document.body.querySelectorAll("div, section, aside, footer")).forEach((el) => {
    if (consentRootsSoFar.some((root) => root.contains(el))) return;
    const style = window.getComputedStyle(el);
    if (style.position !== "fixed" && style.position !== "sticky") return;
    const r = el.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.4 || r.height < 20 || r.height > window.innerHeight * 0.9) return;
    const nearEdge = r.top <= 8 || window.innerHeight - r.bottom <= 8;
    if (!nearEdge) return;
    const text = (el.innerText || "").trim();
    if (!text || text.length > 600) return; // banners are short — skip large page wrappers
    if (COOKIE_TEXT_PATTERNS.some((re) => re.test(text))) roots.add(el);
  });

  // Generic popup/modal #1: explicit ARIA dialogs. Unlike the consent-banner
  // dialog fallback above (edge-anchored strips), these are the centered,
  // page-blocking kind — any reasonably sized one is almost certainly an
  // interstitial rather than page content, since real content is never
  // marked role="dialog".
  document.querySelectorAll('[role="dialog"], [role="alertdialog"], [aria-modal="true"]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 100) return;
    roots.add(el);
  });

  // Generic popup/modal #2: a fixed/absolute card with a close affordance —
  // covers custom-built newsletter/survey/promo popups that don't use ARIA
  // dialog semantics. Requiring both the size/position shape *and* a close
  // control keeps this from grabbing ordinary fixed page furniture (sticky
  // headers, floating cart buttons) that has no way to be dismissed.
  const CLOSE_HINTS = ["close", "dismiss", "no thank", "×", "✕", "✖"];
  const modalRootsSoFar = Array.from(roots);
  Array.from(document.body.querySelectorAll("div, section")).forEach((el) => {
    if (modalRootsSoFar.some((root) => root.contains(el) || el.contains(root))) return;
    const style = window.getComputedStyle(el);
    if (style.position !== "fixed" && style.position !== "absolute") return;
    const r = el.getBoundingClientRect();
    const area = r.width * r.height;
    if (area < window.innerWidth * window.innerHeight * 0.15) return;
    if (r.width > window.innerWidth * 0.98 && r.height > window.innerHeight * 0.98) return; // full-viewport backdrop, not the card itself
    const hasCloseControl = Array.from(el.querySelectorAll('button, a, [role="button"], [aria-label]')).some((btn) => {
      const label = `${btn.getAttribute("aria-label") || ""} ${btn.textContent || ""}`.trim().toLowerCase();
      if (!label || label.length > 30) return false;
      return CLOSE_HINTS.some((hint) => label.includes(hint));
    });
    if (hasCloseControl) roots.add(el);
  });

  // Generic popup/modal #3: the dimming backdrop that sits behind a modal
  // caught above. Hiding only the card can leave a dark scrim covering the
  // real page, so also hide any fixed, full-viewport, semi-transparent
  // overlay — the visual signature of a modal backdrop.
  const modalRootsForBackdrop = Array.from(roots);
  Array.from(document.querySelectorAll("div")).forEach((el) => {
    if (modalRootsForBackdrop.some((root) => root === el)) return;
    const style = window.getComputedStyle(el);
    if (style.position !== "fixed") return;
    const r = el.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.95 || r.height < window.innerHeight * 0.95) return;
    const match = style.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!match) return;
    const parts = match[1].split(",").map((n) => parseFloat(n));
    const alpha = parts.length === 4 ? parts[3] : 1;
    if (alpha > 0.05 && alpha < 0.98) roots.add(el);
  });

  // Accessibility-overlay widgets: known vendor DOM markers.
  for (const sel of accessibilityWidgetSelectors) {
    try {
      document.querySelectorAll(sel).forEach((el) => roots.add(el));
    } catch {
      // Unsupported selector syntax on this engine — skip.
    }
  }

  // Accessibility fallback: aria-label/title naming accessibility, in
  // English or Hebrew, on an unrecognized vendor's widget.
  const ACCESSIBILITY_TEXT_PATTERNS = [/accessib/i, /נגיש/];
  document.querySelectorAll("[aria-label], [title]").forEach((el) => {
    const label = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`.trim();
    if (!label || label.length > 60) return;
    if (ACCESSIBILITY_TEXT_PATTERNS.some((re) => re.test(label))) roots.add(el);
  });

  // Accessibility fallback: a small, icon-only button fixed near a screen
  // corner — the near-universal shape of an accessibility-widget launcher
  // regardless of vendor naming.
  document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
    const text = (el.innerText || "").trim();
    if (text.length > 2) return; // real CTAs have visible text; icon launchers don't
    const style = window.getComputedStyle(el);
    if (style.position !== "fixed") return;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.width > 90 || r.height < 24 || r.height > 90) return;
    const nearCorner =
      (r.top <= 140 || window.innerHeight - r.bottom <= 140) &&
      (r.left <= 140 || window.innerWidth - r.right <= 140);
    if (nearCorner) roots.add(el);
  });

  // Accessibility fallback: web-component widgets (custom element + shadow
  // root) render their actual icon inside the shadow tree, which can leave
  // the host element's own box collapsed to 0×0 in the light DOM — none of
  // the size-based checks above can see them. Match by custom-element tag
  // name instead; hiding the host still hides everything in its shadow root.
  document.querySelectorAll("*").forEach((el) => {
    if (!el.shadowRoot) return;
    if (/access.*widget|a11y-|nagich/i.test(el.tagName)) roots.add(el);
  });

  roots.forEach((el) => {
    el.style.setProperty("display", "none", "important");
  });
}

/**
 * Extracted inside the page context. Keep dependency-free (no closures over
 * outer scope) since only the function body is serialized by Playwright.
 */
function extractPageData(viewportHeight) {
  const CTA_SELECTOR = "button, a, input[type=submit], input[type=button], [role=button]";
  const HEADING_SELECTOR = "h1, h2";

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") return false;

    // Collapsed dropdown/mega-menu items often keep full-size, non-hidden
    // rects even while a clipped ancestor (max-height:0, overflow:hidden,
    // off-screen transform) makes them invisible to a real visitor. For
    // anything within the current viewport we can confirm real paint with
    // elementFromPoint; below-the-fold content can't be checked this way
    // without scrolling, so it falls back to the cheaper check above.
    if (r.top >= 0 && r.top < window.innerHeight && r.left >= 0 && r.left < window.innerWidth) {
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
      const hit = document.elementFromPoint(cx, cy);
      if (!hit || !(el.contains(hit) || hit.contains(el))) return false;
    }
    return true;
  }

  function textOf(el) {
    return (el.innerText || el.value || el.getAttribute("aria-label") || "").trim();
  }

  // --- Headings ---
  // Consent banners, popups, and accessibility widgets are already hidden
  // (display:none, see hideInterstitials) by the time this runs, so
  // isVisible()/innerText naturally exclude them without special-casing here.
  const headings = Array.from(document.querySelectorAll(HEADING_SELECTOR))
    .filter(isVisible)
    .map((el) => {
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        text: textOf(el),
        fontSize: parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
        rect: rectOf(el),
      };
    })
    .filter((h) => h.text.length > 0);

  // Body font size baseline for relative comparisons
  const bodyFontSize = parseFloat(window.getComputedStyle(document.body).fontSize) || 16;

  // --- CTAs ---
  const seen = new Set();
  const ctas = Array.from(document.querySelectorAll(CTA_SELECTOR))
    .filter(isVisible)
    .map((el) => {
      // Only trust visible text for CTAs — aria-label alone usually means an
      // icon/logo link (e.g. a header logo labeled "Acme homepage"), not a CTA.
      const text = (el.innerText || el.value || "").trim();
      const style = window.getComputedStyle(el);
      const rect = rectOf(el);
      return {
        tag: el.tagName.toLowerCase(),
        text,
        href: el.getAttribute("href") || null,
        backgroundColor: style.backgroundColor,
        color: style.color,
        fontSize: parseFloat(style.fontSize),
        paddingTop: parseFloat(style.paddingTop) || 0,
        paddingBottom: parseFloat(style.paddingBottom) || 0,
        inNavChrome: !!el.closest('nav, header, [role="navigation"]'),
        rect,
      };
    })
    .filter((c) => {
      if (!c.text || c.text.length === 0 || c.text.length > 60) return false;
      if (c.rect.width < 20 || c.rect.height < 10) return false;
      const key = `${c.text}|${Math.round(c.rect.x)}|${Math.round(c.rect.y)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // --- Images (for logo strips / trust badges) ---
  const images = Array.from(document.querySelectorAll("img"))
    .filter(isVisible)
    .map((el) => ({
      alt: (el.getAttribute("alt") || "").trim(),
      src: el.getAttribute("src") || "",
      rect: rectOf(el),
    }))
    .filter((img) => img.rect.width > 0);

  // --- Star rating / review widgets ---
  const ratingElements = Array.from(
    document.querySelectorAll(
      "[class*=star], [class*=rating], [aria-label*=star], [aria-label*=Star], [class*=review], [itemtype*=Review], [itemprop=ratingValue]"
    )
  )
    .filter(isVisible)
    .map((el) => ({ text: textOf(el).slice(0, 120), rect: rectOf(el) }));

  const bodyText = document.body.innerText || "";

  return {
    title: document.title,
    metaDescription:
      document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    headings,
    bodyFontSize,
    ctas,
    images,
    ratingElements,
    bodyText: bodyText.slice(0, 20000),
    viewportHeight,
    pageHeight: document.documentElement.scrollHeight,
  };
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    let lastHeight = 0;
    // Cap iterations so an infinite-scroll page can't hang the request forever.
    for (let i = 0; i < 40; i++) {
      window.scrollBy(0, step);
      await new Promise((r) => setTimeout(r, 120));
      const height = document.documentElement.scrollHeight;
      const atBottom = window.innerHeight + window.scrollY >= height - 2;
      if (atBottom && height === lastHeight) break;
      lastHeight = height;
    }
  });
}

async function waitForImagesAndFonts(page) {
  const evaluatePromise = page.evaluate(() => {
    const imagesLoaded = Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
        )
    );
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    return Promise.all([imagesLoaded, fontsReady]);
  });

  // A single stuck image (blocked request, dead CDN) shouldn't hang the
  // whole analysis — cap the wait and move on with whatever has loaded.
  const timeout = new Promise((resolve) => setTimeout(resolve, 6000));
  await Promise.race([evaluatePromise, timeout]).catch(() => {});
}

export async function analyzeUrl(rawUrl) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 LandingPageTeardown/1.0",
    });
    await context.route(
      (routeUrl) => isAccessibilityWidgetRequest(routeUrl),
      (route) => route.abort()
    );
    const page = await context.newPage();

    // "load" is a more reliable completion signal than "networkidle" — plenty
    // of sites keep a persistent connection alive (chat widgets, analytics,
    // websockets) and never go idle, which used to make us fall through to
    // "domcontentloaded" and screenshot a barely-parsed page.
    await page.goto(url, { waitUntil: "load", timeout: 30000 }).catch(async () => {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    });

    // Many landing pages lazy-load hero/below-the-fold images and fonts only
    // once they scroll into view (native loading="lazy" or JS/IntersectionObserver
    // based lazy-loaders). Walk the page top to bottom first so a full-page
    // screenshot doesn't capture a column of unloaded placeholders.
    await autoScroll(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await waitForImagesAndFonts(page);
    await page.waitForTimeout(400); // let CSS transitions/animations settle

    // Hide cookie banners, generic popups/modals, and accessibility-widget
    // chrome before capturing anything — otherwise they end up in the
    // screenshot and get torn down as if they were part of the landing
    // page's own design.
    await page.evaluate(hideInterstitials, {
      consentSelectors: CONSENT_SELECTORS,
      accessibilityWidgetSelectors: ACCESSIBILITY_WIDGET_SELECTORS,
    });

    const id = randomUUID();
    const fullPath = path.join(SCREENSHOT_DIR, `${id}-full.png`);
    const foldPath = path.join(SCREENSHOT_DIR, `${id}-fold.png`);

    await page.screenshot({ path: foldPath });
    await page.screenshot({ path: fullPath, fullPage: true });

    const data = await page.evaluate(extractPageData, VIEWPORT.height);

    await context.close();

    return {
      id,
      url,
      viewport: VIEWPORT,
      screenshots: {
        full: `${id}-full.png`,
        aboveFold: `${id}-fold.png`,
      },
      ...data,
    };
  } finally {
    await browser.close();
  }
}
