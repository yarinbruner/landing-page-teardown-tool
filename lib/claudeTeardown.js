import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEARDOWN_EXPERT = readFileSync(join(__dirname, "..", "TEARDOWN_EXPERT.md"), "utf8");

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

const JSON_SCHEMA_INSTRUCTION = `
---

## Required JSON Output

After completing your full four-model analysis internally, output ONLY a valid JSON object — no markdown fences, no explanation, no text outside the JSON.

The JSON must match this exact schema:

{
  "criteria": {
    "messageAndValueProp": {
      "findings": [
        { "text": "One specific observation about this page, under 20 words", "rating": 4 }
      ],
      "whatToChange": "The single most important concrete fix, one sentence"
    },
    "callToAction": {
      "findings": [ { "text": "...", "rating": 3 } ],
      "whatToChange": "..."
    },
    "trustAndCredibility": {
      "findings": [ { "text": "...", "rating": 2 } ],
      "whatToChange": "..."
    },
    "frictionAndClarity": {
      "findings": [ { "text": "...", "rating": 5 } ],
      "whatToChange": "..."
    },
    "urgencyAndMotivation": {
      "findings": [ { "text": "...", "rating": 1 } ],
      "whatToChange": "..."
    }
  },
  "overallVerdict": "One sentence: the biggest conversion lever on this page.",
  "highestLeverageFix": "One to two sentences: the single most impactful rewrite or structural change."
}

Hard rules:
- Each criterion must have exactly 3–5 findings
- Ratings are integers 1–5; use the full range, do NOT cluster at 2–3
- Each finding text must reference specific content from this page — no generic advice
- Do NOT include a "reasoning" key, framework names, or any text outside the JSON object
`;

export async function runClaudeTeardown(pageData, apiKey) {
  const systemPrompt = TEARDOWN_EXPERT + "\n\n" + JSON_SCHEMA_INSTRUCTION;

  const userPrompt = `Analyze this landing page:

URL: ${pageData.url}
Title: ${pageData.title || "(no title)"}
Meta Description: ${pageData.metaDescription || "(none)"}

Page content extracted by Jina Reader (markdown):
---
${pageData.content ? pageData.content.slice(0, 15000) : "(no content extracted)"}
---

Apply your full four-model analysis internally, then output only the JSON.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Anthropic API error ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text || "";
  if (!raw) throw new Error("Claude returned an empty response.");

  const text = "{" + raw;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Claude returned invalid JSON: " + text.slice(0, 300));
  }
}
