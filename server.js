import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import teardownHandler from "./api/expert-teardown.js";
import captureLeadHandler from "./api/capture-lead.js";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.trimStart().startsWith("#")) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key) process.env[key] ??= val;
    }
  }
}
loadEnvFile(".env");
loadEnvFile(".claude/.env");

const PORT = process.env.SERVER_PORT || 3001;

const server = createServer((req, res) => {
  if (req.url?.startsWith("/api/expert-teardown") || (req.method === "OPTIONS" && req.url?.includes("expert-teardown"))) {
    teardownHandler(req, res);
  } else if (req.url?.startsWith("/api/capture-lead") || (req.method === "OPTIONS" && req.url?.includes("capture-lead"))) {
    captureLeadHandler(req, res);
  } else if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Local API server → http://localhost:${PORT}`);
});
