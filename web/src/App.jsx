import { useState } from "react";
import ScreenshotPane from "./components/ScreenshotPane.jsx";
import ScoreHead from "./components/ScoreHead.jsx";
import CriteriaReport from "./components/CriteriaReport.jsx";
import LoadingTips from "./components/LoadingTips.jsx";
import ModelPicker from "./components/ModelPicker.jsx";
import ApiKeyPopover from "./components/ApiKeyPopover.jsx";
import { CRITERIA_ORDER } from "./criteriaMeta.js";
import "./App.css";

// Reuses three of the five Boggle criteria colors (see CriteriaReport.jsx)
// so the input screen isn't purely monochrome+blue — a light touch of the
// same playful palette that shows up in the report.
const EXAMPLES = [
  { url: "stripe.com", color: "#7c3aed" },
  { url: "linear.app", color: "#0f766e" },
  { url: "notion.com", color: "#8a5a05" },
];
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
  // Always opens on the first criterion (Message & Value Prop / purple),
  // not a "weakest first" sort — a stable, predictable starting tab.
  const [activeCriterion, setActiveCriterion] = useState(CRITERIA_ORDER[0]);

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
      setActiveCriterion(CRITERIA_ORDER[0]);
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

  function backToInput() {
    setTeardownStatus("idle");
    setTeardownResult(null);
    setTeardownError(null);
  }

  const showReport = teardownStatus === "done" && teardownResult;

  return (
    <div className="page">
      {showReport ? (
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
              {teardownResult.provider && ` · ${PROVIDERS[teardownResult.provider]?.label || teardownResult.provider} · ${teardownResult.model}`}
            </div>
          </div>

          <div className="report-grid">
            <div className="shot-wrap">
              <ScoreHead
                overall={teardownResult.teardown.overall}
                overallVerdict={teardownResult.teardown.overallVerdict}
                providerLabel={PROVIDERS[teardownResult.provider]?.label || "Claude"}
              />
              <ScreenshotPane screenshotUrl={teardownResult.screenshots.full} />
            </div>
            <CriteriaReport
              teardown={teardownResult.teardown}
              activeKey={activeCriterion}
              onSelectCriterion={setActiveCriterion}
            />
          </div>
        </div>
      ) : (
        <div className="screen" key="input">
          <header className="masthead">
            <div className="masthead-eyebrow">Landing Page Teardown</div>
            <h1 className="masthead-title">Score the pitch, not just the paint.</h1>
            <p className="masthead-sub">
              Drop in a URL. Claude or OpenAI runs it through an industry-standard conversion teardown — message
              &amp; value prop, call to action, trust, friction, and urgency — using your own API key.
            </p>
          </header>

          <div className="settings-row">
            <ModelPicker
              providers={PROVIDERS}
              provider={provider}
              model={model}
              onSelectProvider={selectProvider}
              onSelectModel={selectModel}
            />
            <ApiKeyPopover
              providerConfig={providerConfig}
              apiKey={apiKey}
              editingKey={editingKey}
              setEditingKey={setEditingKey}
              apiKeyDraft={apiKeyDraft}
              setApiKeyDraft={setApiKeyDraft}
              saveApiKey={saveApiKey}
              clearApiKey={clearApiKey}
              cancelEditingKey={cancelEditingKey}
            />
          </div>

          {teardownStatus === "loading" ? (
            <LoadingTips />
          ) : (
            <>
              <form className="url-bar panel" onSubmit={handleSubmit}>
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
                <button
                  className="url-bar-submit"
                  type="submit"
                  disabled={!apiKey && !testMode}
                  title={apiKey || testMode ? undefined : "Add an API key above, or enable test mode"}
                >
                  Teardown →
                </button>
              </form>

              <div className="below-url-row">
                <label className="test-mode-row">
                  <span className="toggle-switch">
                    <input type="checkbox" checked={testMode} onChange={toggleTestMode} />
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                  </span>
                  Test mode (No API)
                </label>

                {teardownStatus === "idle" && (
                  <div className="examples">
                    <span>Try:</span>
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.url}
                        type="button"
                        className="example-chip"
                        style={{ "--chip-color": ex.color }}
                        disabled={!apiKey && !testMode}
                        title={apiKey || testMode ? undefined : "Add an API key above, or enable test mode"}
                        onClick={() => {
                          setInput(ex.url);
                          runTeardown(ex.url);
                        }}
                      >
                        {ex.url}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {teardownStatus === "error" && (
                <div className="banner banner--error panel">
                  <strong>Couldn't complete the teardown.</strong> {teardownError}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
