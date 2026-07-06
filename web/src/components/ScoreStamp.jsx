function tier(score) {
  if (score >= 80) return { key: "green", word: "Strong" };
  if (score >= 50) return { key: "amber", word: "Needs work" };
  return { key: "red", word: "Weak" };
}

export default function ScoreStamp({ score, size = "md" }) {
  const { key, word } = tier(score);
  return (
    <div className={`stamp stamp--${size} stamp--${key}`} aria-label={`Score ${score} out of 100, ${word}`}>
      <div className="stamp-score">{score}</div>
      <div className="stamp-word">{word}</div>
    </div>
  );
}
