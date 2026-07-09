import { useEffect, useRef, useState } from "react";
import { CRITERIA_COLORS, CRITERIA_LABELS } from "../criteriaMeta.js";

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
// detect the clip and offer an explicit "show more" toggle — expanding
// switches the list from clip-hidden to its own internal scroll, the same
// exception already granted to the screenshot pane, but opt-in per card.
function Findings({ findings }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [findings]);

  return (
    <div className="criterion-findings-wrap">
      <ul ref={listRef} className={`criterion-findings ${expanded ? "criterion-findings--expanded" : ""}`}>
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
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
          <span className={`chevron ${expanded ? "chevron--up" : ""}`} aria-hidden="true">
            ⌄
          </span>
        </button>
      )}
    </div>
  );
}

export default function CriteriaReport({ teardown, activeKey }) {
  const { criteria, highestLeverageFix } = teardown;
  const active = criteria[activeKey];

  return (
    <div className="criteria-report">
      <div className="criteria-callout panel">
        <div className="criteria-callout-label">Highest-leverage fix</div>
        <p>{highestLeverageFix}</p>
      </div>

      {active && (
        <div
          key={activeKey}
          className="criterion-card panel"
          style={{ "--criterion-color": CRITERIA_COLORS[activeKey] }}
        >
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
        </div>
      )}
    </div>
  );
}
