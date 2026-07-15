import { useRef, useState, useEffect } from "react";
import { CRITERIA_ORDER, CRITERIA_LABELS, CRITERIA_COLORS } from "../criteriaMeta.js";

function ScoreBar({ percent }) {
  return (
    <div className="score-bar" role="img" aria-label={`${percent}%`}>
      <div className="score-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function RatingPips({ value }) {
  return (
    <span className="rating-pips" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`rating-pip ${i <= value ? "rating-pip--filled" : ""}`} />
      ))}
    </span>
  );
}

export default function TeaserReport({ teardown }) {
  const { criteria } = teardown;
  const firstKey = CRITERIA_ORDER[0];
  const lockedKeys = CRITERIA_ORDER.slice(1);
  const first = criteria[firstKey];

  const scrollRef = useRef(null);
  const [showArrow, setShowArrow] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function check() {
      setShowArrow(el.scrollTop + el.clientHeight < el.scrollHeight - 24);
    }
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, []);

  function scrollDown() {
    scrollRef.current?.scrollBy({ top: 200, behavior: "smooth" });
  }

  return (
    <div className="teaser-report-wrap">
      <div className="teaser-report" ref={scrollRef}>
        {/* First criterion — fully visible */}
        <div
          className="criterion-card criterion-card--teaser panel"
          style={{ "--criterion-color": CRITERIA_COLORS[firstKey] }}
        >
          <header className="criterion-card-head">
            <span className="criterion-card-dot" />
            <span className="criterion-card-title">{CRITERIA_LABELS[firstKey]}</span>
          </header>
          <ScoreBar percent={first.barPercent} />
          <div className="criterion-findings-wrap">
            <ul className="criterion-findings">
              {first.findings.map((f, i) => (
                <li key={i}>
                  <span className="finding-index">{i + 1}</span>
                  <p>{f.text}</p>
                  <RatingPips value={f.rating} />
                </li>
              ))}
            </ul>
          </div>
          <div className="criterion-fix">
            <span className="criterion-fix-label">Change this</span>
            <p>{first.whatToChange}</p>
          </div>
        </div>

        {/* Remaining criteria — name visible, content blurred */}
        {lockedKeys.map((key) => {
          const c = criteria[key];
          return (
            <div
              key={key}
              className="teaser-locked-card panel"
              style={{ "--criterion-color": CRITERIA_COLORS[key] }}
            >
              <header className="criterion-card-head">
                <span className="criterion-card-dot" />
                <span className="criterion-card-title">{CRITERIA_LABELS[key]}</span>
              </header>
              <div className="teaser-locked-blur" aria-hidden="true">
                <ScoreBar percent={c.barPercent} />
                <ul className="criterion-findings">
                  {c.findings.slice(0, 2).map((f, i) => (
                    <li key={i}>
                      <span className="finding-index">{i + 1}</span>
                      <p>{f.text}</p>
                      <RatingPips value={f.rating} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className={`teaser-scroll-arrow ${showArrow ? "" : "teaser-scroll-arrow--hidden"}`}
        onClick={scrollDown}
        aria-label="Scroll for more"
        tabIndex={showArrow ? 0 : -1}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 9l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
