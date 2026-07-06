const POWER_WORDS = [
  "free", "save", "new", "instant", "guaranteed", "proven", "easy", "simple",
  "fast", "now", "today", "exclusive", "limited", "boost", "unlock", "discover",
  "effortless", "secure", "trusted", "powerful", "custom", "personalized",
  "in minutes", "no risk", "risk-free", "money back", "money-back",
];

const GENERIC_HEADLINE_PHRASES = [
  "welcome to", "home page", "homepage", "we are a", "our company",
  "lorem ipsum", "click here to learn", "untitled", "coming soon",
];

const STRONG_CTA_VERBS = [
  "get", "start", "try", "download", "sign up", "signup", "buy", "book",
  "join", "request", "subscribe", "claim", "unlock", "build", "create",
  "schedule", "reserve", "order", "shop", "explore", "discover", "add to cart",
  "contact", "demo", "install",
];

const WEAK_CTA_TEXTS = ["submit", "click here", "ok", "go", "here"];

const TRUST_KEYWORDS = {
  guarantee: ["money-back", "money back", "guarantee", "guaranteed", "risk-free", "risk free", "no risk", "cancel anytime"],
  security: ["ssl", "secure checkout", "encrypted", "privacy policy", "gdpr", "soc 2", "soc2", "pci compliant"],
  socialProofNumbers: [/\b[\d,]+\+?\s*(customers|users|companies|businesses|teams|reviews|downloads)\b/i, /\b\d(\.\d)?\s*\/\s*5\b/i, /\btrusted by\b/i, /\bas seen in\b/i, /\bas featured in\b/i],
  contact: [/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, /\bcontact us\b/i, /\baddress\b/i],
};

