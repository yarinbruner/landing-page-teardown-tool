import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CRITERIA } from "./teardownSchema.js";
import { summarizePageData } from "./pageSummary.js";

const TEARDOWN_EXPERT_PATH = path.resolve(process.cwd(), "..", "TEARDOWN_EXPERT.md");
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

const FINDING_SCHEMA = {
  type: "object",
  properties: {
    text: { type: "string", description: "One short, concrete sentence about this page — under ~20 words. Never a restated framework name or generic advice." },
    rating: { type: "integer", description: "1-5. How strong (5) or weak (1) this specific observation is — 5 means genuinely working well, 1 means seriously broken or missing." },
  },
  required: ["text", "rating"],
  additionalProperties: false,
};

const CRITERION_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: FINDING_SCHEMA,
      description: "Exactly 3-5 short findings, each with its own 1-5 rating.",
    },
    whatToChange: {
      type: "string",
      description: "The single most important, concrete fix for this criterion. One short sentence, specific to this page.",
    },
  },
  required: ["findings", "whatToChange"],
  additionalProperties: false,
};

// Mirrors TEARDOWN_EXPERT.md's Chain of Thought exactly: the model still
// reasons through Observe, Hypothesize (all four frameworks), Find the
// Conflict, then Score — but only `criteria`/`overall`/`overallVerdict`/
// `highestLeverageFix` are meant to reach the user-facing report. Forcing
// `reasoning` as a required field before `criteria` keeps "never score
// before the conflict is named" enforceable even though the public output
// is condensed to five plain-language criteria.
const TEARDOWN_TOOL = {
  name: "record_expert_teardown",
  description:
    "Record a landing page teardown. Reason through Observe, Hypothesize (MECLABS/Fogg/JTBD/Cialdini), and Find the Conflict first, then rate five plain-language criteria informed by that reasoning. Never populate `criteria` until `reasoning.conflict` names where the models disagree. Do not compute a holistic numeric score yourself — the app derives section and overall scores from your per-finding 1-5 ratings.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      reasoning: {
        type: "object",
        description: "Internal Chain of Thought. Not shown verbatim in the primary report.",
        properties: {
          observe: {
            type: "string",
            description: "Layout, copy, structure, and visual hierarchy, described without judgment. No scores or verdicts here.",
          },
          meclabs: {
            type: "object",
            description: "MECLABS m/v/i/f/a, scored 1-5 each.",
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
          jtbdGap: { type: "string", description: "Which job(s) — functional, emotional, social — the page fails to address." },
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
          conflict: {
            type: "string",
            description: "Where the four models disagree with each other. This is the diagnosis, not a problem to resolve.",
          },
        },
        required: ["observe", "meclabs", "foggBrokenVertex", "jtbdGap", "cialdiniAudit", "conflict"],
        additionalProperties: false,
      },
      criteria: {
        type: "object",
        properties: Object.fromEntries(CRITERIA.map((c) => [c.key, CRITERION_SCHEMA])),
        required: CRITERIA.map((c) => c.key),
        additionalProperties: false,
      },
      overallVerdict: { type: "string", description: "One plain-English sentence naming the single biggest lever on this page." },
      highestLeverageFix: { type: "string", description: "One or two concrete sentences: the single rewrite or structural change that would move the needle most." },
    },
    required: ["reasoning", "criteria", "overallVerdict", "highestLeverageFix"],
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

export async function runExpertTeardown(pageData, apiKey, model = "claude-sonnet-5") {
  const system = fs.readFileSync(TEARDOWN_EXPERT_PATH, "utf8");
  const summary = summarizePageData(pageData);
  const client = new Anthropic({ apiKey });
  const [aboveFoldImage, fullImage] = await Promise.all([
    imageBlock(pageData.screenshots.aboveFold),
    imageBlock(pageData.screenshots.full),
  ]);

  const response = await client.messages.create({
    model,
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
