// ============================================================
// Bayesian Scenario Probability Engine v4
// Bipolar spectrum slider model — each decision is a single 0–100 slider
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

// State: slider position 0–100 for each signal. 50 = centre/neutral.
export type AllSignalStates = Record<SignalId, number>;

/**
 * Convert a slider position (0–100) into interpolated weights for the weight matrix.
 *
 * For 2-anchor signals (e.g. [left, right]):
 *   pos=0 → 100% left, pos=100 → 100% right, pos=50 → 50/50 blend
 *
 * For 3-anchor signals (e.g. [left, center, right]):
 *   pos=0   → 100% left
 *   pos=50  → 100% center
 *   pos=100 → 100% right
 *   Intermediate positions interpolate linearly between adjacent anchors.
 */
function sliderToOptionWeights(
  position: number,
  anchors: string[],
): Record<string, number> {
  const p = Math.max(0, Math.min(100, position));
  const weights: Record<string, number> = {};

  if (anchors.length === 2) {
    const t = p / 100;
    weights[anchors[0]] = 1 - t;
    weights[anchors[1]] = t;
  } else if (anchors.length === 3) {
    if (p <= 50) {
      const t = p / 50; // 0→0, 50→1
      weights[anchors[0]] = 1 - t;
      weights[anchors[1]] = t;
      weights[anchors[2]] = 0;
    } else {
      const t = (p - 50) / 50; // 50→0, 100→1
      weights[anchors[0]] = 0;
      weights[anchors[1]] = 1 - t;
      weights[anchors[2]] = t;
    }
  }

  return weights;
}

/**
 * Compute scenario probabilities from slider positions.
 * Each slider position is converted to interpolated option weights,
 * then those weights are applied to the weight matrix as expected values.
 */
