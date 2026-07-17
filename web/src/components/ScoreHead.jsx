import { useEffect, useRef, useState } from "react";

function tierFor(overall) {
  const pct = (overall / 10) * 100;
  if (pct >= 80) return { word: "Strong", color: "var(--accent-strong)", bg: "var(--accent-soft)" };
  if (pct >= 50) return { word: "Needs work", color: "var(--ink)", bg: "var(--surface-2)" };
  return { word: "Weak", color: "var(--danger)", bg: "var(--danger-soft)" };
}

export default function ScoreHead({ overall, overallVerdict, resultUrl, analyzedAt, isMock, onBack }) {
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const verdictRef = useRef(null);
  const tier = tierFor(overall);
  const score = Math.round(overall * 10) / 10;

  useEffect(() => {
    const el = verdictRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setAtEnd(false);
  }, [overallVerdict]);

  function advanceVerdict() {
    const el = verdictRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 1) return;
    if (el.scrollTop >= maxScroll - 1) {
      el.scrollTo({ top: 0, behavior: "smooth" });
      setAtEnd(false);
      return;
    }
    el.scrollTo({ top: maxScroll, behavior: "smooth" });
    setAtEnd(true);
  }

  return (
    <div className="lpt-sidebar">
      <button type="button" className="btn btn-ghost" onClick={onBack}>← New teardown</button>

      <div className="lpt-score-num">
        <div className="cmyk-num">
          <span className="paper">{score}</span>
          <span className="plate plate-c" aria-hidden="true">{score}</span>
          <span className="plate plate-m" aria-hidden="true">{score}</span>
          <span className="plate plate-y" aria-hidden="true">{score}</span>
        </div>
      </div>

      <div className="lpt-tier-row">
        <span className="tag" style={{ background: tier.bg, color: tier.color }}>{tier.word}</span>
        <span className="lpt-tier-of">of 10</span>
      </div>

      <div className="lpt-verdict">
        <blockquote ref={verdictRef} className="lpt-verdict-text">
          "{overallVerdict}"
        </blockquote>
        {overflowing && (
          <button
            type="button"
            className="lpt-verdict-more"
            onClick={advanceVerdict}
            aria-label={atEnd ? "Back to start of summary" : "Show more of summary"}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 10 10"
              style={atEnd ? { transform: "rotate(180deg)" } : undefined}
            >
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            more
          </button>
        )}
      </div>

      <p className="lpt-result-meta">
        {resultUrl}<br />
        Analyzed {new Date(analyzedAt).toLocaleString()}
        {isMock && (
          <><br /><span className="mock-badge" style={{ marginTop: 6, display: "inline-block" }}>Mock data</span></>
        )}
      </p>
    </div>
  );
}
