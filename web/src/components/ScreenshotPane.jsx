export default function ScreenshotPane({ screenshotUrl, viewportWidth, pageHeight, pins, activePin, onPinHover }) {
  return (
    <div className="shot-frame">
      <div className="shot-inner">
        <img src={screenshotUrl} alt="Full-page screenshot of the analyzed landing page" />
        {pins.map((pin) => {
          const left = Math.min(100, Math.max(0, (pin.rect.x / viewportWidth) * 100));
          const top = Math.min(100, Math.max(0, (pin.rect.y / pageHeight) * 100));
          return (
            <button
              key={pin.id}
              type="button"
              className={`pin pin--${pin.tone} ${activePin === pin.id ? "pin--active" : ""}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              onMouseEnter={() => onPinHover?.(pin.id)}
              onMouseLeave={() => onPinHover?.(null)}
              title={pin.label}
            >
              {pin.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
