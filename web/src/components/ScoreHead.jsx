import { useEffect, useRef, useState } from "react";
import ScoreStamp from "./ScoreStamp.jsx";

function ChevronIcon({ up }) {
  return (
    <svg className={`chevron ${up ? "chevron--up" : ""}`} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// The verdict paragraph is LLM-generated and unbounded, same as findings
// text — rather than shrinking the font to fit every possible length (a
// losing game), it gets a fixed-size box with an arrow that only appears
// when the text actually overflows, paging through it a screenful at a
// time via smooth scroll instead of resizing the box.
export default function ScoreHead({ overall, overallVerdict }) {
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const verdictRef = useRef(null);

  useEffect(() => {
    const el = verdictRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setAtEnd(false);
  }, [overallVerdict]);

  function handleAdvance() {
    const el = verdictRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 1) return;
    if (el.scrollTop >= maxScroll - 1) {
      el.scrollTo({ top: 0, behavior: "smooth" });
      setAtEnd(false);
      return;
    }
    const target = Math.min(el.scrollTop + el.clientHeight, maxScroll);
    el.scrollTo({ top: target, behavior: "smooth" });
    setAtEnd(target >= maxScroll - 1);
  }

  return (
    <div className="score-head panel">
      <div className="score-head-top">
        <ScoreStamp score={overall} max={10} size="lg" />
        <div className="criteria-eyebrow">Teardown summary</div>
      </div>
      <div className="score-head-verdict-wrap">
        <p ref={verdictRef} className="criteria-overall-verdict">
          {overallVerdict}
        </p>
        {overflowing && (
          <button
            type="button"
            className="score-head-verdict-toggle"
            onClick={handleAdvance}
            aria-label={atEnd ? "Back to start of summary" : "Show more of summary"}
          >
            <ChevronIcon up={atEnd} />
          </button>
        )}
      </div>
    </div>
  );
}
