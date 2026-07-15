import { analyzeUrl } from "../lib/analyzer.js";
import { runClaudeTeardown } from "../lib/claudeTeardown.js";
import { buildMockTeardown } from "../lib/mockTeardown.js";
import { applyScoring } from "../lib/scoreAggregation.js";

async function readBody(req) {
  if (req.body !== undefined) return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const campaignEnds = process.env.CAMPAIGN_ENDS;
  if (campaignEnds && new Date() > new Date(campaignEnds)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ ended: true }));
    return;
  }

  const { url, mock } = await readBody(req);

  if (!url || typeof url !== "string" || !url.trim()) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Provide a URL to analyze." }));
    return;
  }

  if (mock === true) {
    try {
      const pageData = await analyzeUrl(url.trim());
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          url: pageData.url,
          analyzedAt: new Date().toISOString(),
          title: pageData.title,
          screenshotUrl: pageData.screenshotUrl,
          teardown: applyScoring(buildMockTeardown(pageData)),
          mock: true,
        })
      );
    } catch (err) {
      console.error("Mock teardown failed:", err.message);
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "Could not load or analyze that URL. Check it and try again." }));
    }
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server is missing the API key. Contact the site owner." }));
    return;
  }

  try {
    const pageData = await analyzeUrl(url.trim());
    const rawTeardown = await runClaudeTeardown(pageData, apiKey);
    const teardown = applyScoring(rawTeardown);

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        url: pageData.url,
        analyzedAt: new Date().toISOString(),
        title: pageData.title,
        screenshotUrl: pageData.screenshotUrl,
        teardown,
        mock: false,
      })
    );
  } catch (err) {
    console.error("Teardown failed:", err.message);
    if (err.status === 401 || err.status === 403) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "API key was rejected." }));
      return;
    }
    if (err.status === 429) {
      res.statusCode = 429;
      res.end(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }));
      return;
    }
    res.statusCode = 502;
    res.end(JSON.stringify({ error: err.message || "Could not complete the teardown." }));
  }
}
