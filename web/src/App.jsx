import { useState, useEffect } from "react";
import ScoreHead from "./components/ScoreHead.jsx";
import TeaserReport from "./components/TeaserReport.jsx";
import LoadingTips from "./components/LoadingTips.jsx";
import "./App.css";

const EXAMPLES = ["stripe.com", "linear.app", "notion.com"];

const TEST_MODE_STORAGE_KEY = "teardown:testMode";
const CACHE_PREFIX = "teardown:cache:v1:";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(url) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const { result, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + url); return null; }
    return result;
  } catch { return null; }
}

function setCache(url, result) {
  try { localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ result, ts: Date.now() })); } catch {}
}

function track(event, params = {}) {
  if (typeof window.gtag === "function") window.gtag("event", event, params);
}

export default function App() {
  const [input, setInput] = useState("");
  const [teardownPhase, setTeardownPhase] = useState("idle");
  const [teardownError, setTeardownError] = useState(null);
  const [teardownResult, setTeardownResult] = useState(null);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [testMode, setTestMode] = useState(() => localStorage.getItem(TEST_MODE_STORAGE_KEY) === "1");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [teardownPhase]);

  function toggleTestMode() {
    setTestMode((prev) => {
      const next = !prev;
      localStorage.setItem(TEST_MODE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function runTeardown(url) {
    setTeardownPhase("loading");
    setTeardownError(null);
    setTeardownResult(null);
    track("teardown_started", { url });

    const cached = !testMode && getCached(url);
    if (cached) {
      setTeardownResult(cached);
      setTeardownPhase("gated");
      return;
    }

    try {
      const res = await fetch("/api/expert-teardown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mock: testMode }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      if (body.ended) {
        setTeardownPhase("ended");
        return;
      }
      if (!testMode) setCache(url, body);
      setTeardownResult(body);
      setTeardownPhase("gated");
      track("teardown_completed", { url });
    } catch (e) {
      setTeardownError(e.message || "Could not reach the analysis server.");
      setTeardownPhase("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const url = input.trim();
    if (!url) return;
    runTeardown(url);
  }

  function handleExampleClick(url) {
    setInput(url);
    runTeardown(url);
  }

  function backToInput() {
    setTeardownPhase("idle");
    setTeardownResult(null);
    setTeardownError(null);
  }

  const showIdleShell = teardownPhase !== "gated" && teardownPhase !== "confirmed";

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Landing Page Teardown</span>
        <span className="tag tag-outline">Free</span>
      </nav>

      <div className="lpt-container">

        {/* ── Idle shell: visible in idle / loading / error / ended ─────── */}
        {showIdleShell && (
          <div className="lpt-fade-in">
            <header className="lpt-hero">
              <h1 className="lpt-headline">
                <span className="cmyk-head">
                  <span className="paper">Score the pitch,</span>
                  <span className="plate plate-c" aria-hidden="true">Score the pitch,</span>
                  <span className="plate plate-m" aria-hidden="true">Score the pitch,</span>
                  <span className="plate plate-y" aria-hidden="true">Score the pitch,</span>
                </span>
                <span className="cmyk-head">
                  <span className="paper">not just the paint.</span>
                  <span className="plate plate-c" aria-hidden="true">not just the paint.</span>
                  <span className="plate plate-m" aria-hidden="true">not just the paint.</span>
                  <span className="plate plate-y" aria-hidden="true">not just the paint.</span>
                </span>
              </h1>
              <p className="lpt-sub">
                Drop in a URL. Get an industry-standard conversion teardown — message &amp; value
                prop, call to action, trust, friction, and urgency.
              </p>
            </header>

            {teardownPhase === "ended" && (
              <div className="lpt-notice">
                <span className="lpt-notice-label">Notice</span>
                <p className="lpt-notice-text">
                  <strong>This campaign has closed.</strong> Thank you for your interest — the teardown
                  tool is no longer accepting new analyses.
                </p>
              </div>
            )}

            {teardownPhase === "loading" ? (
              <LoadingTips />
            ) : (
              <>
                <form className="lpt-form" onSubmit={handleSubmit}>
                  <label className="lpt-form-label" htmlFor="teardown-url">URL</label>
                  <input
                    id="teardown-url"
                    className="lpt-form-input"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="stripe.com"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck={false}
                    autoFocus
                  />
                  <button className="btn btn-primary lpt-form-btn" type="submit" aria-label="Run teardown">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>

                <div className="lpt-below-form">
                  <p className="lpt-examples">
                    Try —{" "}
                    {EXAMPLES.map((url, i) => (
                      <span key={url}>
                        <button type="button" className="lpt-example-btn" onClick={() => handleExampleClick(url)}>
                          {url}
                        </button>
                        {i < EXAMPLES.length - 1 && " / "}
                      </span>
                    ))}
                  </p>
                  {import.meta.env.DEV && (
                    <label className="test-mode-row">
                      <span className="toggle-switch">
                        <input type="checkbox" checked={testMode} onChange={toggleTestMode} />
                        <span className="toggle-track">
                          <span className="toggle-thumb" />
                        </span>
                      </span>
                      Demo mode — mock data, no API cost
                    </label>
                  )}
                </div>

                {teardownPhase === "error" && (
                  <div className="lpt-notice" style={{ marginTop: 28 }}>
                    <span className="lpt-notice-label lpt-notice-label--danger">
                      Couldn't complete the teardown
                    </span>
                    <p className="lpt-notice-text">{teardownError}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Report: gated phase ──────────────────────────────────────── */}
        {teardownPhase === "gated" && teardownResult && (
          <div className="lpt-fade-in lpt-report-grid">
            <ScoreHead
              overall={teardownResult.teardown.overall}
              overallVerdict={teardownResult.teardown.overallVerdict}
              resultUrl={teardownResult.url}
              analyzedAt={teardownResult.analyzedAt}
              isMock={teardownResult.mock}
              onBack={backToInput}
            />
            <TeaserReport
              teardown={teardownResult.teardown}
              url={teardownResult.url}
              title={teardownResult.title}
              onConfirmed={(email) => {
                setConfirmedEmail(email);
                setTeardownPhase("confirmed");
              }}
            />
          </div>
        )}

        {/* ── Confirmed phase ──────────────────────────────────────────── */}
        {teardownPhase === "confirmed" && (
          <div className="lpt-fade-in lpt-confirmed">
            <div className="lpt-confirmed-icon">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect x="3" y="6" width="22" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
                <path d="M4 8l10 8 10-8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="lpt-confirmed-title">Check your inbox.</h2>
            <p className="lpt-confirmed-sub">
              Your full teardown is on its way to <strong>{confirmedEmail}</strong>. It should arrive in seconds.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={backToInput}>
              Analyze another URL →
            </button>
          </div>
        )}

      </div>
    </>
  );
}
