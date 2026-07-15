export async function analyzeUrl(rawUrl) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: "application/json" },
  });

  if (!jinaRes.ok) {
    throw new Error(
      `Jina Reader could not fetch the page (${jinaRes.status}). Check the URL and try again.`
    );
  }

  const jinaData = await jinaRes.json();
  const page = jinaData.data || {};

  // Best-effort OG image extraction — no crash if this fails
  let screenshotUrl = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const htmlRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LandingTeardown/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const html = await htmlRes.text();
    const match =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    screenshotUrl = match?.[1] ?? null;
  } catch {
    // silently skip
  }

  return {
    url: page.url || url,
    title: page.title || "",
    metaDescription: page.description || "",
    content: page.content || "",
    screenshotUrl,
  };
}
