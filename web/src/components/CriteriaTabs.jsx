import { CRITERIA_COLORS, CRITERIA_LABELS, CRITERIA_ORDER } from "../criteriaMeta.js";

export default function CriteriaTabs({ activeKey, onChange }) {
  return (
    <div className="criteria-tabs" role="tablist">
      {CRITERIA_ORDER.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={key === activeKey}
          aria-label={CRITERIA_LABELS[key]}
          title={CRITERIA_LABELS[key]}
          className={`criteria-tab ${key === activeKey ? "criteria-tab--active" : ""}`}
          style={{ "--tab-color": CRITERIA_COLORS[key] }}
          onClick={() => onChange(key)}
        >
          <span className="criteria-tab-dot" />
        </button>
      ))}
    </div>
  );
}
