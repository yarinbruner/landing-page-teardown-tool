import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const VIEWPORT = { width: 1440, height: 900 };
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
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
