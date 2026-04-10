// ============================================================
// Bayesian Scenario Probability Engine v3
// Supports probability distributions per decision point
// ============================================================

import {
  type ScenarioId,
  type SignalId,
  type AssetId,
  SCENARIO_IDS,
  SCENARIOS,
  SCENARIO_MAP,
  WEIGHTS,
  MARKET_IMPACT,
  ASSETS,
  ASSET_MAP,
  SIGNALS,
  MARKET_COMMENTARY,
} from './config';

const FLOOR = 0.002;

// State shape: each signal is either 'unknown' or a probability distribution over its options
export type SignalState = {
  mode: 'unknown';
} | {
  mode: 'distribution';
  weights: Record<string, number>; // option value → probability (sums to 1)
};

export type AllSignalStates = Record<SignalId, SignalState>;

/**
 * Compute scenario probabilities given probability distributions per signal.
 * For each signal in distribution mode, we compute the expected weight contribution
 * by weighting each option's effect by the user's assigned probability.
 */
export function computeProbsFromDistributions(
  states: AllSignalStates,
  baseProbs: Record<ScenarioId, number>,
): Record<ScenarioId, number> {
  const raw: Record<string, number> = {};

  for (const sid of SCENARIO_IDS) {
    let score = baseProbs[sid] ?? 0;

    for (const [signalId, state] of Object.entries(states)) {
      if (state.mode === 'unknown') continue;

      // Expected weight = sum(p_option * weight_option_scenario)
      for (const [optionValue, optionProb] of Object.entries(state.weights)) {
        const w = WEIGHTS[signalId]?.[optionValue]?.[sid as ScenarioId];
        if (w) score += (optionProb * w) / 100;
      }
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

export function getBaseProbs(): Record<ScenarioId, number> {
  return Object.fromEntries(SCENARIOS.map(s => [s.id, s.baseProb])) as Record<ScenarioId, number>;
}

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

export function countSetSignals(states: AllSignalStates): number {
  return Object.values(states).filter(s => s.mode === 'distribution').length;
}

/**
 * Get the most likely option for each signal that is in distribution mode
 */
export function getMostLikelyOptions(states: AllSignalStates): Record<SignalId, { value: string; prob: number } | null> {
  const result: Record<string, { value: string; prob: number } | null> = {};
  for (const [signalId, state] of Object.entries(states)) {
    if (state.mode === 'unknown') {
      result[signalId] = null;
      continue;
    }
    let maxVal = '';
    let maxProb = 0;
    for (const [val, prob] of Object.entries(state.weights)) {
      if (prob > maxProb) {
        maxVal = val;
        maxProb = prob;
      }
    }
    result[signalId] = { value: maxVal, prob: maxProb };
  }
  return result as Record<SignalId, { value: string; prob: number } | null>;
}

/**
 * Generate narrative text based on the current probability distribution
 */
export function generateNarrative(
  probs: Record<ScenarioId, number>,
  market: Record<AssetId, { lo: number; mid: number; hi: number }>,
  states: AllSignalStates,
): { scenarioNarrative: string; marketNarrative: string; topScenarios: Array<{ id: ScenarioId; prob: number }> } {
  // Sort scenarios by probability
  const sorted = SCENARIO_IDS
    .map(id => ({ id, prob: probs[id] }))
    .sort((a, b) => b.prob - a.prob);

  const top = sorted[0];
  const second = sorted[1];
  const topScenario = SCENARIO_MAP[top.id];
  const secondScenario = SCENARIO_MAP[second.id];

  // Build scenario narrative
  let scenarioNarrative = '';

  const setCount = countSetSignals(states);
  if (setCount === 0) {
    scenarioNarrative = 'Set your probability assessments on the decisions below to generate a scenario narrative. The baseline distribution reflects editorial priors before any signal intelligence is incorporated.';
  } else {
    const topPct = Math.round(top.prob * 100);
    const secondPct = Math.round(second.prob * 100);

    scenarioNarrative = `The most likely outcome is "${topScenario.name}" at ${topPct}% probability. ${topScenario.narrative}`;

    if (secondPct > 15) {
      scenarioNarrative += `\n\nThe second most likely outcome is "${secondScenario.name}" at ${secondPct}%. ${secondScenario.shortDesc}.`;
    }

    // Add tail risk warning if any extreme scenario > 8%
    const dualProb = Math.round(probs.dual * 100);
    const breakoutProb = Math.round(probs.breakout * 100);
    if (dualProb > 8 || breakoutProb > 8) {
      scenarioNarrative += `\n\nTail risk warning: `;
      if (dualProb > 8) scenarioNarrative += `The dual chokepoint crisis carries a ${dualProb}% probability — well above the baseline 6%. `;
      if (breakoutProb > 8) scenarioNarrative += `Nuclear breakout carries a ${breakoutProb}% probability — significantly elevated from the 4% baseline.`;
    }
  }

  // Build market narrative
  let marketNarrative = '';
  if (setCount > 0) {
    const oil = market.oil.mid;
    const sp = market.sp500.mid;
    const gold = market.gold.mid;

    // Oil commentary
    if (oil > 110) {
      marketNarrative += MARKET_COMMENTARY.oil_high({ price: ASSET_MAP.oil.format(oil) });
    } else if (oil < 85) {
      marketNarrative += MARKET_COMMENTARY.oil_low({ price: ASSET_MAP.oil.format(oil) });
    } else {
      marketNarrative += MARKET_COMMENTARY.oil_mid({ price: ASSET_MAP.oil.format(oil) });
    }

    // Equity commentary
    marketNarrative += ' ';
    if (sp < -5) {
      marketNarrative += MARKET_COMMENTARY.equity_bearish({ pct: ASSET_MAP.sp500.format(sp) });
    } else if (sp > 5) {
      marketNarrative += MARKET_COMMENTARY.equity_bullish({ pct: ASSET_MAP.sp500.format(sp) });
    } else {
      marketNarrative += MARKET_COMMENTARY.equity_flat({ pct: ASSET_MAP.sp500.format(sp) });
    }

    // Gold commentary
    marketNarrative += ' ';
    if (gold > 5200) {
      marketNarrative += MARKET_COMMENTARY.gold_high({ price: ASSET_MAP.gold.format(gold) });
    } else {
      marketNarrative += MARKET_COMMENTARY.gold_low({ price: ASSET_MAP.gold.format(gold) });
    }
  }

  return {
    scenarioNarrative,
    marketNarrative,
    topScenarios: sorted.slice(0, 3).map(s => ({ id: s.id as ScenarioId, prob: s.prob })),
  };
}

/**
 * Create default "unknown" states for all signals
 */
export function getDefaultStates(): AllSignalStates {
  return Object.fromEntries(
    SIGNALS.map(s => [s.id, { mode: 'unknown' as const }])
  ) as AllSignalStates;
}

/**
 * Create equal-weight distribution for a signal
 */
export function createEqualDistribution(signalId: SignalId): SignalState {
  const signal = SIGNALS.find(s => s.id === signalId)!;
  const n = signal.options.length;
  const weights: Record<string, number> = {};
  signal.options.forEach(opt => {
    weights[opt.value] = 1 / n;
  });
  return { mode: 'distribution', weights };
}
