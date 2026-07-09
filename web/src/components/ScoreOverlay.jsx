import ScoreStamp from "./ScoreStamp.jsx";

export default function ScoreOverlay({ overall, overallVerdict, providerLabel }) {
  return (
    <div className="score-overlay">
      <ScoreStamp score={overall} max={10} size="lg" />
      <div className="score-overlay-meta">
        <div className="criteria-eyebrow">Expert teardown — {providerLabel}, industry-standard CoT</div>
        <p className="criteria-overall-verdict">{overallVerdict}</p>
      </div>
    </div>
  );
}
