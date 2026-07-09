import { useEffect, useState } from "react";

const STATUS_LINES = [
  "Reading the headline and value proposition…",
  "Checking the call to action…",
  "Auditing trust signals…",
  "Measuring friction and form length…",
  "Weighing urgency and motivation…",
  "Finding the conflict between what the page says and what it shows…",
];

function useRotatingIndex(length, intervalMs) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  return index;
}

// Simulated, honest progress: decelerates toward a cap it never reaches on
// its own — it can only ever imply "still working," never falsely claim
// 100% before the real response actually lands (see accessibility-and-
// polish.md's "don't fake progress" rule — the cap is what keeps this from
// crossing into lying).
function useSimulatedProgress(cap = 92) {
  const [percent, setPercent] = useState(4);
  useEffect(() => {
    const id = setInterval(() => {
      setPercent((p) => {
        if (p >= cap) return p;
        const remaining = cap - p;
        const step = Math.max(0.4, remaining * 0.06);
        return Math.min(cap, p + step);
      });
    }, 250);
    return () => clearInterval(id);
  }, [cap]);
  return Math.round(percent);
}

export default function LoadingTips() {
  const statusIndex = useRotatingIndex(STATUS_LINES.length, 2200);
  const percent = useSimulatedProgress();

  return (
    <div className="loading-state">
      <div className="loading-panel panel">
        <div className="loading-bar-row">
          <div className="loading-bar">
            <div className="loading-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="loading-percent tabular-nums">{percent}%</span>
        </div>
        <p className="loading-status" key={statusIndex}>
          {STATUS_LINES[statusIndex]}
        </p>
      </div>
    </div>
  );
}
