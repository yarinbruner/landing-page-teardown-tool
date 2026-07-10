import { useEffect, useRef, useState } from "react";
import { CRITERIA_COLORS, CRITERIA_LABELS } from "../criteriaMeta.js";
import CriteriaTabs from "./CriteriaTabs.jsx";

function ScoreBar({ percent }) {
  // Uses the criterion's own color (inherited via --criterion-color from
  // the parent .criterion-card) rather than a separate success/warning/
  // danger severity color, so the whole card — tab, dot, bar, fix box —
  // reads as one consistent color instead of two competing ones.
  return (
    <div className="score-bar" role="img" aria-label={`${percent}%`}>
      <div className="score-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function RatingPips({ value }) {
  return (
    <span className="rating-pips" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`rating-pip ${i <= value ? "rating-pip--filled" : ""}`} />
      ))}
    </span>
  );
}

// The findings list is the one region allowed to run out of room (LLM
// finding count/length is unbounded). Instead of always silently clipping,
// detect the clip and offer an explicit expand toggle. Clicking it
// animates the list's own height from its collapsed size up to its full
// content height (measured via scrollHeight, not guessed), so it visibly
// grows/"slides down" instead of an easy-to-miss internal scrollbar
// appearing inside an unchanged-size box. If the grown list still doesn't
// fit the card, .criterion-card--scrollable hands the whole card its own
// scroll — the same exception already granted to the screenshot pane.
function Findings({ findings, expanded, onToggleExpanded }) {
  const [overflowing, setOverflowing] = useState(false);
  const listRef = useRef(null);
  const collapsedHeightRef = useRef(null);
  const [animHeight, setAnimHeight] = useState(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (collapsedHeightRef.current == null) {
      collapsedHeightRef.current = el.clientHeight;
    }
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [findings]);

  function handleToggle() {
    const el = listRef.current;
    if (!el) {
      onToggleExpanded();
      return;
    }
    if (!expanded) {
      setAnimHeight(el.clientHeight);
      requestAnimationFrame(() => setAnimHeight(el.scrollHeight));
    } else {
      setAnimHeight(el.clientHeight);
      requestAnimationFrame(() => setAnimHeight(collapsedHeightRef.current));
    }
    onToggleExpanded();
  }

  return (
    <div className="criterion-findings-wrap">
      <ul
        ref={listRef}
        className={`criterion-findings ${expanded ? "criterion-findings--expanded" : ""}`}
        style={animHeight != null ? { maxHeight: animHeight } : undefined}
        onTransitionEnd={() => {
          if (!expanded) setAnimHeight(null);
        }}
      >
        {findings.map((f, i) => (
          <li key={i}>
            <p>{f.text}</p>
            <RatingPips value={f.rating} />
          </li>
        ))}
      </ul>
      {(overflowing || expanded) && (
        <button
          type="button"
          className="criterion-findings-toggle"
          onClick={handleToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Show fewer findings" : "Show more findings"}
        >
          <span className={`chevron ${expanded ? "chevron--up" : ""}`} aria-hidden="true">
            ⌄
          </span>
        </button>
      )}
    </div>
  );
}

export default function CriteriaReport({ teardown, activeKey, onSelectCriterion }) {
  const { criteria, highestLeverageFix } = teardown;
  const active = criteria[activeKey];
  const [findingsExpanded, setFindingsExpanded] = useState(false);

  function selectCriterion(key) {
    setFindingsExpanded(false);
    onSelectCriterion(key);
  }

  return (
    <div className="criteria-report">
      <div className="criteria-callout panel">
        <div className="criteria-callout-label">Highest-leverage fix</div>
        <p>{highestLeverageFix}</p>
      </div>

      {active && (
        <div
          key={activeKey}
          className={`criterion-card panel ${findingsExpanded ? "criterion-card--scrollable" : ""}`}
          style={{ "--criterion-color": CRITERIA_COLORS[activeKey] }}
        >
          <header className="criterion-card-head">
            <span className="criterion-card-dot" />
            <span className="criterion-card-title">{CRITERIA_LABELS[activeKey]}</span>
          </header>
          <ScoreBar percent={active.barPercent} />

          <Findings
            findings={active.findings}
            expanded={findingsExpanded}
            onToggleExpanded={() => setFindingsExpanded((v) => !v)}
          />

          <div className="criterion-fix">
            <span className="criterion-fix-label">Change this</span>
            <p>{active.whatToChange}</p>
          </div>
        </div>
      )}

      <CriteriaTabs activeKey={activeKey} onChange={selectCriterion} />
    </div>
  );
}
