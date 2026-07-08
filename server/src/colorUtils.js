export function parseRgb(str) {
  if (!str) return null;
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  const [r, g, b, a = 1] = parts;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b, a };
}

export function relativeLuminance({ r, g, b }) {
  const toLinear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(fg, bg) {
  const rgbFg = parseRgb(fg);
  const rgbBg = parseRgb(bg);
  if (!rgbFg || !rgbBg) return null;
  // Treat a transparent background as sitting on white (best-effort guess)
  const effectiveBg = rgbBg.a === 0 ? { r: 255, g: 255, b: 255 } : rgbBg;
  const lumFg = relativeLuminance(rgbFg);
  const lumBg = relativeLuminance(effectiveBg);
  const lighter = Math.max(lumFg, lumBg);
  const darker = Math.min(lumFg, lumBg);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}
