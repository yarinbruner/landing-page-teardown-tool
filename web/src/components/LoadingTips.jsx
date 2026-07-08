import { useEffect, useState } from "react";

const TIPS = [
  "A single, focused call to action consistently outperforms a page offering visitors multiple competing choices.",
  "Most landing pages only speak to the visitor's functional job — the emotional and social jobs are where the real gap usually is.",
  "Specific social proof (a name, a number, a timeframe) reads as credible; generic praise reads as filler.",
  "Above-the-fold trust signals matter most for first-time visitors who have no other reason yet to believe you.",
  "A visitor decides whether to keep reading in the first few seconds — clarity beats cleverness in a headline.",
  "Removing a form field is one of the highest-leverage, lowest-effort changes you can make to a signup flow.",
  "Real urgency (a genuine deadline or limited supply) converts; manufactured urgency erodes trust once noticed.",
  "A CTA that restates the value ('Start my free trial') outperforms a generic one ('Submit').",
  "Anxiety left unaddressed near the point of action — price, commitment, data privacy — quietly kills conversions.",
  "The page's job isn't to describe the product — it's to convince the visitor their specific job gets done.",
  "Contrast, not just color, is what makes a button noticeable — a bright button on a bright background still hides.",
  "Testimonials that name a result and a timeframe carry more weight than ones that just say the product is great.",
  "A page can be beautifully designed and still convert poorly if the value proposition takes too long to find.",
  "Reciprocity works before the ask — a free resource, sample, or trial earns permission to request something back.",
  "The best single fix on a page is usually the one that unblocks the weakest link, not the one that polishes the strongest.",
  "Visitors arriving from an ad expect the landing page headline to echo the ad's promise — a mismatch causes instant doubt.",
  "Scarcity only works when it's true — a visitor who catches a fake countdown discounts everything else on the page.",
  "A page that shows the product doing the job, not just describing it, resolves more doubt than another paragraph of copy.",
];

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

export default function LoadingTips() {
  const tipIndex = useRotatingIndex(TIPS.length, 4000);
  const statusIndex = useRotatingIndex(STATUS_LINES.length, 2200);

  return (
    <div className="loading-state">
      <div className="loading-panel panel">
        <div className="loading-bar">
          <div className="loading-bar-sweep" />
        </div>
        <p className="loading-status" key={statusIndex}>
          {STATUS_LINES[statusIndex]}
        </p>
      </div>
      <div className="loading-tip" key={tipIndex}>
        <span className="loading-tip-label">CRO tip</span>
        <p>{TIPS[tipIndex]}</p>
      </div>
    </div>
  );
}
