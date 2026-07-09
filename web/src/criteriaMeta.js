export const CRITERIA_LABELS = {
  messageAndValueProp: "Message & Value Prop",
  callToAction: "Call to Action",
  trustAndCredibility: "Trust & Credibility",
  frictionAndClarity: "Friction & Clarity",
  urgencyAndMotivation: "Urgency & Motivation",
};

export const CRITERIA_ORDER = [
  "messageAndValueProp",
  "callToAction",
  "trustAndCredibility",
  "frictionAndClarity",
  "urgencyAndMotivation",
];

// A bold, distinct color per criterion instead of one repeated brand accent
// — each hex verified to clear 4.5:1 (WCAG AA) both as text and as a solid
// fill under white text, against the cream --bg specifically (its lower
// luminance than pure white pushed the friction/urgency shades below 4.5:1,
// so they're darkened slightly from the pre-cream-redesign values). Picked
// for a loose thematic fit (trust = teal/"green light", urgency = red,
// friction = caution-yellow) rather than assigned randomly, so the color
// still reads as systematic.
export const CRITERIA_COLORS = {
  messageAndValueProp: "#7c3aed",
  callToAction: "#2563eb",
  trustAndCredibility: "#0f766e",
  frictionAndClarity: "#8a5a05",
  urgencyAndMotivation: "#b71c1c",
};
