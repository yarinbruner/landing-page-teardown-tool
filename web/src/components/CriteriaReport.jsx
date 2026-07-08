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

function ScoreBar({ percent }) {
  const tier = percent >= 80 ? "success" : percent >= 50 ? "warning" : "danger";
  return (
    <div className="score-bar" role="img" aria-label={`${percent}%`}>
      <div className={`score-bar-fill score-bar-fill--${tier}`} style={{ width: `${percent}%` }} />
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

export default function CriteriaReport({ teardown }) {
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
          <div className="criteria-eyebrow">Expert teardown — Claude, industry-standard CoT</div>
          <p className="criteria-overall-verdict">{overallVerdict}</p>
        </div>
      </header>

      <div className="criteria-callout panel">
        <div className="criteria-callout-label">Highest-leverage fix</div>
        <p>{highestLeverageFix}</p>
      </div>

      <div className="criteria-tabs">
        {CRITERIA_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`criteria-tab ${key === activeKey ? "criteria-tab--active" : ""}`}
            onClick={() => setActiveKey(key)}
          >
            {CRITERIA_LABELS[key]}
          </button>
        ))}
      </div>

      {active && (
        <div className="criterion-card panel">
          <header className="criterion-card-head">
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
