// ============================================================
// Endogenous Decision Functions
// Reactive actors whose positions are computed from exogenous inputs
// ============================================================

import type { SignalId } from './config';
import type { AllSignalStates } from './engine';

export interface ReactionFunction {
  signalId: SignalId;
  label: string;
  drivers: Array<{
    signalId: SignalId;
    weight: number;     // 0–1, sums to 1
    description: string;
    invert?: boolean;   // true = higher driver → lower endogenous position
  }>;
  // Optional non-linear adjustments
  threshold?: { driverSignal: SignalId; above: number; boost: number };
}

// Which decisions are endogenous (reactive actors)
export const ENDOGENOUS_SIGNALS: SignalId[] = ['china', 'houthi', 'market'];

export const REACTION_FUNCTIONS: ReactionFunction[] = [
  {
    signalId: 'china',
    label: 'Auto-computed: China responds to escalation level',
    drivers: [
      { signalId: 'trump_war', weight: 0.40, description: 'Trump war posture (40%)', invert: false },
      { signalId: 'iran_strait', weight: 0.35, description: 'Strait closure (35%)', invert: false },
      { signalId: 'iran_nuke', weight: 0.25, description: 'Iran nuclear posture (25%)', invert: false },
    ],
    // When Trump war posture is highly escalatory AND Strait is closing,
    // China shifts more aggressively toward active mediation
    threshold: { driverSignal: 'trump_war', above: 70, boost: -10 },
  },
  {
    signalId: 'houthi',
    label: 'Auto-computed: Houthis respond to conflict trajectory',
    drivers: [
      { signalId: 'trump_war', weight: 0.45, description: 'Trump war posture (45%)' },
      { signalId: 'iran_regime', weight: 0.30, description: 'Iran regime stability (30%)', invert: true },
      { signalId: 'iran_strait', weight: 0.25, description: 'Strait closure (25%)' },
    ],
  },
  {
    signalId: 'market',
    label: 'Auto-computed: Markets respond to all decision inputs',
    drivers: [
      { signalId: 'trump_war', weight: 0.25, description: 'Trump war posture (25%)' },
      { signalId: 'iran_strait', weight: 0.25, description: 'Strait closure (25%)' },
      { signalId: 'iran_nuke', weight: 0.15, description: 'Iran nuclear posture (15%)' },
      { signalId: 'israel_leb', weight: 0.15, description: 'Israel Lebanon ops (15%)' },
      { signalId: 'houthi', weight: 0.20, description: 'Houthi posture (20%)' },
    ],
  },
];

const REACTION_MAP = Object.fromEntries(
  REACTION_FUNCTIONS.map(r => [r.signalId, r])
) as Record<SignalId, ReactionFunction>;

/**
 * Compute the endogenous position for a reactive decision.
 * Uses a weighted combination of driver positions with optional
 * non-linear threshold adjustments.
 * 
 * For China: higher escalation from drivers → China moves LEFT (toward "Pressuring Iran" / active mediation)
 * This is because China is a reactive de-escalator — more conflict = more pressure to intervene.
 * 
 * For Houthi: higher escalation → Houthis move RIGHT (toward "Active attacks")
 * 
 * For Market: higher escalation → market moves RIGHT (toward "Premiums spiking")
 */
export function computeEndogenousPosition(
  signalId: SignalId,
  exogenousStates: AllSignalStates,
): number {
  const fn = REACTION_MAP[signalId];
  if (!fn) return 50;

  let weighted = 0;
  for (const driver of fn.drivers) {
    const driverPos = exogenousStates[driver.signalId] ?? 50;
    if (driver.invert) {
      // Inverted: high driver position → low contribution
      weighted += driver.weight * (100 - driverPos);
    } else {
      weighted += driver.weight * driverPos;
    }
  }

  // For China: invert the weighted result — more escalation = lower position (active mediation)
  if (signalId === 'china') {
    weighted = 100 - weighted;
  }

  // Apply threshold boost if present
  if (fn.threshold) {
    const driverVal = exogenousStates[fn.threshold.driverSignal] ?? 50;
    if (driverVal > fn.threshold.above) {
      weighted += fn.threshold.boost;
    }
  }

  return Math.max(5, Math.min(95, Math.round(weighted)));
}

/**
 * Compute all endogenous positions given exogenous states.
 * Runs two passes to handle dependencies (e.g., market depends on houthi).
 */
export function computeAllEndogenous(
  exogenousStates: AllSignalStates,
): Partial<Record<SignalId, number>> {
  const result: Record<string, number> = {};

  // First pass: compute independent endogenous signals (china, houthi)
  for (const signalId of ENDOGENOUS_SIGNALS) {
    if (signalId === 'market') continue; // depends on houthi
    result[signalId] = computeEndogenousPosition(signalId, exogenousStates);
  }

  // Second pass: market depends on houthi's computed position
  const statesWithEndogenous = { ...exogenousStates, ...result };
  result['market'] = computeEndogenousPosition('market', statesWithEndogenous as AllSignalStates);

  return result as Partial<Record<SignalId, number>>;
}

export function isEndogenous(signalId: SignalId): boolean {
  return ENDOGENOUS_SIGNALS.includes(signalId);
}

export function getReactionFunction(signalId: SignalId): ReactionFunction | undefined {
  return REACTION_MAP[signalId];
}
