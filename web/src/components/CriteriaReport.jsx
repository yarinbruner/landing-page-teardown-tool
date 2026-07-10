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

function ChevronIcon({ up }) {
  return (
    <svg className={`chevron ${up ? "chevron--up" : ""}`} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// The findings list is the one region allowed to run out of room (LLM
// finding count/length is unbounded) — but instead of growing the box to
// reveal more (which pushed into the fix box below it), the box stays a
// constant size forever. Clicking the arrow jumps the list to the next
// finding — overflow:hidden still allows this programmatic scroll while
// hiding the scrollbar, so nothing but the finding lines themselves ever
// moves. Reaching the end flips the arrow to point up (a click from
// there loops back to the top).
function Findings({ findings }) {
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setAtEnd(false);
  }, [findings]);

  function handleAdvance() {
    const el = listRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 1) return;
    if (el.scrollTop >= maxScroll - 1) {
      el.scrollTo({ top: 0 });
      setAtEnd(false);
      return;
    }
    const items = el.querySelectorAll("li");
    let nextTop = maxScroll;
    for (const li of items) {
      if (li.offsetTop > el.scrollTop + 1) {
        nextTop = li.offsetTop;
        break;
      }
    }
    const target = Math.min(nextTop, maxScroll);
    el.scrollTo({ top: target });
    setAtEnd(target >= maxScroll - 1);
  }

  return (
    <div className="criterion-findings-wrap">
      <ul ref={listRef} className="criterion-findings">
        {findings.map((f, i) => (
          <li key={i}>
            <span className="finding-index">{i + 1}</span>
            <p>{f.text}</p>
            <RatingPips value={f.rating} />
          </li>
        ))}
      </ul>
      {overflowing && (
        <button
          type="button"
          className="criterion-findings-toggle"
          onClick={handleAdvance}
          aria-label={atEnd ? "Back to first finding" : "Show next finding"}
        >
          <ChevronIcon up={atEnd} />
        </button>
      )}
    </div>
  );
}

export default function CriteriaReport({ teardown, activeKey, onSelectCriterion }) {
  const { criteria, highestLeverageFix } = teardown;
  const active = criteria[activeKey];

  return (
    <div className="criteria-report">
      <div className="criteria-callout panel">
        <div className="criteria-callout-label">Highest-leverage fix</div>
        <p>{highestLeverageFix}</p>
      </div>

      {active && (
        <div key={activeKey} className="criterion-card panel" style={{ "--criterion-color": CRITERIA_COLORS[activeKey] }}>
          <header className="criterion-card-head">
            <span className="criterion-card-dot" />
            <span className="criterion-card-title">{CRITERIA_LABELS[activeKey]}</span>
          </header>
          <ScoreBar percent={active.barPercent} />

          <Findings findings={active.findings} />

          <div className="criterion-fix">
            <span className="criterion-fix-label">Change this</span>
            <p>{active.whatToChange}</p>
          </div>

          <CriteriaTabs activeKey={activeKey} onChange={onSelectCriterion} />
        </div>
      )}
    </div>
  );
}
