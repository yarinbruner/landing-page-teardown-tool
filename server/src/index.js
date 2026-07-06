import express from "express";
import cors from "cors";
import path from "node:path";
import { analyzeUrl } from "./analyzer.js";
import { scorePage } from "./scoring.js";

const app = express();
const PORT = process.env.PORT || 3001;
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

app.use(cors());
app.use(express.json());
app.use("/screenshots", express.static(SCREENSHOT_DIR));

app.post("/api/analyze", async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ error: "Provide a URL to analyze." });
  }

  try {
    const pageData = await analyzeUrl(url.trim());
    const scoring = scorePage(pageData);

    res.json({
      url: pageData.url,
      analyzedAt: new Date().toISOString(),
      viewport: pageData.viewport,
      pageHeight: pageData.pageHeight,
      title: pageData.title,
      screenshots: {
        full: `/screenshots/${pageData.screenshots.full}`,
        aboveFold: `/screenshots/${pageData.screenshots.aboveFold}`,
      },
      overallScore: scoring.overallScore,
      categories: scoring.categories,
    });
  } catch (err) {
    console.error("Analyze failed:", err);
    const message =
      err.name === "TimeoutError"
        ? "The page took too long to load. Check the URL and try again."
        : "Could not load or analyze that URL.";
    res.status(502).json({ error: message });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Teardown server listening on http://localhost:${PORT}`);
});
