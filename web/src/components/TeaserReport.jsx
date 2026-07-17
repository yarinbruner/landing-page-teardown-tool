import { useRef, useState, useEffect } from "react";
import { CRITERIA_ORDER, CRITERIA_LABELS } from "../criteriaMeta.js";
import EmailGate from "./EmailGate.jsx";

export default function TeaserReport({ teardown, url, title, onConfirmed }) {
  const { criteria } = teardown;
  const firstKey = CRITERIA_ORDER[0];
  const lockedKeys = CRITERIA_ORDER.slice(1);
  const first = criteria[firstKey];
  const teaserRef = useRef(null);
  const [showTeaserArrow, setShowTeaserArrow] = useState(true);

  useEffect(() => {
    const el = teaserRef.current;
    if (!el) return;
    setShowTeaserArrow(el.scrollHeight > el.clientHeight + 24);
  }, []);

  return (
    <div>
      {/* First criterion — fully visible */}
      <div className="lpt-criterion-first">
        <div className="lpt-criterion-head">
          <span className="lpt-criterion-num">01</span>
          <span className="lpt-criterion-title">{CRITERIA_LABELS[firstKey]}</span>
        </div>
        <div className="lpt-score-bar">
          <div className="lpt-score-bar-fill" style={{ width: `${first.barPercent}%` }} />
        </div>
        <ul className="lpt-findings">
          {first.findings.map((f, i) => (
            <li key={i}>
              <span className="lpt-finding-index">{i + 1}.</span>
              <p className="lpt-finding-text">{f.text}</p>
              <span className="lpt-finding-pips">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="lpt-finding-pip"
                    style={{ background: n <= f.rating ? "var(--ink)" : "var(--surface-2)" }}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="lpt-what-to-change">
          <span className="lpt-what-arrow">→</span>
          {first.whatToChange}
        </p>
      </div>

      {/* Locked criteria (blurred) + email gate card overlay */}
      <div className="lpt-teaser">
        <div
          ref={teaserRef}
          className="lpt-teaser-scroll"
          onScroll={(e) => {
            const el = e.target;
            setShowTeaserArrow(el.scrollTop + el.clientHeight < el.scrollHeight - 24);
          }}
          aria-hidden="true"
        >
          {lockedKeys.map((key, idx) => {
            const c = criteria[key];
            return (
              <div key={key} className="lpt-locked-criterion">
                <div className="lpt-criterion-head">
                  <span className="lpt-criterion-num">{String(idx + 2).padStart(2, "0")}</span>
                  <span className="lpt-criterion-title">{CRITERIA_LABELS[key]}</span>
                </div>
                <div className="lpt-score-bar">
                  <div className="lpt-score-bar-fill" style={{ width: `${c.barPercent}%` }} />
                </div>
                <ul className="lpt-findings">
                  {c.findings.slice(0, 2).map((f, i) => (
                    <li key={i}>
                      <span className="lpt-finding-index">{i + 1}.</span>
                      <p className="lpt-finding-text">{f.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="lpt-gate-card card">
          <EmailGate url={url} title={title} teardown={teardown} onConfirmed={onConfirmed} />
        </div>
      </div>
    </div>
  );
}
