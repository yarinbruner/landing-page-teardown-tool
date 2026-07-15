import { buildEmailHtml } from "../lib/emailTemplate.js";

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

  const { email, url, title, teardown } = await readBody(req);

  if (!email || typeof email !== "string") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Email address is required." }));
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid email address." }));
    return;
  }

  if (!url || !teardown) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Missing teardown data." }));
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // Write to Airtable
  const airtableKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || "Leads";

  if (airtableKey && baseId) {
    const c = teardown.criteria || {};
    await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${airtableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Email: cleanEmail,
              URL: url,
              Title: title || "",
              Overall_Score: teardown.overall ?? null,
              Message_Score: c.messageAndValueProp?.barPercent ?? null,
              CTA_Score: c.callToAction?.barPercent ?? null,
              Trust_Score: c.trustAndCredibility?.barPercent ?? null,
              Friction_Score: c.frictionAndClarity?.barPercent ?? null,
              Urgency_Score: c.urgencyAndMotivation?.barPercent ?? null,
              Timestamp: new Date().toISOString(),
            },
          },
        ],
      }),
    }).catch((err) => console.error("Airtable write failed:", err.message));
  } else {
    console.warn("Airtable not configured — skipping lead storage.");
  }

  // Send email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  if (resendKey && fromEmail) {
    const pageTitle = title || url;
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        ...(notificationEmail ? { bcc: [notificationEmail] } : {}),
        subject: `Your teardown: ${pageTitle}`,
        html: buildEmailHtml({ url, title, teardown }),
      }),
    }).catch((err) => {
      console.error("Resend email failed:", err.message);
      return null;
    });

    if (emailRes && !emailRes.ok) {
      const errBody = await emailRes.json().catch(() => ({}));
      console.error("Resend error:", errBody);
    }
  } else {
    console.warn("Resend not configured — skipping email send.");
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
}
