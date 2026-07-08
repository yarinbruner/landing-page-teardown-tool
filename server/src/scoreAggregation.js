const CRITERIA_KEYS = [
  "messageAndValueProp",
  "callToAction",
  "trustAndCredibility",
  "frictionAndClarity",
  "urgencyAndMotivation",
];

// Weights each value by itself, so stronger findings pull the mean up more
// than weak findings pull it down — e.g. [5,5,5,4,2] averages to 4.2 but
// weighs to ~4.52. This is the "favor the positives, not a plain average"
// rule applied identically at both the finding->criterion and
// criterion->overall aggregation steps.
function positiveWeightedMean(values) {
  const sum = values.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;
  const weightedSum = values.reduce((s, v) => s + v * v, 0);
  return weightedSum / sum;
}

// Applied to a Claude/mock teardown that only carries 1-5 per-finding
// ratings — computes the per-criterion bar percentage and the 1-10 overall
// score deterministically, so the model never has to self-report (and keep
// consistent) a holistic numeric score.
export function applyScoring(teardown) {
  const criteria = {};
  const criterionMeans = [];

  for (const key of CRITERIA_KEYS) {
    const c = teardown.criteria[key];
    const ratings = c.findings.map((f) => f.rating);
    const mean = positiveWeightedMean(ratings); // 1-5
    criterionMeans.push(mean);
    const barPercent = Math.round(((mean - 1) / 4) * 100);
    criteria[key] = { ...c, barPercent: Math.max(0, Math.min(100, barPercent)) };
  }

  const overallMean = positiveWeightedMean(criterionMeans); // 1-5
  const overall = Math.round((1 + (overallMean - 1) * 2.25) * 10) / 10; // rescaled to 1-10, one decimal

  return {
    ...teardown,
    criteria,
    overall: Math.max(1, Math.min(10, overall)),
  };
}
