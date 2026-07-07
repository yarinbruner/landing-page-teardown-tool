import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const TEARDOWN_EXPERT_PATH = path.resolve(process.cwd(), "..", "TEARDOWN_EXPERT.md");
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

const ELEMENT_KEYS = ["headline", "cta", "trust", "friction", "messageMarketFit"];

const ELEMENT_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    verdict: { type: "string" },
    fix: { type: "string" },
  },
  required: ["score", "verdict", "fix"],
  additionalProperties: false,
};

// Mirrors TEARDOWN_EXPERT.md's Chain of Thought exactly: Observe, Hypothesize,
// Find the Conflict, then Score. Forcing this as a tool schema (rather than
// free-form text) is what makes "never score before the conflict is named"
// enforceable — the model can't fill in `score` without first producing
// `conflict`, since both are required top-level fields it emits together but
// the schema's ordering/description make the sequence explicit.
const TEARDOWN_TOOL = {
  name: "record_expert_teardown",
  description:
    "Record a landing page teardown that follows the Chain of Thought structure exactly: Observe, Hypothesize, Find the Conflict, then Score. Never populate any field under `score` until `conflict` names where the models disagree.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      observe: {
        type: "string",
        description: "Layout, copy, structure, and visual hierarchy, described without judgment. No scores or verdicts here.",
      },
      hypothesize: {
        type: "object",
        properties: {
          meclabs: { type: "string", description: "MECLABS lens: what m, v, i, f, a reveal — qualitative only, no scores yet." },
          fogg: { type: "string", description: "Fogg Behavior Model lens: motivation, ability, and prompt." },
          jtbd: { type: "string", description: "Jobs-To-Be-Done lens: functional, emotional, and social jobs addressed or missing." },
          cialdini: { type: "string", description: "Cialdini's principles: present, absent, or misused, one by one." },
        },
        required: ["meclabs", "fogg", "jtbd", "cialdini"],
        additionalProperties: false,
      },
      conflict: {
        type: "string",
        description: "Where the four lenses disagree with each other. This is the diagnosis, not a problem to resolve.",
      },
      score: {
        type: "object",
        properties: {
          meclabs: {
            type: "object",
            properties: {
              m: { type: "integer" },
              v: { type: "integer" },
              i: { type: "integer" },
              f: { type: "integer" },
              a: { type: "integer" },
            },
            required: ["m", "v", "i", "f", "a"],
            additionalProperties: false,
          },
          foggBrokenVertex: { type: "string", enum: ["motivation", "ability", "prompt"] },
          jtbd: {
            type: "object",
            properties: {
              functional: { type: "integer" },
              emotional: { type: "integer" },
              social: { type: "integer" },
            },
            required: ["functional", "emotional", "social"],
            additionalProperties: false,
          },
          cialdiniAudit: {
            type: "object",
            properties: Object.fromEntries(
              ["reciprocity", "commitment", "socialProof", "authority", "liking", "scarcity", "unity"].map((key) => [
                key,
                { type: "string", enum: ["present", "absent", "misused"] },
              ])
            ),
            required: ["reciprocity", "commitment", "socialProof", "authority", "liking", "scarcity", "unity"],
            additionalProperties: false,
          },
          elements: {
            type: "object",
            properties: Object.fromEntries(ELEMENT_KEYS.map((key) => [key, ELEMENT_SCHEMA])),
            required: ELEMENT_KEYS,
            additionalProperties: false,
          },
          overall: { type: "integer", description: "0-100. Bottlenecked by the weakest MECLABS variable — never an average." },
          overallReasoning: { type: "string" },
          highestLeverageFix: { type: "string" },
        },
        required: ["meclabs", "foggBrokenVertex", "jtbd", "cialdiniAudit", "elements", "overall", "overallReasoning", "highestLeverageFix"],
        additionalProperties: false,
      },
    },
    required: ["observe", "hypothesize", "conflict", "score"],
    additionalProperties: false,
  },
};

const MAX_IMAGE_EDGE = 1568;

async function imageBlock(filename) {
  const raw = fs.readFileSync(path.join(SCREENSHOT_DIR, filename));
  const resized = await sharp(raw)
    .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  return { type: "image", source: { type: "base64", media_type: "image/png", data: resized.toString("base64") } };
}

function summarizePageData(pageData) {
  const headings = pageData.headings.map((h) => `${h.tag}: "${h.text}" (${h.fontSize}px)`).join("\n");
  const ctas = pageData.ctas.map((c) => `"${c.text}" (${c.tag}${c.inNavChrome ? ", nav" : ""})`).join("\n");
  const ratings = pageData.ratingElements.map((r) => r.text).join("\n");
  return [
    `Title: ${pageData.title}`,
    `Meta description: ${pageData.metaDescription}`,
    `Headings:\n${headings || "(none)"}`,
    `CTAs (${pageData.ctas.length} total):\n${ctas || "(none)"}`,
    `Images: ${pageData.images.length} total`,
    `Rating/testimonial elements:\n${ratings || "(none)"}`,
    `Body text (first 4000 chars):\n${pageData.bodyText.slice(0, 4000)}`,
  ].join("\n\n");
}

export async function runExpertTeardown(pageData, apiKey) {
  const system = fs.readFileSync(TEARDOWN_EXPERT_PATH, "utf8");
  const summary = summarizePageData(pageData);
  const client = new Anthropic({ apiKey });
  const [aboveFoldImage, fullImage] = await Promise.all([
    imageBlock(pageData.screenshots.aboveFold),
    imageBlock(pageData.screenshots.full),
  ]);

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    // Forced tool_choice below requires thinking off; effort keeps the
    // reasoning depth this multi-model analysis needs without it.
    thinking: { type: "disabled" },
    output_config: { effort: "high" },
    system,
    tools: [TEARDOWN_TOOL],
    tool_choice: { type: "tool", name: "record_expert_teardown" },
    messages: [
      {
        role: "user",
        content: [
          aboveFoldImage,
          fullImage,
          {
            type: "text",
            text: `Above: the above-the-fold screenshot, then the full-page screenshot. Extracted DOM data follows.\n\n${summary}\n\nRun the full Chain of Thought teardown now.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("Model did not return a structured teardown.");
  }
  return toolUse.input;
}