const LOGO_ALT_HINTS = ["logo", "client", "partner", "brand", "featured", "press"];
const BADGE_ALT_HINTS = ["ssl", "secure", "trust", "norton", "mcafee", "bbb", "verified", "guarantee", "award", "certified"];

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function parseRgb(str) {
  if (!str) return null;
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  const [r, g, b, a = 1] = parts;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b, a };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg, bg) {
  const rgbFg = parseRgb(fg);
  const rgbBg = parseRgb(bg);
  if (!rgbFg || !rgbBg) return null;
  // Treat a transparent CTA background as sitting on white (best-effort guess)
  const effectiveBg = rgbBg.a === 0 ? { r: 255, g: 255, b: 255 } : rgbBg;
  const lumFg = relativeLuminance(rgbFg);
  const lumBg = relativeLuminance(effectiveBg);
  const lighter = Math.max(lumFg, lumBg);
  const darker = Math.min(lumFg, lumBg);
  return (lighter + 0.05) / (darker + 0.05);
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function makeCheck(id, label, pass, weight, detail) {
  return { id, label, pass, weight, detail };
}

function scoreFromChecks(checks) {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
  return { score: totalWeight ? Math.round(clamp((earned / totalWeight) * 100)) : 0, checks };
}

// ---------------------------------------------------------------------------
// Headline
// ---------------------------------------------------------------------------
function scoreHeadline(data) {
  const checks = [];
  const headings = data.headings || [];
  const h1s = headings.filter((h) => h.tag === "h1");
  const primary = h1s[0] || headings[0] || null;

  checks.push(
    makeCheck(
      "has_h1",
      "Page has a single, clear H1 headline",
      h1s.length === 1,
      20,
      h1s.length === 0
        ? "No <h1> found — visitors have nothing anchoring what this page is about."
        : h1s.length > 1
        ? `Found ${h1s.length} H1 elements — multiple competing headlines dilute the message.`
        : "Exactly one H1 found."
    )
  );

  if (primary) {
    const wc = wordCount(primary.text);
    checks.push(
      makeCheck(
        "length",
        "Headline length is scannable (6–14 words)",
        wc >= 4 && wc <= 14,
        15,
        `Headline is ${wc} word${wc === 1 ? "" : "s"}. ${
          wc < 4 ? "Too short to convey a value proposition." : wc > 14 ? "Too long — visitors skim, not read." : "Good length."
        }`
      )
    );

    const aboveFold = primary.rect.y < data.viewportHeight;
    checks.push(
      makeCheck(
        "above_fold",
        "Headline appears above the fold",
        aboveFold,
        20,
        aboveFold
          ? "Visible without scrolling."
          : `Headline sits ${Math.round(primary.rect.y)}px down — below the ${data.viewportHeight}px fold.`
      )
    );

    const sizeRatio = primary.fontSize / (data.bodyFontSize || 16);
    checks.push(
      makeCheck(
        "prominence",
        "Headline is visually prominent (large relative to body text)",
        sizeRatio >= 1.8,
        15,
        `Headline font-size is ${Math.round(primary.fontSize)}px vs. ${Math.round(
          data.bodyFontSize
        )}px body text (${sizeRatio.toFixed(1)}x).`
      )
    );

    const lower = primary.text.toLowerCase();
    const isGeneric = GENERIC_HEADLINE_PHRASES.some((p) => lower.includes(p));
    checks.push(
      makeCheck(
        "not_generic",
        "Avoids generic, low-information phrasing",
        !isGeneric,
        15,
        isGeneric
          ? "Headline reads as boilerplate rather than a specific value proposition."
          : "Headline is specific, not boilerplate."
      )
    );

    const hasPowerWord = POWER_WORDS.some((w) => lower.includes(w));
    const hasNumber = /\d/.test(primary.text);
    checks.push(
      makeCheck(
        "value_signal",
        "Communicates a concrete benefit (power word or number)",
        hasPowerWord || hasNumber,
        15,
        hasPowerWord || hasNumber
          ? "Contains a concrete benefit signal."
          : "No benefit-oriented language or numbers — consider stating the outcome the visitor gets."
      )
    );
  } else {
    checks.push(
      makeCheck("length", "Headline length is scannable (6–14 words)", false, 15, "No headline text to evaluate."),
      makeCheck("above_fold", "Headline appears above the fold", false, 20, "No headline text to evaluate."),
      makeCheck("prominence", "Headline is visually prominent", false, 15, "No headline text to evaluate."),
      makeCheck("not_generic", "Avoids generic, low-information phrasing", false, 15, "No headline text to evaluate."),
      makeCheck("value_signal", "Communicates a concrete benefit", false, 15, "No headline text to evaluate.")
    );
  }

  return {
    ...scoreFromChecks(checks),
    primaryText: primary?.text || null,
    rect: primary?.rect || null,
  };
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------
function looksLikeButton(c) {
  if (c.tag === "button" || c.tag === "input") return true;
  const bg = parseRgb(c.backgroundColor);
  return !!bg && bg.a > 0;
}

function pickPrimary(candidates) {
  // Prefer a button-styled element outside the nav/header chrome (the
  // page's real primary action), then any button-styled element (e.g. a
  // nav "Sign up" button), then fall back to first-in-DOM-order.
  return (
    candidates.find((c) => looksLikeButton(c) && !c.inNavChrome) ||
    candidates.find(looksLikeButton) ||
    candidates[0] ||
    null
  );
}

function scoreCta(data) {
  const checks = [];
  const ctas = data.ctas || [];
  const aboveFoldCtas = ctas.filter((c) => c.rect.y < data.viewportHeight);

  checks.push(
    makeCheck(
      "has_cta",
      "At least one clickable call-to-action exists",
      ctas.length > 0,
      20,
      ctas.length > 0
        ? `${ctas.length} clickable elements found across the full page (buttons and links).`
        : "No buttons or CTA-style links detected."
    )
  );

  checks.push(
    makeCheck(
      "above_fold_cta",
      "A CTA is visible above the fold",
      aboveFoldCtas.length > 0,
      25,
      aboveFoldCtas.length > 0
        ? "At least one CTA visible without scrolling."
        : "Visitors must scroll before seeing any call-to-action."
    )
  );

  const primary = pickPrimary(aboveFoldCtas) || pickPrimary(ctas);

  if (primary) {
    const lower = primary.text.toLowerCase().trim();
    const isStrong = STRONG_CTA_VERBS.some((v) => lower.includes(v));
    const isWeak = WEAK_CTA_TEXTS.includes(lower);
    checks.push(
      makeCheck(
        "action_language",
        "Primary CTA uses specific, action-oriented text",
        isStrong && !isWeak,
        20,
        isWeak
          ? `"${primary.text}" is generic — pair the action with the value ("Start free trial" beats "Submit").`
          : isStrong
          ? `"${primary.text}" uses a clear action verb.`
          : `"${primary.text}" doesn't clearly state the action being taken.`
      )
    );

    const ratio = contrastRatio(primary.color, primary.backgroundColor);
    const passContrast = ratio !== null && ratio >= 3;
    checks.push(
      makeCheck(
        "contrast",
        "Primary CTA has strong visual contrast",
        passContrast,
        20,
        ratio === null
          ? "Could not determine button color contrast (transparent background)."
          : `Contrast ratio ${ratio.toFixed(1)}:1${passContrast ? "" : " — hard to notice against its background."}`
      )
    );

    const tapHeight = primary.rect.height;
    checks.push(
      makeCheck(
        "size",
        "CTA is large enough to tap/click comfortably (44px+ tall)",
        tapHeight >= 40,
        15,
        `Button is ${Math.round(tapHeight)}px tall.`
      )
    );
  } else {
    checks.push(
      makeCheck("action_language", "Primary CTA uses specific, action-oriented text", false, 20, "No CTA to evaluate."),
      makeCheck("contrast", "Primary CTA has strong visual contrast", false, 20, "No CTA to evaluate."),
      makeCheck("size", "CTA is large enough to tap/click comfortably", false, 15, "No CTA to evaluate.")
    );
  }

  // Scope "competing CTAs" to prominent candidates (above the fold or styled
  // like a button) — a page with a huge footer link directory isn't actually
  // overloading the visitor with competing *calls to action*.
  const prominentCtas = ctas.filter((c) => c.rect.y < data.viewportHeight || looksLikeButton(c));
  const distinctTexts = new Set(prominentCtas.map((c) => c.text.toLowerCase().trim()));
  const notOverloaded = distinctTexts.size <= 6;
  checks.push(
    makeCheck(
      "focus",
      "Page doesn't overload visitors with too many competing CTAs",
      notOverloaded,
      10,
      `${distinctTexts.size} distinct prominent CTA labels found (above the fold or button-styled).${
        notOverloaded ? "" : " Consider reducing choices to a single clear next step."
      }`
    )
  );

  const bodyLower = (data.bodyText || "").toLowerCase();
  const hasLowFriction = ["no credit card", "free trial", "cancel anytime", "no commitment"].some((p) =>
    bodyLower.includes(p)
  );
  checks.push(
    makeCheck(
      "friction_reducer",
      "Removes signup friction near the CTA (e.g. \"no credit card required\")",
      hasLowFriction,
      10,
      hasLowFriction ? "Found friction-reducing copy on the page." : "No friction-reducing copy detected (e.g. no credit card / cancel anytime)."
    )
  );

  return {
    ...scoreFromChecks(checks),
    primaryText: primary?.text || null,
    rect: primary?.rect || null,
    allCtas: ctas.slice(0, 20).map((c) => ({ text: c.text, rect: c.rect, aboveFold: c.rect.y < data.viewportHeight })),
  };
}

// ---------------------------------------------------------------------------
// Trust signals
// ---------------------------------------------------------------------------
function scoreTrust(data) {
  const checks = [];
  const bodyLower = (data.bodyText || "").toLowerCase();
  const images = data.images || [];

  const logos = images.filter((img) => LOGO_ALT_HINTS.some((h) => img.alt.toLowerCase().includes(h)));
  checks.push(
    makeCheck(
      "logos",
      "Shows customer/partner logos or press mentions",
      logos.length >= 2,
      15,
      logos.length >= 2 ? `${logos.length} logo-like images detected.` : "No customer logo strip or press mentions detected."
    )
  );

  const badges = images.filter((img) => BADGE_ALT_HINTS.some((h) => img.alt.toLowerCase().includes(h)));
  const hasSecurityCopy = TRUST_KEYWORDS.security.some((k) => bodyLower.includes(k));
  checks.push(
    makeCheck(
      "security_badges",
      "Displays security/trust badges or compliance copy",
      badges.length > 0 || hasSecurityCopy,
      10,
      badges.length > 0 || hasSecurityCopy ? "Security or compliance signal found." : "No security badges or compliance copy found."
    )
  );

  const ratingEls = data.ratingElements || [];
  const hasReviewWord = /\btestimonial|review[s]?\b/i.test(bodyLower);
  checks.push(
    makeCheck(
      "testimonials",
      "Includes testimonials, reviews, or ratings",
      ratingEls.length > 0 || hasReviewWord,
      25,
      ratingEls.length > 0 || hasReviewWord
        ? "Testimonial/review/rating content found."
        : "No testimonials, reviews, or star ratings detected."
    )
  );

  const hasSocialProofNumber = TRUST_KEYWORDS.socialProofNumbers.some((re) => re.test(data.bodyText || ""));
  checks.push(
    makeCheck(
      "social_proof_numbers",
      "States concrete social proof (e.g. \"10,000+ customers\", ratings, \"as seen in\")",
      hasSocialProofNumber,
      20,
      hasSocialProofNumber ? "Found a quantified social-proof statement." : "No specific numbers or \"as seen in\" style proof found."
    )
  );

  const hasGuarantee = TRUST_KEYWORDS.guarantee.some((k) => bodyLower.includes(k));
  checks.push(
    makeCheck(
      "guarantee",
      "Offers a guarantee or risk reversal",
      hasGuarantee,
      15,
      hasGuarantee ? "Guarantee / risk-reversal language found." : "No guarantee, refund, or risk-reversal language found."
    )
  );

  const hasContact = TRUST_KEYWORDS.contact.some((k) => (k instanceof RegExp ? k.test(data.bodyText || "") : bodyLower.includes(k)));
  checks.push(
    makeCheck(
      "contact_info",
      "Provides real contact info (phone, address, or contact page)",
      hasContact,
      15,
      hasContact ? "Contact information detected." : "No phone number, address, or contact reference detected."
    )
  );

  const markers = [];
  if (ratingEls[0]) markers.push({ type: "testimonial", rect: ratingEls[0].rect });
  if (logos[0]) markers.push({ type: "logo", rect: logos[0].rect });
  if (badges[0]) markers.push({ type: "badge", rect: badges[0].rect });

  return {
    ...scoreFromChecks(checks),
    signalsFound: {
      logos: logos.length,
      badges: badges.length,
      ratingElements: ratingEls.length,
    },
    markers: markers.slice(0, 3),
  };
}

export function scorePage(data) {
  const headline = scoreHeadline(data);
  const cta = scoreCta(data);
  const trust = scoreTrust(data);

  const overallScore = Math.round((headline.score + cta.score + trust.score) / 3);

  return {
    overallScore,
    categories: { headline, cta, trust },
  };
}
