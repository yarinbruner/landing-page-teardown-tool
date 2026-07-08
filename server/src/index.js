import express from "express";
import cors from "cors";
import path from "node:path";
import dotenv from "dotenv";
import { analyzeUrl } from "./analyzer.js";
import { runExpertTeardown } from "./expertTeardown.js";
import { runOpenAiTeardown } from "./openaiTeardown.js";
import { buildMockTeardown } from "./mockTeardown.js";
import { applyScoring } from "./scoreAggregation.js";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".claude", ".env") });

const app = express();
const PORT = process.env.PORT || 3001;
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

app.use(cors());
app.use(express.json());
app.use("/screenshots", express.static(SCREENSHOT_DIR));

const DEFAULT_MODEL = { anthropic: "claude-sonnet-5", openai: "gpt-5.5" };

app.post("/api/expert-teardown", async (req, res) => {
  const { url, mock, provider: rawProvider, model: rawModel } = req.body || {};
  const provider = typeof rawProvider === "string" && rawProvider.toLowerCase() === "openai" ? "openai" : "anthropic";
  const model = rawModel || DEFAULT_MODEL[provider];
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ error: "Provide a URL to analyze." });
  }

  // Test mode: real Playwright screenshot/DOM extraction (free, local) but a
  // canned teardown instead of a real Anthropic call — lets UI/design changes
  // get exercised end-to-end without spending API credits.
  if (mock === true) {
    try {
      const pageData = await analyzeUrl(url.trim());
      return res.json({
        url: pageData.url,
        analyzedAt: new Date().toISOString(),
        title: pageData.title,
        screenshots: {
          full: `/screenshots/${pageData.screenshots.full}`,
          aboveFold: `/screenshots/${pageData.screenshots.aboveFold}`,
        },
        teardown: applyScoring(buildMockTeardown(pageData)),
        mock: true,
        provider,
        model,
      });
    } catch (err) {
      console.error("Mock teardown failed:", err);
      const message =
        err.name === "TimeoutError"
          ? "The page took too long to load. Check the URL and try again."
          : "Could not load or analyze that URL.";
      return res.status(502).json({ error: message });
    }
  }

  const isOpenAi = provider === "openai";
  const envFallback = isOpenAi ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  const apiKey = req.get(isOpenAi ? "x-openai-api-key" : "x-anthropic-api-key") || envFallback;
  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ error: `Add your ${isOpenAi ? "OpenAI" : "Claude"} API key to run the expert teardown.` });
  }

  try {
    const pageData = await analyzeUrl(url.trim());
    const rawTeardown = isOpenAi
      ? await runOpenAiTeardown(pageData, apiKey.trim(), model)
      : await runExpertTeardown(pageData, apiKey.trim(), model);
    const teardown = applyScoring(rawTeardown);

    res.json({
      url: pageData.url,
      analyzedAt: new Date().toISOString(),
      title: pageData.title,
      screenshots: {
        full: `/screenshots/${pageData.screenshots.full}`,
        aboveFold: `/screenshots/${pageData.screenshots.aboveFold}`,
      },
      teardown,
      provider,
      model,
    });
  } catch (err) {
    console.error("Expert teardown failed:", err.message);
    if (err.status === 401) {
      return res.status(401).json({ error: `That ${isOpenAi ? "OpenAI" : "Claude"} API key was rejected. Check it and try again.` });
    }
    if (err.status === 429) {
      return res
        .status(429)
        .json({ error: `${isOpenAi ? "OpenAI" : "Claude"} API rate limit or credit balance hit. Check your account at ${isOpenAi ? "platform.openai.com" : "console.anthropic.com"}.` });
    }
    const message =
      err.name === "TimeoutError"
        ? "The page took too long to load. Check the URL and try again."
        : "Could not complete the expert teardown.";
    res.status(502).json({ error: message });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Teardown server listening on http://localhost:${PORT}`);
});
