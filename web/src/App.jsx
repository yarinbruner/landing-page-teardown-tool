import { useState } from "react";
import ScreenshotPane from "./components/ScreenshotPane.jsx";
import CriteriaReport from "./components/CriteriaReport.jsx";
import LoadingTips from "./components/LoadingTips.jsx";
import "./App.css";

const EXAMPLES = ["stripe.com", "linear.app", "notion.com"];
const TEST_MODE_STORAGE_KEY = "teardown:testMode";
const PROVIDER_STORAGE_KEY = "teardown:provider";
const MODEL_STORAGE_KEY_PREFIX = "teardown:model:";

const PROVIDERS = {
  anthropic: {
    label: "Claude",
    keyStorageKey: "teardown:anthropicApiKey",
    keyHeader: "x-anthropic-api-key",
    keyPlaceholder: "sk-ant-…",
    keyHelp: "console.anthropic.com",
    models: [
      { value: "claude-sonnet-5", label: "Claude Sonnet 5 (recommended)" },
      { value: "claude-opus-4-8", label: "Claude Opus 4.8 (most capable)" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (fastest, cheapest)" },
    ],
  },
  openai: {
    label: "OpenAI",
    keyStorageKey: "teardown:openaiApiKey",
    keyHeader: "x-openai-api-key",
    keyPlaceholder: "sk-…",
    keyHelp: "platform.openai.com",
    models: [
      { value: "gpt-5.5", label: "GPT-5.5 (recommended)" },
      { value: "gpt-5.4", label: "GPT-5.4 (cheaper)" },
      { value: "gpt-5.4-mini", label: "GPT-5.4 Mini (fastest, cheapest)" },
    ],
  },
};

export default function App() {
  const [input, setInput] = useState("");
  const [teardownStatus, setTeardownStatus] = useState("idle"); // idle | loading | error | done
  const [teardownError, setTeardownError] = useState(null);
  const [teardownResult, setTeardownResult] = useState(null);

  const [provider, setProviderState] = useState(() => {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    return stored && PROVIDERS[stored] ? stored : "anthropic";
  });
  const providerConfig = PROVIDERS[provider];

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(providerConfig.keyStorageKey) || "");
  const [model, setModelState] = useState(
    () => localStorage.getItem(MODEL_STORAGE_KEY_PREFIX + provider) || providerConfig.models[0].value
  );
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [testMode, setTestMode] = useState(() => localStorage.getItem(TEST_MODE_STORAGE_KEY) === "1");

  function selectProvider(next) {
    if (next === provider) return;
    setProviderState(next);
    localStorage.setItem(PROVIDER_STORAGE_KEY, next);
    setApiKey(localStorage.getItem(PROVIDERS[next].keyStorageKey) || "");
    setModelState(localStorage.getItem(MODEL_STORAGE_KEY_PREFIX + next) || PROVIDERS[next].models[0].value);
    setApiKeyDraft("");
    setEditingKey(false);
  }

  function selectModel(next) {
    setModelState(next);
    localStorage.setItem(MODEL_STORAGE_KEY_PREFIX + provider, next);
  }

  function saveApiKey() {
    const trimmed = apiKeyDraft.trim();
    localStorage.setItem(providerConfig.keyStorageKey, trimmed);
    setApiKey(trimmed);
    setApiKeyDraft("");
    setEditingKey(false);
  }

  function clearApiKey() {
    localStorage.removeItem(providerConfig.keyStorageKey);
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
        headers: { "Content-Type": "application/json", [providerConfig.keyHeader]: apiKey },
        body: JSON.stringify({ url, mock: testMode, provider, model }),
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
      <header className="masthead accent-glow">
        <div className="masthead-eyebrow">Landing Page Teardown</div>
        <h1 className="masthead-title">Score the pitch, not just the paint.</h1>
        <p className="masthead-sub">
          Drop in a URL. Claude or OpenAI runs it through an industry-standard conversion teardown — message
          &amp; value prop, call to action, trust, friction, and urgency — using your own API key.
        </p>
      </header>

      <div className="provider-row">
        {Object.entries(PROVIDERS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            className={`provider-tab ${provider === key ? "provider-tab--active" : ""}`}
            onClick={() => selectProvider(key)}
          >
            {cfg.label}
          </button>
        ))}
        <select className="model-select" value={model} onChange={(e) => selectModel(e.target.value)}>
          {providerConfig.models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

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
              placeholder={providerConfig.keyPlaceholder}
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
            {providerConfig.label} API key saved (stays in your browser) ·{" "}
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
            No {providerConfig.label} API key added —{" "}
            <button className="api-key-link" type="button" onClick={() => setEditingKey(true)}>
              add one
            </button>{" "}
            from {providerConfig.keyHelp} to run a teardown
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
          title={apiKey || testMode ? undefined : "Add an API key above, or enable test mode"}
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
              title={apiKey || testMode ? undefined : "Add an API key above, or enable test mode"}
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
            <div className="report-head-date">
              Analyzed {new Date(teardownResult.analyzedAt).toLocaleString()}
              {teardownResult.provider && ` · ${PROVIDERS[teardownResult.provider]?.label || teardownResult.provider} · ${teardownResult.model}`}
            </div>
          </div>

          <div className="report-grid">
            <ScreenshotPane screenshotUrl={teardownResult.screenshots.full} />
            <CriteriaReport
              teardown={teardownResult.teardown}
              providerLabel={PROVIDERS[teardownResult.provider]?.label || "Claude"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
