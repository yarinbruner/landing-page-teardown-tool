import { useEffect, useRef, useState } from "react";

function shortLabel(label) {
  return label.replace(/\s*\(.*\)\s*$/, "");
}

export default function ModelPicker({ providers, provider, model, onSelectProvider, onSelectModel }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const providerConfig = providers[provider];
  const modelConfig = providerConfig.models.find((m) => m.value === model) || providerConfig.models[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="model-picker" ref={rootRef}>
      <button type="button" className="model-picker-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="model-picker-provider">{providerConfig.label}</span>
        <span className="model-picker-sep">·</span>
        <span className="model-picker-model">{shortLabel(modelConfig.label)}</span>
        <svg className="model-picker-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="model-picker-popover panel">
          <div className="model-picker-providers">
            {Object.entries(providers).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                className={`model-picker-provider-tab ${provider === key ? "model-picker-provider-tab--active" : ""}`}
                onClick={() => onSelectProvider(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <div className="model-picker-models">
            {providerConfig.models.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`model-picker-option ${m.value === model ? "model-picker-option--active" : ""}`}
                onClick={() => {
                  onSelectModel(m.value);
                  setOpen(false);
                }}
              >
                <span className="model-picker-option-dot" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
