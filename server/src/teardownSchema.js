// Shared criteria definition used by every provider (Anthropic, OpenAI, ...)
// and by scoreAggregation.js — one source of truth for the 5 criteria keys.
export const CRITERIA = [
  {
    key: "messageAndValueProp",
    label: "Message & Value Prop",
    description: "Is the exchange (what you get, why it matters) obvious in 5 seconds?",
  },
  {
    key: "callToAction",
    label: "Call to Action",
    description: "Is there one clear next step, easy to find, easy to take?",
  },
  {
    key: "trustAndCredibility",
    label: "Trust & Credibility",
    description: "Does the page resolve the visitor's doubt?",
  },
  {
    key: "frictionAndClarity",
    label: "Friction & Clarity",
    description: "How much effort or confusion stands between arrival and action?",
  },
  {
    key: "urgencyAndMotivation",
    label: "Urgency & Motivation",
    description: "Is there a real reason to act now rather than later?",
  },
];

export const CRITERIA_KEYS = CRITERIA.map((c) => c.key);
