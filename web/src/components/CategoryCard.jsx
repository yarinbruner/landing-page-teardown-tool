import ScoreStamp from "./ScoreStamp.jsx";

export default function CategoryCard({ eyebrow, title, data, checkPinMap = {}, activePin, onPinHover }) {
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="card-eyebrow">{eyebrow}</div>
          <h3 className="card-title">{title}</h3>
        </div>
        <ScoreStamp score={data.score} size="sm" />
      </header>

      <ul className="checklist">
        {data.checks.map((c) => {
          const pinId = checkPinMap[c.id];
          return (
            <li
              key={c.id}
              className={`check check--${c.pass ? "pass" : "fail"} ${activePin === pinId ? "check--active" : ""}`}
              onMouseEnter={() => pinId && onPinHover?.(pinId)}
              onMouseLeave={() => pinId && onPinHover?.(null)}
            >
              <span className="check-mark" aria-hidden="true">
                {c.pass ? "✓" : "✗"}
              </span>
              <div className="check-body">
                <div className="check-label">{c.label}</div>
                <div className="check-detail">{c.detail}</div>
              </div>
              {pinId && <span className="check-pin-ref">{pinId}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
