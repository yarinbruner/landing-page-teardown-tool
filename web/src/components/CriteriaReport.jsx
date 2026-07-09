import { useState } from "react";
import ScoreStamp from "./ScoreStamp.jsx";

const CRITERIA_LABELS = {
  messageAndValueProp: "Message & Value Prop",
  callToAction: "Call to Action",
  trustAndCredibility: "Trust & Credibility",
  frictionAndClarity: "Friction & Clarity",
  urgencyAndMotivation: "Urgency & Motivation",
};

const CRITERIA_ORDER = [
  "messageAndValueProp",
  "callToAction",
  "trustAndCredibility",
  "frictionAndClarity",
  "urgencyAndMotivation",
];

// A bold, distinct color per criterion instead of one repeated brand accent
// — each hex verified to clear 4.5:1 (WCAG AA) both as text and as a solid
// fill under white text, against the cream --bg specifically (its lower
// luminance than pure white pushed the friction/urgency shades below 4.5:1,
// so they're darkened slightly from the pre-cream-redesign values). Picked
// for a loose thematic fit (trust = teal/"green light", urgency = red,
// friction = caution-yellow) rather than assigned randomly, so the color
// still reads as systematic.
const CRITERIA_COLORS = {
  messageAndValueProp: "#7c3aed",
  callToAction: "#2563eb",
  trustAndCredibility: "#0f766e",
  frictionAndClarity: "#8a5a05",
  urgencyAndMotivation: "#b71c1c",
};

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

export default function CriteriaReport({ teardown, providerLabel = "Claude" }) {
  const { criteria, overall, overallVerdict, highestLeverageFix } = teardown;

  const weakestFirst = [...CRITERIA_ORDER].sort(
    (a, b) => (criteria[a]?.barPercent ?? 100) - (criteria[b]?.barPercent ?? 100)
  );
  const [activeKey, setActiveKey] = useState(weakestFirst[0]);
  const active = criteria[activeKey];

  return (
    <div className="criteria-report">
      <header className="criteria-head panel">
        <ScoreStamp score={overall} max={10} size="lg" />
        <div className="criteria-head-meta">
          <div className="criteria-eyebrow">Expert teardown — {providerLabel}, industry-standard CoT</div>
          <p className="criteria-overall-verdict">{overallVerdict}</p>
        </div>
      </header>

      <div className="criteria-callout panel">
        <div className="criteria-callout-label">Highest-leverage fix</div>
        <p>{highestLeverageFix}</p>
      </div>

      <div className="criteria-tabs" role="tablist">
        {CRITERIA_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === activeKey}
            aria-label={CRITERIA_LABELS[key]}
            title={CRITERIA_LABELS[key]}
            className={`criteria-tab ${key === activeKey ? "criteria-tab--active" : ""}`}
            style={{ "--tab-color": CRITERIA_COLORS[key] }}
            onClick={() => setActiveKey(key)}
          >
            <span className="criteria-tab-dot" />
          </button>
        ))}
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

          <ul className="criterion-findings">
            {active.findings.map((f, i) => (
              <li key={i}>
                <p>{f.text}</p>
                <RatingPips value={f.rating} />
              </li>
            ))}
          </ul>

          <div className="criterion-fix">
            <span className="criterion-fix-label">Change this</span>
            <p>{active.whatToChange}</p>
          </div>
        </div>
      )}
    </div>
  );
}
