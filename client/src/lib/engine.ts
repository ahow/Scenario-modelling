// ============================================================
// Bayesian Scenario Probability Engine
// Pure functions — no side effects, fully testable
// ============================================================

import {
  type ScenarioId,
  type SignalId,
  type AssetId,
  SCENARIO_IDS,
  SCENARIOS,
  WEIGHTS,
  MARKET_IMPACT,
  ASSETS,
} from './config';

const FLOOR = 0.002; // 0.2% minimum — no scenario reaches zero

/**
 * Compute posterior probabilities given signal selections.
 * 1. Apply additive weights to base probabilities
 * 2. Floor at 0.2%
 * 3. Normalise to sum to 1.0
 */
export function computeProbs(
  selections: Record<SignalId, string>,
  baseProbs: Record<ScenarioId, number>,
): Record<ScenarioId, number> {
  const raw: Record<string, number> = {};

  for (const sid of SCENARIO_IDS) {
    let score = baseProbs[sid] ?? 0;
    for (const [signalId, optionValue] of Object.entries(selections)) {
      const w = WEIGHTS[signalId]?.[optionValue]?.[sid as ScenarioId];
      if (w) score += w / 100; // weights are in pp units, convert to decimal
    }
    raw[sid] = Math.max(score, FLOOR);
  }

  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const result: Record<string, number> = {};
  for (const sid of SCENARIO_IDS) {
    result[sid] = raw[sid] / total;
  }
  return result as Record<ScenarioId, number>;
}

/**
 * Get base probabilities as a Record
 */
export function getBaseProbs(): Record<ScenarioId, number> {
  return Object.fromEntries(SCENARIOS.map(s => [s.id, s.baseProb])) as Record<ScenarioId, number>;
}

/**
 * Compute probability-weighted expected values for all assets
 */
export function computeWeightedMarket(probs: Record<ScenarioId, number>) {
  const results: Record<AssetId, { lo: number; mid: number; hi: number }> = {} as any;

  for (const asset of ASSETS) {
    let wLo = 0, wMid = 0, wHi = 0;
    for (const sid of SCENARIO_IDS) {
      const impact = MARKET_IMPACT[sid][asset.id];
      const p = probs[sid];
      wLo += p * impact.lo;
      wMid += p * impact.mid;
      wHi += p * impact.hi;
    }
    results[asset.id] = { lo: wLo, mid: wMid, hi: wHi };
  }
  return results;
}

/**
 * Compute per-scenario contribution to each asset's expected value
 */
export function computeScenarioContributions(probs: Record<ScenarioId, number>, assetId: AssetId) {
  return SCENARIO_IDS.map(sid => ({
    scenarioId: sid,
    probability: probs[sid],
    impact: MARKET_IMPACT[sid][assetId],
    contribution: probs[sid] * MARKET_IMPACT[sid][assetId].mid,
  }));
}

/**
 * Count how many signals are set to a definite value (not 'unknown')
 */
export function countDefiniteSignals(selections: Record<SignalId, string>): number {
  return Object.values(selections).filter(v => v !== 'unknown').length;
}

/**
 * Compute sensitivity: for each signal, measure the max probability swing
 * it can cause from the current state. Returns signals ranked by impact.
 */
export function computeSensitivity(
  currentSelections: Record<SignalId, string>,
  baseProbs: Record<ScenarioId, number>,
) {
  const currentProbs = computeProbs(currentSelections, baseProbs);
  const results: Array<{
    signalId: SignalId;
    maxSwing: number;
    mostAffectedScenario: ScenarioId;
    bestOption: string;
    worstOption: string;
  }> = [];

  for (const [signalId, signalWeights] of Object.entries(WEIGHTS)) {
    let maxSwing = 0;
    let mostAffected: ScenarioId = 'deal';
    let bestOpt = 'unknown';
    let worstOpt = 'unknown';

    const options = Object.keys(signalWeights);
    for (const sid of SCENARIO_IDS) {
      let minProb = Infinity, maxProb = -Infinity;
      let minOpt = '', maxOpt = '';

      for (const opt of options) {
        const testSelections = { ...currentSelections, [signalId]: opt };
        const testProbs = computeProbs(testSelections, baseProbs);
        if (testProbs[sid] < minProb) { minProb = testProbs[sid]; minOpt = opt; }
        if (testProbs[sid] > maxProb) { maxProb = testProbs[sid]; maxOpt = opt; }
      }

      const swing = maxProb - minProb;
      if (swing > maxSwing) {
        maxSwing = swing;
        mostAffected = sid;
        bestOpt = maxOpt;
        worstOpt = minOpt;
      }
    }

    results.push({
      signalId: signalId as SignalId,
      maxSwing,
      mostAffectedScenario: mostAffected,
      bestOption: bestOpt,
      worstOption: worstOpt,
    });
  }

  return results.sort((a, b) => b.maxSwing - a.maxSwing);
}
