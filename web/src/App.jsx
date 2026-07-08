import { useState } from "react";
import ScreenshotPane from "./components/ScreenshotPane.jsx";
import CriteriaReport from "./components/CriteriaReport.jsx";
import LoadingTips from "./components/LoadingTips.jsx";
import "./App.css";

const EXAMPLES = ["stripe.com", "linear.app", "notion.com"];
const API_KEY_STORAGE_KEY = "teardown:anthropicApiKey";
const TEST_MODE_STORAGE_KEY = "teardown:testMode";

export default function App() {
  const [input, setInput] = useState("");
  const [teardownStatus, setTeardownStatus] = useState("idle"); // idle | loading | error | done
  const [teardownError, setTeardownError] = useState(null);
  const [teardownResult, setTeardownResult] = useState(null);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || "");
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [testMode, setTestMode] = useState(() => localStorage.getItem(TEST_MODE_STORAGE_KEY) === "1");

  function saveApiKey() {
    const trimmed = apiKeyDraft.trim();
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    setApiKey(trimmed);
    setApiKeyDraft("");
    setEditingKey(false);
  }

  function clearApiKey() {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey("");
  }

  function cancelEditingKey() {
    setApiKeyDraft("");
    setEditingKey(false);
  }

  function toggleTestMode() {
    setTestMode((prev) => {
      const next = !prev;
      localStorage.setItem(TEST_MODE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function runTeardown(rawUrl) {
    const url = rawUrl.trim();
    if (!url || (!apiKey && !testMode) || teardownStatus === "loading") return;
    setTeardownStatus("loading");
    setTeardownError(null);
    setTeardownResult(null);
    try {
      const res = await fetch("/api/expert-teardown", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anthropic-api-key": apiKey },
        body: JSON.stringify({ url, mock: testMode }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setTeardownResult(body);
      setTeardownStatus("done");
    } catch (e) {
      setTeardownError(e.message || "Could not reach the analysis server.");
      setTeardownStatus("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runTeardown(input);
  }

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-eyebrow">Landing Page Teardown</div>
        <h1 className="masthead-title">Score the pitch, not just the paint.</h1>
        <p className="masthead-sub">
          Drop in a URL. Claude runs it through an industry-standard conversion teardown — message &amp; value
          prop, call to action, trust, friction, and urgency — using your own API key.
        </p>
      </header>

      <div className="api-key-row panel">
        {editingKey ? (
          <form
            className="api-key-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveApiKey();
            }}
          >
            <input
              className="api-key-input"
              type="password"
              placeholder="sk-ant-…"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              autoFocus
              spellCheck={false}
            />
            <button className="api-key-save" type="submit">
              Save
            </button>
            <button className="api-key-cancel" type="button" onClick={cancelEditingKey}>
              Cancel
            </button>
          </form>
        ) : apiKey ? (
          <span className="api-key-status">
            Claude API key saved (stays in your browser) ·{" "}
            <button className="api-key-link" type="button" onClick={() => setEditingKey(true)}>
              change
            </button>{" "}
            ·{" "}
            <button className="api-key-link" type="button" onClick={clearApiKey}>
              clear
            </button>
          </span>
        ) : (
          <span className="api-key-status">
            No Claude API key added —{" "}
            <button className="api-key-link" type="button" onClick={() => setEditingKey(true)}>
              add one
            </button>{" "}
            to run a teardown
          </span>
        )}
      </div>

      <label className="test-mode-row">
        <input type="checkbox" checked={testMode} onChange={toggleTestMode} />
        Test mode — mock data, no API cost
      </label>

      <form className="url-bar panel" onSubmit={handleSubmit}>
        <span className="url-bar-prefix">URL</span>
        <input
          className="url-bar-input"
          type="text"
          placeholder="e.g. stripe.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoFocus
        />
        <button
          className="url-bar-submit"
          type="submit"
          disabled={(!apiKey && !testMode) || teardownStatus === "loading"}
          title={apiKey || testMode ? undefined : "Add a Claude API key above, or enable test mode"}
        >
          {teardownStatus === "loading" ? "Tearing down…" : "Tear it down →"}
        </button>
      </form>

      {teardownStatus === "idle" && (
        <div className="examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="example-chip"
              disabled={!apiKey && !testMode}
              title={apiKey || testMode ? undefined : "Add a Claude API key above, or enable test mode"}
              onClick={() => {
                setInput(ex);
                runTeardown(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {teardownStatus === "error" && (
        <div className="banner banner--error panel">
          <strong>Couldn't complete the teardown.</strong> {teardownError}
        </div>
      )}

      {teardownStatus === "loading" && <LoadingTips />}

      {teardownStatus === "done" && teardownResult && (
        <div className="report">
          <div className="report-head panel">
            {teardownResult.mock && <div className="mock-badge">Mock data — no API call was made</div>}
            <div className="report-head-url">{teardownResult.url}</div>
            <div className="report-head-title">{teardownResult.title}</div>
            <div className="report-head-date">Analyzed {new Date(teardownResult.analyzedAt).toLocaleString()}</div>
          </div>

          <div className="report-grid">
            <ScreenshotPane screenshotUrl={teardownResult.screenshots.full} />
            <CriteriaReport teardown={teardownResult.teardown} />
          </div>
        </div>
      )}
    </div>
  );
}
