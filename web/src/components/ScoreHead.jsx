import ScoreStamp from "./ScoreStamp.jsx";

export default function ScoreHead({ overall, overallVerdict }) {
  return (
    <div className="score-head panel">
      <ScoreStamp score={overall} max={10} size="lg" />
      <div className="score-head-meta">
        <div className="criteria-eyebrow">Teardown summary</div>
        <p className="criteria-overall-verdict">{overallVerdict}</p>
      </div>
    </div>
  );
}
