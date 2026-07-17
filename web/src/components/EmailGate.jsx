import { useState } from "react";

export default function EmailGate({ url, title, teardown, onConfirmed }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);

    fetch("/api/capture-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed, url, title, teardown }),
    }).catch((err) => console.warn("Lead capture failed:", err.message));

    if (typeof window.gtag === "function") window.gtag("event", "lead_captured", { url });
    onConfirmed(trimmed);
  }

  return (
    <>
      <div className="lpt-gate-heading">
        <span className="lpt-gate-lock" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 7V4.75a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="card-title">Unlock the full teardown</span>
      </div>
      <p className="lpt-gate-sub">
        Enter your email and we'll send the complete analysis — all 5 criteria — straight to your inbox.
      </p>
      <form className="lpt-gate-form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting}
          style={{ whiteSpace: "nowrap", paddingInline: 18 }}
        >
          {submitting ? "Sending…" : "Send my report →"}
        </button>
      </form>
      {error && <p className="lpt-gate-error">{error}</p>}
      <p className="lpt-gate-fine-print">No spam. Just your report, once.</p>
    </>
  );
}
