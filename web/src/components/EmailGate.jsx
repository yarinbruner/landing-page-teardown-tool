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

    onConfirmed(trimmed);
  }

  return (
    <div className="email-gate panel">
      <div className="email-gate-heading-row">
        <span className="email-gate-lock" aria-hidden="true">🔒</span>
        <h2 className="email-gate-title">Unlock the full teardown</h2>
      </div>
      <p className="email-gate-sub">
        Enter your email and we'll send the complete analysis — all 5 criteria — straight to your inbox.
      </p>
      <form className="email-gate-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="email-gate-input"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          disabled={submitting}
        />
        <button type="submit" className="url-bar-submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send my report →"}
        </button>
      </form>
      {error && <p className="email-gate-error">{error}</p>}
      <p className="email-gate-fine-print">No spam. Just your report, once.</p>
    </div>
  );
}
