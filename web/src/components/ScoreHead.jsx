import ScoreStamp from "./ScoreStamp.jsx";

export default function ScoreHead({ overall, overallVerdict }) {
  return (
    <div className="score-head panel">
      <div className="score-head-top">
        <ScoreStamp score={overall} max={10} size="lg" />
        <div className="criteria-eyebrow">Teardown summary</div>
      </div>
      <p className="criteria-overall-verdict">{overallVerdict}</p>
    </div>
  );
}
