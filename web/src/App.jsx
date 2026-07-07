import { useMemo, useState } from "react";
import ScoreStamp from "./components/ScoreStamp.jsx";
import ScreenshotPane from "./components/ScreenshotPane.jsx";
import CategoryCard from "./components/CategoryCard.jsx";
import ExpertTeardown from "./components/ExpertTeardown.jsx";
import "./App.css";

const EXAMPLES = ["stripe.com", "linear.app", "notion.com"];
const API_KEY_STORAGE_KEY = "teardown:anthropicApiKey";

export default function App() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activePin, setActivePin] = useState(null);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || "");
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [expertStatus, setExpertStatus] = useState("idle"); // idle | loading | error | done
  const [expertError, setExpertError] = useState(null);
  const [expertResult, setExpertResult] = useState(null);

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

  async function runExpertTeardown(rawUrl) {
    const url = rawUrl.trim();
    if (!url || !apiKey) return;
    setExpertStatus("loading");
    setExpertError(null);
    try {
      const res = await fetch("/api/expert-teardown", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-anthropic-api-key": apiKey },
        body: JSON.stringify({ url }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setExpertResult(body);
      setExpertStatus("done");
    } catch (e) {
      setExpertError(e.message || "Could not reach the analysis server.");
      setExpertStatus("error");
    }
  }

  async function runAnalysis(rawUrl) {
    const url = rawUrl.trim();
    if (!url) return;
    setStatus("loading");
    setError(null);
    setExpertStatus("idle");
    setExpertError(null);
    setExpertResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setResult(body);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Could not reach the analysis server.");
      setStatus("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runAnalysis(input);
  }

  const pins = useMemo(() => {
    if (!result) return [];
    const list = [];
    const { headline, cta, trust } = result.categories;
    if (headline.rect) list.push({ id: "H", tone: "ink", label: "Headline", rect: headline.rect });
    if (cta.rect) list.push({ id: "C", tone: "red", label: `Primary CTA — "${cta.primaryText}"`, rect: cta.rect });
    (trust.markers || []).forEach((m, i) => {
      list.push({ id: `T${i + 1}`, tone: "green", label: `Trust signal — ${m.type}`, rect: m.rect });
    });
    return list;
  }, [result]);

  const checkPinMaps = useMemo(() => {
    if (!result) return { headline: {}, cta: {}, trust: {} };
    const trustPins = (result.categories.trust.markers || []).map((m, i) => ({ type: m.type, id: `T${i + 1}` }));
    const findTrustPin = (type) => trustPins.find((p) => p.type === type)?.id;
    return {
      headline: { above_fold: "H", prominence: "H" },
      cta: { above_fold_cta: "C", action_language: "C", contrast: "C", size: "C" },
      trust: {
        testimonials: findTrustPin("testimonial"),
        logos: findTrustPin("logo"),
        security_badges: findTrustPin("badge"),
      },
    };
  }, [result]);

  return (
    <div className="page paper-texture">
      <header className="masthead">
        <div className="masthead-eyebrow">Landing Page Teardown</div>
        <h1 className="masthead-title">Score the pitch, not just the paint.</h1>
        <p className="masthead-sub">
          Drop in a URL. Get a full-page screenshot marked up against conversion best practices for
          headline clarity, call-to-action strength, and trust signals — free, rule-based, runs locally.
          Add your own Claude API key for a deeper, industry-standard expert teardown.
        </p>
      </header>

      <div className="api-key-row">
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
            <button className="api-key-cancel" type="button" onClick={() => setEditingKey(false)}>
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
            to unlock the expert teardown
          </span>
        )}
      </div>

      <form className="url-bar" onSubmit={handleSubmit}>
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
        <button className="url-bar-submit" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Tearing down…" : "Tear it down →"}
        </button>
      </form>

      {status === "idle" && (
        <div className="examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="example-chip"
              onClick={() => {
                setInput(ex);
                runAnalysis(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="banner banner--error">
          <strong>Couldn't complete the teardown.</strong> {error}
        </div>
      )}

      {status === "loading" && (
        <div className="loading-state">
          <div className="loading-mark" />
          <p>Loading the page headlessly, capturing screenshots, and grading it…</p>
        </div>
      )}

      {status === "done" && result && (
        <div className="report">
          <div className="report-head">
            <ScoreStamp score={result.overallScore} size="lg" />
            <div className="report-head-meta">
              <div className="report-head-url">{result.url}</div>
              <div className="report-head-title">{result.title}</div>
              <div className="report-head-date">
                Analyzed {new Date(result.analyzedAt).toLocaleString()} at {result.viewport.width}×
                {result.viewport.height}
              </div>
            </div>
          </div>

          <div className="report-grid">
            <ScreenshotPane
              screenshotUrl={result.screenshots.full}
              viewportWidth={result.viewport.width}
              pageHeight={result.pageHeight}
              pins={pins}
              activePin={activePin}
              onPinHover={setActivePin}
            />

            <div className="card-stack">
              <CategoryCard
                eyebrow="01 — Message"
                title="Headline"
                data={result.categories.headline}
                checkPinMap={checkPinMaps.headline}
                activePin={activePin}
                onPinHover={setActivePin}
              />
              <CategoryCard
                eyebrow="02 — Action"
                title="Call to action"
                data={result.categories.cta}
                checkPinMap={checkPinMaps.cta}
                activePin={activePin}
                onPinHover={setActivePin}
              />
              <CategoryCard
                eyebrow="03 — Credibility"
                title="Trust signals"
                data={result.categories.trust}
                checkPinMap={checkPinMaps.trust}
                activePin={activePin}
                onPinHover={setActivePin}
              />
            </div>
          </div>

          <div className="expert-cta-row">
            <div>
              <strong>Want a deeper, industry-standard teardown?</strong>{" "}
              <span className="expert-cta-sub">
                Runs Claude through the full Observe → Hypothesize → Find the Conflict → Score process
                (MECLABS, Fogg, JTBD, Cialdini) using your own API key.
              </span>
            </div>
            <button
              className="expert-cta-button"
              type="button"
              disabled={!apiKey || expertStatus === "loading"}
              onClick={() => runExpertTeardown(result.url)}
              title={apiKey ? undefined : "Add a Claude API key above first"}
            >
              {expertStatus === "loading" ? "Running expert teardown…" : "Run expert teardown →"}
            </button>
          </div>

          {expertStatus === "error" && (
            <div className="banner banner--error">
              <strong>Couldn't complete the expert teardown.</strong> {expertError}
            </div>
          )}

          {expertStatus === "done" && expertResult && <ExpertTeardown teardown={expertResult.teardown} />}
        </div>
      )}
    </div>
  );
}
