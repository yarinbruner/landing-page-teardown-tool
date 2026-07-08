export default function ScreenshotPane({ screenshotUrl }) {
  return (
    <div className="shot-frame panel">
      <img src={screenshotUrl} alt="Full-page screenshot of the analyzed landing page" />
    </div>
  );
}