export function computeProbsFromSliders(
  states: AllSignalStates,
  baseProbs: Record<ScenarioId, number>,
): Record<ScenarioId, number> {
  const raw: Record<string, number> = {};

  for (const sid of SCENARIO_IDS) {
    let score = baseProbs[sid] ?? 0;

    for (const signal of SIGNALS) {
      const position = states[signal.id];
      const optionWeights = sliderToOptionWeights(position, signal.anchors);

      for (const [optionValue, optionWeight] of Object.entries(optionWeights)) {
        const w = WEIGHTS[signal.id]?.[optionValue]?.[sid as ScenarioId];
        if (w) score += (optionWeight * w) / 100;
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

/**
 * Count how many signals have been moved from the default centre (50).
 */
export function countMovedSignals(states: AllSignalStates): number {
  return Object.values(states).filter(v => v !== 50).length;
}

/** Check if any slider has been set (i.e. not all at neutral 50) */
export function hasAnyInput(states: AllSignalStates): boolean {
  return Object.values(states).some(v => v !== 50);
}

/** Convert expected (% from baseline) to expected (% from current) */
function pctFromCurrent(expectedFromBaseline: number, currentFromBaseline: number): number {
  return ((1 + expectedFromBaseline / 100) / (1 + currentFromBaseline / 100) - 1) * 100;
}

const fmtPctNarr = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

/**
 * Generate narrative text based on the current probability distribution.
 * currentFromBaseline: live market levels as % from baseline (used to express expected values relative to current).
 */
export function generateNarrative(
  probs: Record<ScenarioId, number>,
  market: Record<AssetId, { lo: number; mid: number; hi: number }>,
  states: AllSignalStates,
  currentFromBaseline?: Record<AssetId, number>,
): { scenarioNarrative: string; marketNarrative: string; topScenarios: Array<{ id: ScenarioId; prob: number }> } {
  const sorted = SCENARIO_IDS
    .map(id => ({ id, prob: probs[id] }))
    .sort((a, b) => b.prob - a.prob);

  const top = sorted[0];
  const second = sorted[1];
  const topScenario = SCENARIO_MAP[top.id];
  const secondScenario = SCENARIO_MAP[second.id];

  let scenarioNarrative = '';

  const movedCount = countMovedSignals(states);
  if (movedCount === 0) {
    scenarioNarrative = 'All decisions are at neutral positions. Adjust the sliders below to explore how different decision paths change the scenario outlook. Drag left or right to shift probabilities toward each pole.';
  } else {
    const topPct = Math.round(top.prob * 100);
    const secondPct = Math.round(second.prob * 100);

    scenarioNarrative = `The most likely outcome is "${topScenario.name}" at ${topPct}% probability. ${topScenario.narrative}`;

    if (secondPct > 15) {
      scenarioNarrative += ` The second most likely outcome is "${secondScenario.name}" at ${secondPct}%. ${secondScenario.shortDesc}.`;
    }

    const dualProb = Math.round(probs.dual * 100);
    const breakoutProb = Math.round(probs.breakout * 100);
    if (dualProb > 8 || breakoutProb > 8) {
      scenarioNarrative += ` Tail risk warning: `;
      if (dualProb > 8) scenarioNarrative += `The dual chokepoint crisis carries a ${dualProb}% probability — well above the baseline 6%. `;
      if (breakoutProb > 8) scenarioNarrative += `Nuclear breakout carries a ${breakoutProb}% probability — significantly elevated from the 4% baseline.`;
    }
  }

  let marketNarrative = '';
  if (movedCount > 0) {
    const oil = market.brent.mid;   // % from baseline
    const dm = market.dm_eq.mid;    // % from baseline
    const gold = market.gold.mid;   // % from baseline

    // Compute from-current values for display
    const oilFromCurr = currentFromBaseline ? pctFromCurrent(oil, currentFromBaseline.brent) : oil;
    const dmFromCurr = currentFromBaseline ? pctFromCurrent(dm, currentFromBaseline.dm_eq) : dm;
    const goldFromCurr = currentFromBaseline ? pctFromCurrent(gold, currentFromBaseline.gold) : gold;

    // Thresholds still use baseline-scale (model calibration), but displayed % is from current
    if (oil > 70) {
      marketNarrative += MARKET_COMMENTARY.oil_high({ pct: fmtPctNarr(oilFromCurr) });
    } else if (oil < 30) {
      marketNarrative += MARKET_COMMENTARY.oil_low({ pct: fmtPctNarr(oilFromCurr) });
    } else {
      marketNarrative += MARKET_COMMENTARY.oil_mid({ pct: fmtPctNarr(oilFromCurr) });
    }

    marketNarrative += ' ';
    if (dm < -5) {
      marketNarrative += MARKET_COMMENTARY.equity_bearish({ pct: fmtPctNarr(dmFromCurr) });
    } else if (dm > 5) {
      marketNarrative += MARKET_COMMENTARY.equity_bullish({ pct: fmtPctNarr(dmFromCurr) });
    } else {
      marketNarrative += MARKET_COMMENTARY.equity_flat({ pct: fmtPctNarr(dmFromCurr) });
    }

    marketNarrative += ' ';
    if (gold > 15) {
      marketNarrative += MARKET_COMMENTARY.gold_high({ pct: fmtPctNarr(goldFromCurr) });
    } else {
      marketNarrative += MARKET_COMMENTARY.gold_low({ pct: fmtPctNarr(goldFromCurr) });
    }
  }

  return {
    scenarioNarrative,
    marketNarrative,
    topScenarios: sorted.slice(0, 3).map(s => ({ id: s.id as ScenarioId, prob: s.prob })),
  };
}

/**
 * Create default states — all sliders at centre (50).
 * Used as the neutral baseline for comparison.
 */
export function getDefaultStates(): AllSignalStates {
  return Object.fromEntries(
    SIGNALS.map(s => [s.id, 50])
  ) as AllSignalStates;
}

/**
 * Create initial states from briefing estimates.
 * Falls back to 50 for any signal without a briefing position.
 */
export function getBriefingDefaultStates(
  briefingAnchors: Partial<Record<SignalId, number>>,
): AllSignalStates {
  return Object.fromEntries(
    SIGNALS.map(s => [s.id, briefingAnchors[s.id] ?? 50])
  ) as AllSignalStates;
}

/**
 * Compute the weight contribution of a specific signal at a given slider position
 * for each scenario. Used by the model documentation panel.
 */
export function getSignalContribution(
  signalId: SignalId,
  position: number,
): Record<ScenarioId, number> {
  const signal = SIGNALS.find(s => s.id === signalId)!;
  const optionWeights = sliderToOptionWeights(position, signal.anchors);
  const result: Record<string, number> = {};

  for (const sid of SCENARIO_IDS) {
    let contribution = 0;
    for (const [optionValue, optionWeight] of Object.entries(optionWeights)) {
      const w = WEIGHTS[signalId]?.[optionValue]?.[sid as ScenarioId];
      if (w) contribution += optionWeight * w;
    }
    result[sid] = contribution;
  }

  return result as Record<ScenarioId, number>;
}
