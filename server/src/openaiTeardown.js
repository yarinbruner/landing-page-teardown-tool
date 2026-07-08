import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CRITERIA } from "./teardownSchema.js";
import { summarizePageData } from "./pageSummary.js";

const TEARDOWN_EXPERT_PATH = path.resolve(process.cwd(), "..", "TEARDOWN_EXPERT.md");
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
const MAX_IMAGE_EDGE = 1568;

const FindingSchema = z.object({
  text: z.string(),
  rating: z.number().int().min(1).max(5),
});

const CriterionSchema = z.object({
  findings: z.array(FindingSchema),
  whatToChange: z.string(),
});

const cialdiniVerdict = z.enum(["present", "absent", "misused"]);

const ReasoningSchema = z.object({
  observe: z.string(),
  meclabs: z.object({
    m: z.number().int(),
    v: z.number().int(),
    i: z.number().int(),
    f: z.number().int(),
    a: z.number().int(),
  }),
  foggBrokenVertex: z.enum(["motivation", "ability", "prompt"]),
  jtbdGap: z.string(),
  cialdiniAudit: z.object({
    reciprocity: cialdiniVerdict,
    commitment: cialdiniVerdict,
    socialProof: cialdiniVerdict,
    authority: cialdiniVerdict,
    liking: cialdiniVerdict,
    scarcity: cialdiniVerdict,
    unity: cialdiniVerdict,
  }),
  conflict: z.string(),
});

// Same shape as the Anthropic tool schema in expertTeardown.js, expressed as
// a Zod object so the Responses API's structured-output parser can validate
// against it directly via zodTextFormat/`.parse()`.
const TeardownSchema = z.object({
  reasoning: ReasoningSchema,
  criteria: z.object(Object.fromEntries(CRITERIA.map((c) => [c.key, CriterionSchema]))),
  overallVerdict: z.string(),
  highestLeverageFix: z.string(),
});

async function imageDataUri(filename) {
  const raw = fs.readFileSync(path.join(SCREENSHOT_DIR, filename));
  const resized = await sharp(raw)
    .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  return `data:image/png;base64,${resized.toString("base64")}`;
}

export async function runOpenAiTeardown(pageData, apiKey, model = "gpt-5.5") {
  const system = fs.readFileSync(TEARDOWN_EXPERT_PATH, "utf8");
  const summary = summarizePageData(pageData);
  const client = new OpenAI({ apiKey });

  const [aboveFoldUri, fullUri] = await Promise.all([
    imageDataUri(pageData.screenshots.aboveFold),
    imageDataUri(pageData.screenshots.full),
  ]);

  const response = await client.responses.parse({
    model,
    instructions: system,
    input: [
      {
        role: "user",
        content: [
          { type: "input_image", image_url: aboveFoldUri },
          { type: "input_image", image_url: fullUri },
          {
            type: "input_text",
            text: `Above: the above-the-fold screenshot, then the full-page screenshot. Extracted DOM data follows.\n\n${summary}\n\nRun the full Chain of Thought teardown now.`,
          },
        ],
      },
    ],
    text: { format: zodTextFormat(TeardownSchema, "record_expert_teardown") },
  });

  if (!response.output_parsed) {
    throw new Error("Model did not return a structured teardown.");
  }
  return response.output_parsed;
}
