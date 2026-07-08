// Provider-agnostic plain-text digest of extracted page data, sent alongside
// the screenshots to whichever model is running the teardown.
export function summarizePageData(pageData) {
  const headings = pageData.headings.map((h) => `${h.tag}: "${h.text}" (${h.fontSize}px)`).join("\n");
  const ctas = pageData.ctas
    .map((c) => {
      const contrast = c.contrastRatio == null ? "" : ` — contrast ${c.contrastRatio}:1${c.passesWcagAA ? "" : " (fails WCAG AA)"}`;
      return `"${c.text}" (${c.tag}${c.inNavChrome ? ", nav" : ""}${contrast})`;
    })
    .join("\n");
  const ratings = pageData.ratingElements.map((r) => r.text).join("\n");
  const forms = (pageData.forms || [])
    .map((f) => `${f.fieldCount} field${f.fieldCount === 1 ? "" : "s"}${f.aboveFold ? ", above the fold" : ""}${f.submitText ? `, submit: "${f.submitText}"` : ""}`)
    .join("\n");
  return [
    `Title: ${pageData.title}`,
    `Meta description: ${pageData.metaDescription}`,
    `Headings:\n${headings || "(none)"}`,
    `CTAs (${pageData.ctas.length} total):\n${ctas || "(none)"}`,
    `Images: ${pageData.images.length} total`,
    `Rating/testimonial elements:\n${ratings || "(none)"}`,
    `Forms:\n${forms || "(none)"}`,
    `Body text (first 4000 chars):\n${pageData.bodyText.slice(0, 4000)}`,
  ].join("\n\n");
}
