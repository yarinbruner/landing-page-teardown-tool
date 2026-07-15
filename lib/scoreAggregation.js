const CRITERIA_KEYS = [
  "messageAndValueProp",
  "callToAction",
  "trustAndCredibility",
  "frictionAndClarity",
  "urgencyAndMotivation",
];

function positiveWeightedMean(values) {
  const sum = values.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;
  const weightedSum = values.reduce((s, v) => s + v * v, 0);
  return weightedSum / sum;
}

export function applyScoring(teardown) {
  const criteria = {};
  const criterionMeans = [];

  for (const key of CRITERIA_KEYS) {
    const c = teardown.criteria?.[key];
    if (!c || !Array.isArray(c.findings) || c.findings.length === 0) {
      throw new Error(`Model response is missing findings for criterion "${key}".`);
    }
    const ratings = c.findings.map((f) => f.rating);
    const mean = positiveWeightedMean(ratings);
    criterionMeans.push(mean);
    const barPercent = Math.round(((mean - 1) / 4) * 100);
    criteria[key] = { ...c, barPercent: Math.max(0, Math.min(100, barPercent)) };
  }

  const overallMean = positiveWeightedMean(criterionMeans);
  const overall = Math.round((1 + (overallMean - 1) * 2.25) * 10) / 10;

  return {
    ...teardown,
    criteria,
    overall: Math.max(1, Math.min(10, overall)),
  };
}
