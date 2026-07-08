function tier(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return { key: "success", word: "Strong" };
  if (pct >= 50) return { key: "warning", word: "Needs work" };
  return { key: "danger", word: "Weak" };
}

export default function ScoreStamp({ score, max = 100, size = "md" }) {
  const { key, word } = tier(score, max);
  return (
    <div className={`stamp stamp--${size} stamp--${key}`} aria-label={`Score ${score} out of ${max}, ${word}`}>
      <div className="stamp-score">
        {score}
        {max !== 100 && <span className="stamp-score-max">/{max}</span>}
      </div>
      <div className="stamp-word">{word}</div>
    </div>
  );
}
