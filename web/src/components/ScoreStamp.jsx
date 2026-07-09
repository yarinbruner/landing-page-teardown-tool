function tier(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return { key: "success", word: "Strong" };
  if (pct >= 50) return { key: "warning", word: "Needs work" };
  return { key: "danger", word: "Weak" };
}

const SIZES = {
  lg: { box: 56, stroke: 4 },
  sm: { box: 40, stroke: 3 },
};

export default function ScoreStamp({ score, max = 100, size = "md" }) {
  const { key, word } = tier(score, max);
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const rounded = Math.round(score);
  const { box, stroke } = SIZES[size] || SIZES.lg;
  const r = (box - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div
      className={`stamp stamp--${size} stamp--${key}`}
      style={{ width: box, height: box }}
      aria-label={`Score ${rounded} out of ${max}, ${word}`}
    >
      <svg className="stamp-ring" width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
        <circle
          className="stamp-ring-track"
          cx={box / 2}
          cy={box / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="stamp-ring-fill"
          cx={box / 2}
          cy={box / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${box / 2} ${box / 2})`}
        />
      </svg>
      <div className="stamp-score">{rounded}</div>
    </div>
  );
}
