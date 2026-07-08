// Canned teardown data for UI/design QA that never calls the Anthropic API.
// Deliberately varies finding counts and ratings (some 5s, some 2s) so the
// bar/pip rendering and the positive-weighted aggregation get exercised.
export function buildMockTeardown(pageData) {
  return {
    reasoning: {
      observe: `Mock data — no Claude API call was made for "${pageData.title || pageData.url}".`,
      meclabs: { m: 3, v: 3, i: 2, f: 3, a: 3 },
      foggBrokenVertex: "prompt",
      jtbdGap: "Mock JTBD gap text for layout testing.",
      cialdiniAudit: {
        reciprocity: "absent",
        commitment: "absent",
        socialProof: "present",
        authority: "present",
        liking: "absent",
        scarcity: "misused",
        unity: "absent",
      },
      conflict: "Mock conflict text — placeholder reasoning used to verify the schema without spending API credits.",
    },
    criteria: {
      messageAndValueProp: {
        findings: [
          { text: "Mock: the headline names the category but not the concrete outcome.", rating: 3 },
          { text: "Mock: supporting copy spreads across three offerings instead of one.", rating: 2 },
          {
            text: "Mock: this is a deliberately long mock finding sentence meant to stress-test text wrapping — if this looks cramped or overflows, that's a real layout bug.",
            rating: 4,
          },
        ],
        whatToChange: "Mock: rewrite the headline to state one concrete outcome.",
      },
      callToAction: {
        findings: [
          { text: "Mock: two CTAs are visible above the fold.", rating: 5 },
          { text: "Mock: primary CTA uses a strong action verb.", rating: 5 },
          { text: "Mock: secondary CTA competes visually with the primary.", rating: 2 },
          { text: "Mock: no friction-reducing copy appears near the CTA.", rating: 2 },
          { text: "Mock: tap target size comfortably exceeds 44px.", rating: 5 },
        ],
        whatToChange: "Mock: demote the secondary CTA to a text link.",
      },
      trustAndCredibility: {
        findings: [
          { text: "Mock: no customer logos appear above the fold.", rating: 1 },
          { text: "Mock: testimonials lack attribution detail.", rating: 2 },
          { text: "Mock: no quantified social proof is present.", rating: 2 },
        ],
        whatToChange: "Mock: add one named, quantified customer result near the hero.",
      },
      frictionAndClarity: {
        findings: [
          { text: "Mock: the page is long with many competing sections.", rating: 2 },
          { text: "Mock: no signup form exists, so field-level friction is zero.", rating: 5 },
          { text: "Mock: dozens of links create decision paralysis before the first CTA.", rating: 2 },
          { text: "Mock: this criterion intentionally has four findings to test uneven grid heights.", rating: 3 },
        ],
        whatToChange: "Mock: branch visitors by persona immediately after the hero.",
      },
      urgencyAndMotivation: {
        findings: [
          { text: "Mock: nothing on the page creates urgency to act today.", rating: 2 },
          { text: "Mock: no identity-based framing appears.", rating: 2 },
          { text: "Mock: incentive language is entirely absent.", rating: 1 },
        ],
        whatToChange: "Mock: introduce a concrete, time-bound incentive near the hero CTA.",
      },
    },
    overallVerdict: "Mock overall verdict: this canned response exists purely to test UI/design changes without spending API credits.",
    highestLeverageFix: "Mock highest-leverage fix: placeholder text for layout QA, not a real recommendation.",
  };
}
