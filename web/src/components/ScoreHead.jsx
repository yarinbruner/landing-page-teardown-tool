import ScoreStamp from "./ScoreStamp.jsx";

export default function ScoreHead({ overall, overallVerdict, providerLabel }) {
  return (
    <div className="score-head panel">
      <ScoreStamp score={overall} max={10} size="lg" />
      <div className="score-head-meta">
        <div className="criteria-eyebrow">Expert teardown — {providerLabel}, industry-standard CoT</div>
        <p className="criteria-overall-verdict">{overallVerdict}</p>
      </div>
    </div>
  );
}
