import ScoreStamp from "./ScoreStamp.jsx";

const LENS_LABELS = { meclabs: "MECLABS", fogg: "Fogg Behavior Model", jtbd: "Jobs-to-be-Done", cialdini: "Cialdini" };
const MECLABS_LABELS = { m: "Motivation", v: "Value proposition", i: "Incentive", f: "Friction", a: "Anxiety" };
const JTBD_LABELS = { functional: "Functional", emotional: "Emotional", social: "Social" };
const CIALDINI_LABELS = {
  reciprocity: "Reciprocity",
  commitment: "Commitment",
  socialProof: "Social proof",
  authority: "Authority",
  liking: "Liking",
  scarcity: "Scarcity",
  unity: "Unity",
};
const ELEMENT_LABELS = {
  headline: "Headline",
  cta: "Call to action",
  trust: "Trust",
  friction: "Friction",
  messageMarketFit: "Message-market fit",
};

export default function ExpertTeardown({ teardown }) {
  const { observe, hypothesize, conflict, score } = teardown;

  return (
    <div className="expert-teardown">
      <header className="expert-head">
        <ScoreStamp score={score.overall} size="lg" />
        <div className="expert-head-meta">
          <div className="expert-eyebrow">Expert teardown — Claude, industry-standard CoT</div>
          <p className="expert-overall-reasoning">{score.overallReasoning}</p>
          <p className="expert-methodology-note">
            Scored on MECLABS' bottleneck rule: overall is capped by the single weakest lever below, not
            averaged — a page can have excellent trust and motivation and still score low if just one
            variable (often incentive/urgency) is missing.
          </p>
        </div>
      </header>

      <div className="expert-callout expert-callout--fix">
        <div className="expert-callout-label">Highest-leverage fix</div>
        <p>{score.highestLeverageFix}</p>
      </div>

      <section className="expert-section">
        <h4 className="expert-section-title">01 — Observe</h4>
        <p>{observe}</p>
      </section>

      <section className="expert-section">
        <h4 className="expert-section-title">02 — Hypothesize</h4>
        <div className="expert-lens-grid">
          {Object.entries(hypothesize).map(([key, text]) => (
            <div className="expert-lens" key={key}>
              <div className="expert-lens-label">{LENS_LABELS[key] || key}</div>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="expert-callout expert-callout--conflict">
        <div className="expert-callout-label">03 — Find the conflict</div>
        <p>{conflict}</p>
      </div>

      <section className="expert-section">
        <h4 className="expert-section-title">04 — Score</h4>

        <div className="expert-score-grid">
          <div className="expert-score-block">
            <div className="expert-score-block-label">MECLABS</div>
            <ul className="expert-meter-list">
              {Object.entries(score.meclabs).map(([key, value]) => (
                <li key={key} className="expert-meter">
                  <span className="expert-meter-label">{MECLABS_LABELS[key] || key}</span>
                  <span className="expert-meter-bar">
                    <span className="expert-meter-fill" style={{ width: `${value}%` }} />
                  </span>
                  <span className="expert-meter-value">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="expert-score-block">
            <div className="expert-score-block-label">Fogg — broken vertex</div>
            <div className="expert-tag expert-tag--broken">{score.foggBrokenVertex}</div>
          </div>

          <div className="expert-score-block">
            <div className="expert-score-block-label">Jobs-to-be-Done</div>
            <ul className="expert-meter-list">
              {Object.entries(score.jtbd).map(([key, value]) => (
                <li key={key} className="expert-meter">
                  <span className="expert-meter-label">{JTBD_LABELS[key] || key}</span>
                  <span className="expert-meter-bar">
                    <span className="expert-meter-fill" style={{ width: `${value}%` }} />
                  </span>
                  <span className="expert-meter-value">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="expert-score-block">
            <div className="expert-score-block-label">Cialdini audit</div>
            <ul className="expert-tag-list">
              {Object.entries(score.cialdiniAudit).map(([key, verdict]) => (
                <li key={key} className={`expert-tag expert-tag--${verdict}`}>
                  {CIALDINI_LABELS[key] || key} · {verdict}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="expert-element-stack">
          {Object.entries(score.elements).map(([key, el]) => (
            <div className="expert-element" key={key}>
              <header className="expert-element-head">
                <span className="expert-element-title">{ELEMENT_LABELS[key] || key}</span>
                <ScoreStamp score={el.score} size="sm" />
              </header>
              <p className="expert-element-verdict">{el.verdict}</p>
              <p className="expert-element-fix">
                <strong>Fix:</strong> {el.fix}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
