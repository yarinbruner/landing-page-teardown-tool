import { useState } from "react";
import ScreenshotPane from "./components/ScreenshotPane.jsx";
import ScoreHead from "./components/ScoreHead.jsx";
import CriteriaReport from "./components/CriteriaReport.jsx";
import TeaserReport from "./components/TeaserReport.jsx";
import EmailGate from "./components/EmailGate.jsx";
import LoadingTips from "./components/LoadingTips.jsx";
import { CRITERIA_ORDER } from "./criteriaMeta.js";
import "./App.css";

const EXAMPLES = [
  { url: "stripe.com", color: "#7c3aed" },
  { url: "linear.app", color: "#0f766e" },
  { url: "notion.com", color: "#8a5a05" },
];

const TEST_MODE_STORAGE_KEY = "teardown:testMode";

export default function App() {
  const [input, setInput] = useState("");
  const [teardownPhase, setTeardownPhase] = useState("idle");
  const [teardownError, setTeardownError] = useState(null);
  const [teardownResult, setTeardownResult] = useState(null);
  const [activeCriterion, setActiveCriterion] = useState(CRITERIA_ORDER[0]);
  const [testMode, setTestMode] = useState(() => localStorage.getItem(TEST_MODE_STORAGE_KEY) === "1");

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
      setTeardownResult(body);
      setActiveCriterion(CRITERIA_ORDER[0]);
      setTeardownPhase("gated");
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

  if (teardownPhase === "gated" && teardownResult) {
    return (
      <div className="page">
        <div className="screen screen--report" key="gated">
          <button type="button" className="back-button" onClick={backToInput}>
            ← New teardown
          </button>

          <div className="report-head">
            <div className="report-head-title">
              {teardownResult.title}
              {teardownResult.mock && <span className="mock-badge">Mock data</span>}
            </div>
            <div className="report-head-meta">
              {teardownResult.url} · Analyzed {new Date(teardownResult.analyzedAt).toLocaleString()}
            </div>
          </div>

          <div className="report-grid">
            <TeaserReport teardown={teardownResult.teardown} />
            <div className="shot-wrap">
              <ScoreHead
                overall={teardownResult.teardown.overall}
                overallVerdict={teardownResult.teardown.overallVerdict}
              />
              <EmailGate
                url={teardownResult.url}
                title={teardownResult.title}
                teardown={teardownResult.teardown}
                onUnlocked={() => setTeardownPhase("unlocked")}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teardownPhase === "unlocked" && teardownResult) {
    return (
      <div className="page">
        <div className="screen screen--report" key="report">
          <button type="button" className="back-button" onClick={backToInput}>
            ← New teardown
          </button>

          <div className="report-head">
            <div className="report-head-title">
              {teardownResult.title}
              {teardownResult.mock && <span className="mock-badge">Mock data</span>}
            </div>
            <div className="report-head-meta">
              {teardownResult.url} · Analyzed {new Date(teardownResult.analyzedAt).toLocaleString()}
            </div>
          </div>

          <div className="report-grid">
            <CriteriaReport
              teardown={teardownResult.teardown}
              activeKey={activeCriterion}
              onSelectCriterion={setActiveCriterion}
            />
            <div className="shot-wrap">
              <ScoreHead
                overall={teardownResult.teardown.overall}
                overallVerdict={teardownResult.teardown.overallVerdict}
              />
              <ScreenshotPane screenshotUrl={teardownResult.screenshotUrl} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="screen" key="input">
        <header className="masthead">
          <div className="bg-dots bg-dots--lg" aria-hidden="true" />
          <div className="bg-dots bg-dots--md" aria-hidden="true" />
          <div className="bg-dots bg-dots--sm" aria-hidden="true" />
          <div className="masthead-content">
            <div className="masthead-eyebrow">Landing Page Teardown</div>
            <h1 className="masthead-title">Score the pitch, not just the paint.</h1>
            <p className="masthead-sub">
              Drop in a URL. Get an industry-standard conversion teardown — message &amp; value
              prop, call to action, trust, friction, and urgency. Free, no sign-up required.
            </p>
          </div>
        </header>

        {teardownPhase === "ended" && (
          <div className="banner banner--ended panel">
            <strong>This campaign has closed.</strong> Thank you for your interest — the teardown
            tool is no longer accepting new analyses.
          </div>
        )}

        {teardownPhase === "loading" ? (
          <LoadingTips />
        ) : (
        <>
        <form className="url-bar" onSubmit={handleSubmit}>
          <label className="url-bar-prefix" htmlFor="teardown-url">
            URL
          </label>
          <input
            id="teardown-url"
            className="url-bar-input"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="e.g. stripe.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoFocus
          />
          <button className="url-bar-submit" type="submit">
            Teardown →
          </button>
        </form>

        <div className="below-url-row">
          {import.meta.env.DEV && (
            <label className="test-mode-row">
              <span className="toggle-switch">
                <input type="checkbox" checked={testMode} onChange={toggleTestMode} />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </span>
              Demo mode (no API call)
            </label>
          )}

          <div className="examples" style={!import.meta.env.DEV ? { marginLeft: "auto" } : {}}>
            <span>Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.url}
                type="button"
                className="example-chip"
                style={{ "--chip-color": ex.color }}
                onClick={() => handleExampleClick(ex.url)}
              >
                {ex.url}
              </button>
            ))}
          </div>
        </div>

        {teardownPhase === "error" && (
          <div className="banner banner--error panel">
            <strong>Couldn't complete the teardown.</strong> {teardownError}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
