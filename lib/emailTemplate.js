const CRITERIA_LABELS = {
  messageAndValueProp: "Message & Value Prop",
  callToAction: "Call to Action",
  trustAndCredibility: "Trust & Credibility",
  frictionAndClarity: "Friction & Clarity",
  urgencyAndMotivation: "Urgency & Motivation",
};

const CRITERIA_ORDER = [
  "messageAndValueProp",
  "callToAction",
  "trustAndCredibility",
  "frictionAndClarity",
  "urgencyAndMotivation",
];

const CRITERIA_COLORS = {
  messageAndValueProp: "#7c3aed",
  callToAction: "#2563eb",
  trustAndCredibility: "#0f766e",
  frictionAndClarity: "#8a5a05",
  urgencyAndMotivation: "#b71c1c",
};

const CRITERIA_BG = {
  messageAndValueProp: "#f3eeff",
  callToAction: "#eff4ff",
  trustAndCredibility: "#f0faf8",
  frictionAndClarity: "#fdf8ee",
  urgencyAndMotivation: "#fff5f5",
};

function progressBar(percent, color) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 6px 0 14px;">
      <tr>
        <td style="padding: 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #e8ddd0; border-radius: 4px; overflow: hidden; height: 8px;">
            <tr>
              <td width="${percent}%" style="height: 8px; background: ${color}; padding: 0;"></td>
              <td width="${100 - percent}%" style="padding: 0;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `.trim();
}

export function buildEmailHtml({ url, title, teardown }) {
  const { overall, overallVerdict, highestLeverageFix, criteria } = teardown;

  const scoreColor = overall >= 7 ? "#0f766e" : overall >= 4 ? "#8a5a05" : "#b71c1c";

  const criteriaHtml = CRITERIA_ORDER.map((key) => {
    const c = criteria[key];
    if (!c) return "";
    const color = CRITERIA_COLORS[key];
    const bg = CRITERIA_BG[key];
    const label = CRITERIA_LABELS[key];

    const findingsHtml = (c.findings || []).map((f, i) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0e8d8; vertical-align: top;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width: 22px; font-size: 11px; font-weight: 700; color: ${color}; vertical-align: top; padding-top: 2px;">${i + 1}.</td>
              <td style="font-size: 14px; line-height: 1.5; color: #4a3826; padding-right: 8px;">${f.text}</td>
              <td style="width: 60px; text-align: right; vertical-align: top; padding-top: 3px; white-space: nowrap; font-size: 11px; letter-spacing: 1px; color: ${color};">${"●".repeat(f.rating || 0)}${"○".repeat(5 - (f.rating || 0))}</td>
            </tr>
          </table>
        </td>
      </tr>
    `).join("");

    return `
      <div style="margin-bottom: 20px; padding: 20px; background: #ffffff; border: 1px solid #e8ddd0; border-radius: 10px; border-left: 3px solid ${color};">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
          <tr>
            <td>
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${color}; margin-right: 8px; vertical-align: middle;"></span>
              <span style="font-size: 15px; font-weight: 600; color: #2b2013; vertical-align: middle;">${label}</span>
            </td>
            <td style="text-align: right; font-size: 14px; font-weight: 700; color: ${color}; font-variant-numeric: tabular-nums;">${c.barPercent}%</td>
          </tr>
        </table>
        ${progressBar(c.barPercent, color)}
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${findingsHtml}
        </table>
        <div style="margin-top: 14px; padding: 12px 14px; background: ${bg}; border: 1px solid ${color}; border-radius: 7px;">
          <div style="font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; color: ${color}; margin-bottom: 5px;">Change this</div>
          <p style="margin: 0; font-size: 14px; font-weight: 500; line-height: 1.5; color: #2b2013;">${c.whatToChange}</p>
        </div>
      </div>
    `.trim();
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Landing Page Teardown</title>
</head>
<body style="margin: 0; padding: 0; background: #fafaf8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding: 32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #a08060; margin-bottom: 8px; font-weight: 600;">Landing Page Teardown</div>
              <div style="font-size: 18px; font-weight: 600; color: #2b2013; word-break: break-all;">${url}</div>
              ${title ? `<div style="font-size: 13px; color: #6b5a45; margin-top: 4px;">${title}</div>` : ""}
            </td>
          </tr>

          <!-- Score -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="background: #ffffff; border: 1px solid #e8ddd0; border-radius: 12px; padding: 28px 24px; text-align: center;">
                <div style="font-size: 64px; font-weight: 700; color: ${scoreColor}; letter-spacing: -0.03em; line-height: 1;">${overall}</div>
                <div style="font-size: 15px; color: #a08060; margin-top: 2px;">out of 10</div>
                <p style="margin: 16px 0 0; font-size: 15px; line-height: 1.55; color: #4a3826;">${overallVerdict}</p>
              </div>
            </td>
          </tr>

          <!-- Highest leverage fix -->
          <tr>
            <td style="padding-bottom: 28px;">
              <div style="background: #eff4ff; border: 1px solid #2563eb; border-radius: 10px; padding: 18px 20px;">
                <div style="font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700; color: #2563eb; margin-bottom: 8px;">Highest-leverage fix</div>
                <p style="margin: 0; font-size: 15px; line-height: 1.55; color: #2b2013;">${highestLeverageFix}</p>
              </div>
            </td>
          </tr>

          <!-- Criteria -->
          <tr>
            <td>
              <div style="font-size: 11px; font-weight: 600; color: #a08060; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 14px;">Full Analysis — 5 Criteria</div>
              ${criteriaHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 28px; border-top: 1px solid #e8ddd0;">
              <p style="margin: 0; font-size: 12px; color: #a08060; line-height: 1.7; text-align: center;">
                Generated by Landing Page Teardown<br>
                You requested this report. No further emails will be sent.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
