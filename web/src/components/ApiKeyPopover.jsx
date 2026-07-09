import { useEffect, useRef, useState } from "react";

export default function ApiKeyPopover({
  providerConfig,
  apiKey,
  editingKey,
  setEditingKey,
  apiKeyDraft,
  setApiKeyDraft,
  saveApiKey,
  clearApiKey,
  cancelEditingKey,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        cancelEditingKey();
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        cancelEditingKey();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="api-key-popover-root" ref={rootRef}>
      <button
        type="button"
        className={`api-key-trigger ${apiKey ? "api-key-trigger--set" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`api-key-trigger-dot ${apiKey ? "api-key-trigger-dot--set" : ""}`} />
        {apiKey ? `${providerConfig.label} key added` : "API key"}
      </button>

      {open && (
        <div className="api-key-popover panel">
          {editingKey ? (
            <form
              className="api-key-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveApiKey();
                setOpen(false);
              }}
            >
              <label className="sr-only" htmlFor="api-key-draft">
                {providerConfig.label} API key
              </label>
              <input
                id="api-key-draft"
                className="api-key-input"
                type="password"
                autoComplete="off"
                placeholder={providerConfig.keyPlaceholder}
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                autoFocus
                spellCheck={false}
              />
              <div className="api-key-form-actions">
                <button className="api-key-save" type="submit">
                  Save
                </button>
                <button
                  className="api-key-cancel"
                  type="button"
                  onClick={() => {
                    cancelEditingKey();
                    setOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : apiKey ? (
            <div className="api-key-popover-body">
              <p>{providerConfig.label} API key is saved in your browser only — it never touches our server.</p>
              <div className="api-key-popover-actions">
                <button className="api-key-link" type="button" onClick={() => setEditingKey(true)}>
                  Change
                </button>
                <button
                  className="api-key-link"
                  type="button"
                  onClick={() => {
                    clearApiKey();
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="api-key-popover-body">
              <p>
                Add your {providerConfig.label} key from {providerConfig.keyHelp} to run a real teardown, or use
                test mode below to try it free.
              </p>
              <button className="api-key-link" type="button" onClick={() => setEditingKey(true)}>
                Add key
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
