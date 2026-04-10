// ============================================================
// Iran Conflict Scenario Engine — Configuration v4
// Bipolar spectrum slider model
// ============================================================

// --- SCENARIO DEFINITIONS ---
export type ScenarioId = 'deal' | 'frozen' | 'resumed' | 'hormuz' | 'dual' | 'trump_exit' | 'collapse' | 'breakout';

export interface Scenario {
  id: ScenarioId;
  name: string;
  shortDesc: string;
  baseProb: number;
  color: string;
  narrative: string;
}

export const SCENARIOS: Scenario[] = [
  { id: 'deal',       name: 'Durable diplomatic deal',           shortDesc: 'Full Hormuz reopening + nuclear agreement',         baseProb: 0.11, color: '#1D9E75', narrative: 'A comprehensive deal is reached. Iran agrees to verifiable nuclear limits in exchange for phased sanctions relief. The Strait of Hormuz reopens fully, shipping normalises within weeks, and Brent crude drops sharply as the risk premium evaporates. Equities rally on the removal of tail risk.' },
  { id: 'frozen',     name: 'Frozen conflict — no deal',         shortDesc: 'Ceasefire holds; no comprehensive settlement',      baseProb: 0.28, color: '#3266AD', narrative: 'The ceasefire holds but neither side moves toward a comprehensive settlement. Hormuz remains partially restricted. Oil prices settle into an elevated range, equities drift modestly higher as the worst-case fades, and investors price in a prolonged stalemate.' },
  { id: 'resumed',    name: 'Ceasefire collapses — limited war', shortDesc: 'Lebanon exclusion triggers Hormuz re-closure',      baseProb: 0.22, color: '#E9AB2E', narrative: 'The ceasefire breaks down, likely triggered by Israel\'s exclusion of Lebanon from the deal. Iran re-closes the Strait of Hormuz. Oil spikes above $120/bbl as supply disruptions cascade through refinery markets. Equities sell off sharply and treasury yields whipsaw.' },
  { id: 'hormuz',     name: 'Prolonged Hormuz chokepoint',       shortDesc: '6–12 month partial/full Strait disruption',         baseProb: 0.16, color: '#D85A30', narrative: 'Iran maintains a prolonged closure or managed toll system on the Strait. The disruption persists for 6–12 months. Oil sustains above $110/bbl, global growth estimates are revised down, and central banks face a stagflationary dilemma. The dollar strengthens as a safe-haven bid.' },
  { id: 'dual',       name: 'Dual chokepoint crisis',            shortDesc: 'Houthis resume Red Sea attacks + Hormuz closure',  baseProb: 0.06, color: '#A32D2D', narrative: 'The worst supply-chain scenario materialises: Hormuz remains closed while Houthis resume active Red Sea attacks. Global shipping faces simultaneous disruption at two critical chokepoints. Oil surges past $150/bbl, equities enter a bear market, and gold spikes as a systemic hedge.' },
  { id: 'trump_exit', name: 'Trump declares victory / exits',    shortDesc: 'US draws down unilaterally; no deal; Iran rebuilds',baseProb: 0.13, color: '#888780', narrative: 'Trump declares a political victory and draws down US engagement without a comprehensive deal. Iran quietly rebuilds its capabilities. Oil eases as immediate conflict risk falls, equities recover modestly, but the medium-term overhang of unresolved nuclear ambiguity caps the rally.' },
  { id: 'collapse',   name: 'Iranian regime fractures',          shortDesc: 'Internal collapse; nuclear material uncertainty',   baseProb: 0.06, color: '#534AB7', narrative: 'Internal fractures within the regime — whether from popular unrest or IRGC splits — lead to a loss of centralised control. The immediate energy disruption eases as military posture fragments, but nuclear material security becomes a global concern. Markets rally on lower oil but hedging demand for gold rises.' },
  { id: 'breakout',   name: 'Nuclear breakout',                  shortDesc: 'Iran weaponises under IAEA blackout',              baseProb: 0.04, color: '#791F1F', narrative: 'Iran achieves nuclear weapons capability under an IAEA monitoring blackout. This triggers a severe geopolitical re-rating: Saudi Arabia accelerates its own programme, Israel considers pre-emptive action, and the US faces a strategic crisis. Equities sell off violently, gold surges past $6,000, and oil spikes on fears of regional escalation.' },
];

export const SCENARIO_MAP = Object.fromEntries(SCENARIOS.map(s => [s.id, s])) as Record<ScenarioId, Scenario>;
export const SCENARIO_IDS = SCENARIOS.map(s => s.id);

// --- SPECTRUM SIGNAL DEFINITIONS ---
export type SignalId = 'trump_war' | 'trump_leb' | 'iran_nuke' | 'iran_strait' | 'iran_regime' | 'israel_leb' | 'china' | 'houthi' | 'market';

/**
 * Each signal is now a bipolar spectrum with a single slider (0–100).
 * - `leftLabel` / `rightLabel`: the two poles
 * - `centerLabel`: optional label for the midpoint (3-option signals)
 * - `anchors`: the original option values at each anchor point
 *   For 2-option signals: [left, right] (slider 0→left, 100→right)
 *   For 3-option signals: [left, center, right] (slider 0→left, 50→center, 100→right)
 * - Engine interpolates weights between adjacent anchors based on slider position.
 */
export interface Signal {
  id: SignalId;
  actor: string;
  actorColor: string;
  question: string;
  context: string;
  leftLabel: string;
  rightLabel: string;
  centerLabel?: string;
  anchors: string[]; // 2 or 3 option values from the weight matrix
}

export const SIGNALS: Signal[] = [
  {
    id: 'trump_war',
    actor: 'Trump — White House',
    actorColor: '#3266AD',
    question: 'War termination posture',
    context: 'The single most consequential variable. Trump faces a trilemma: pursue a negotiated settlement (costly in time and concessions), declare victory and withdraw (politically expedient but strategically hollow), or resume strikes to force compliance (risks escalation). His choice shapes whether the conflict ends, freezes, or intensifies.',
    leftLabel: 'Pursuing deal',
    centerLabel: 'Declaring victory / exit',
    rightLabel: 'Resuming strikes',
    anchors: ['ceasefire_deal', 'declare_victory', 'resume_strikes'],
  },
  {
    id: 'trump_leb',
    actor: 'Trump — White House',
    actorColor: '#3266AD',
    question: 'Lebanon ceasefire scope',
    context: 'The Lebanon exclusion is the hinge that could collapse the ceasefire. If Trump pressures Netanyahu to include Lebanon in a broader settlement, it removes the trigger for resumption. If he green-lights continued Israeli operations in southern Lebanon, Iran will likely treat this as a deal-breaker and re-close Hormuz.',
    leftLabel: 'Pressuring Israel',
    rightLabel: 'Green-lighting Israel',
    anchors: ['pressure_israel', 'greenlight_israel'],
  },
  {
    id: 'iran_nuke',
    actor: 'Iran / Mojtaba',
    actorColor: '#D85A30',
    question: 'Nuclear posture',
    context: 'Iran\'s nuclear programme is both a bargaining chip and an existential threat. Engaging with IAEA inspections signals willingness to negotiate. Rejecting inspections preserves ambiguity. Covert weaponisation signals — enrichment beyond 60%, centrifuge cascading at Fordow — represent the most dangerous escalatory path and the one most likely to trigger Israeli pre-emption.',
    leftLabel: 'IAEA transparency',
    centerLabel: 'Rejecting inspections',
    rightLabel: 'Covert weaponisation',
    anchors: ['iaea_talks', 'reject_inspections', 'covert_signals'],
  },
  {
    id: 'iran_strait',
    actor: 'Iran / Mojtaba',
    actorColor: '#D85A30',
    question: 'Strait of Hormuz strategy',
    context: 'Iran\'s leverage over global energy markets runs through the 21-mile-wide Strait of Hormuz. A partial reopening signals de-escalation. The yuan-denominated toll system represents a novel middle path — maintaining leverage while extracting revenue and strengthening the China relationship. Full closure is the maximum-pressure card but risks galvanising a US-led coalition response.',
    leftLabel: 'Reopening Strait',
    centerLabel: 'Yuan toll system',
    rightLabel: 'Full closure',
    anchors: ['partial_open', 'tolls_yuan', 'full_closure'],
  },
  {
    id: 'iran_regime',
    actor: 'Iran / Mojtaba',
    actorColor: '#D85A30',
    question: 'Regime stability',
    context: 'Mojtaba Khamenei\'s succession remains fragile. If he consolidates power, the regime can sustain a prolonged standoff. If the economic pain of war triggers a protest resurgence (as in 2022), the regime faces a two-front crisis. IRGC fracture — the most extreme scenario — would mean loss of centralised control over both the nuclear programme and Strait operations.',
    leftLabel: 'Regime consolidated',
    centerLabel: 'Protest resurgence',
    rightLabel: 'IRGC fracture',
    anchors: ['consolidated', 'protest_resurgence', 'irgc_fracture'],
  },
  {
    id: 'israel_leb',
    actor: 'Netanyahu — Israel',
    actorColor: '#1D9E75',
    question: 'Lebanon operations',
    context: 'Netanyahu\'s approach to southern Lebanon is the key trigger variable for ceasefire collapse. Continuing IDF operations in Lebanon — framed domestically as completing the Hezbollah degradation — directly contradicts Iran\'s ceasefire conditions. Pausing or withdrawing removes the immediate casus belli for resumption.',
    leftLabel: 'Withdrawing / pausing',
    rightLabel: 'Continuing operations',
    anchors: ['pause_leb', 'continuing_ops'],
  },
  {
    id: 'china',
    actor: 'Xi — China',
    actorColor: '#A32D2D',
    question: 'Diplomatic pressure',
    context: 'China is Iran\'s most important economic partner and the largest importer of Gulf crude. If Xi pressures Iran to de-escalate, it significantly constrains Iran\'s options. Passive non-intervention allows the status quo to persist. Backchannel deal-making — negotiating a separate China-Iran energy arrangement — could freeze the conflict while circumventing Western sanctions.',
    leftLabel: 'Pressuring Iran',
    centerLabel: 'Passive / neutral',
    rightLabel: 'Backchannel deal',
    anchors: ['pressuring_iran', 'passive_china', 'backchannel_deal'],
  },
  {
    id: 'houthi',
    actor: 'Houthis',
    actorColor: '#534AB7',
    question: 'Red Sea posture',
    context: 'The Houthi dimension transforms a regional conflict into a global shipping crisis. Restraint keeps the conflict contained to Hormuz. Active Red Sea attacks create the dual-chokepoint scenario that triggers the most extreme market outcomes — simultaneous disruption of the two sea lanes through which ~35% of global seaborne oil transits.',
    leftLabel: 'Restraint',
    centerLabel: 'Preparing attacks',
    rightLabel: 'Active attacks',
    anchors: ['restraint', 'preparing_attacks', 'active_attacks'],
  },
  {
    id: 'market',
    actor: 'Market signal',
    actorColor: '#888780',
    question: 'Insurance / risk premiums',
    context: 'Gulf shipping insurance premiums are a market-priced signal of conflict probability. Falling premiums indicate that underwriters — who have the most direct financial exposure — assess diminishing risk. Spiking premiums reflect real-time intelligence from shipping operators about deteriorating conditions and are often a leading indicator of escalation.',
    leftLabel: 'Premiums falling',
    rightLabel: 'Premiums spiking',
    anchors: ['premiums_falling', 'premiums_spiking'],
  },
];

export const SIGNAL_MAP = Object.fromEntries(SIGNALS.map(s => [s.id, s])) as Record<SignalId, Signal>;

// --- WEIGHT MATRIX (unchanged from v3) ---
// Each signal → option → scenario impact in percentage-point units.
// The engine interpolates between anchor points based on slider position.
type WeightMatrix = Record<string, Record<string, Partial<Record<ScenarioId, number>>>>;

export const WEIGHTS: WeightMatrix = {
  trump_war: {
    ceasefire_deal:  { deal: 2.5, frozen: 1.0, resumed: -1.5, hormuz: -1.0, dual: -1.0, trump_exit: -1.5, collapse: 0, breakout: -0.5 },
    declare_victory: { deal: -2.0, frozen: -0.5, resumed: -1.0, hormuz: -0.5, dual: -0.5, trump_exit: 4.0, collapse: 0, breakout: 0.5 },
    resume_strikes:  { deal: -3.0, frozen: -1.5, resumed: 2.5, hormuz: 1.0, dual: 0.5, trump_exit: -2.0, collapse: 1.5, breakout: 1.0 },
  },
  trump_leb: {
    pressure_israel:  { deal: 1.5, frozen: 1.0, resumed: -2.0, hormuz: -0.5, dual: -1.0, trump_exit: 0, collapse: 0, breakout: 0 },
    greenlight_israel: { deal: -2.5, frozen: -0.5, resumed: 3.0, hormuz: 0.5, dual: 1.5, trump_exit: 0, collapse: 0, breakout: 0 },
  },
  iran_nuke: {
    iaea_talks:         { deal: 2.0, frozen: 0.5, resumed: 0, hormuz: 0, dual: 0, trump_exit: 0, collapse: 0, breakout: -3.0 },
    reject_inspections: { deal: -2.0, frozen: 0, resumed: 0.5, hormuz: 0, dual: 0, trump_exit: 0, collapse: 0, breakout: 1.5 },
    covert_signals:     { deal: -3.5, frozen: -1.0, resumed: 1.0, hormuz: 0, dual: 0, trump_exit: -0.5, collapse: 1.0, breakout: 4.0 },
  },
  iran_strait: {
    partial_open: { deal: 1.0, frozen: 1.5, resumed: -1.0, hormuz: -2.5, dual: -2.0, trump_exit: 0.5, collapse: 0, breakout: 0 },
    tolls_yuan:   { deal: -2.0, frozen: 1.0, resumed: 0.5, hormuz: 3.5, dual: 0.5, trump_exit: 0, collapse: 0, breakout: 0 },
    full_closure: { deal: -3.0, frozen: -1.0, resumed: 2.0, hormuz: 2.0, dual: 2.0, trump_exit: -1.0, collapse: 0, breakout: 0 },
  },
  iran_regime: {
    consolidated:       { deal: 0, frozen: 1.5, resumed: 0.5, hormuz: 0.5, dual: 0, trump_exit: 0, collapse: -3.0, breakout: -0.5 },
    protest_resurgence: { deal: 0.5, frozen: -1.0, resumed: 0, hormuz: -0.5, dual: -0.5, trump_exit: 0.5, collapse: 3.5, breakout: -0.5 },
    irgc_fracture:      { deal: -1.0, frozen: -1.5, resumed: -0.5, hormuz: -0.5, dual: 0, trump_exit: 0, collapse: 4.0, breakout: 1.5 },
  },
  israel_leb: {
    pause_leb:      { deal: 2.0, frozen: 1.0, resumed: -2.5, hormuz: -0.5, dual: -1.0, trump_exit: 0, collapse: 0, breakout: 0 },
    continuing_ops: { deal: -2.5, frozen: -0.5, resumed: 3.0, hormuz: 0.5, dual: 1.0, trump_exit: -0.5, collapse: 0, breakout: 0 },
  },
  china: {
    pressuring_iran:  { deal: 1.5, frozen: 1.0, resumed: -0.5, hormuz: -2.0, dual: -1.5, trump_exit: 0, collapse: 0, breakout: -0.5 },
    passive_china:    { deal: 0, frozen: 0, resumed: 0, hormuz: 1.5, dual: 0, trump_exit: 0, collapse: 0, breakout: 0 },
    backchannel_deal: { deal: -1.5, frozen: 2.0, resumed: 0, hormuz: 1.5, dual: 0, trump_exit: 0, collapse: 0, breakout: 0 },
  },
  houthi: {
    restraint:          { deal: 0.5, frozen: 1.0, resumed: 0, hormuz: 0, dual: -4.0, trump_exit: 0, collapse: 0, breakout: 0 },
    preparing_attacks:  { deal: -1.0, frozen: -0.5, resumed: 0.5, hormuz: 1.0, dual: 3.0, trump_exit: -0.5, collapse: 0, breakout: 0 },
    active_attacks:     { deal: -3.0, frozen: -2.0, resumed: 1.0, hormuz: 2.0, dual: 5.0, trump_exit: -1.0, collapse: 0, breakout: 0 },
  },
  market: {
    premiums_falling: { deal: 1.0, frozen: 1.5, resumed: -1.0, hormuz: -2.0, dual: -2.0, trump_exit: 0.5, collapse: 0, breakout: 0 },
    premiums_spiking: { deal: -1.5, frozen: -0.5, resumed: 1.5, hormuz: 2.5, dual: 1.5, trump_exit: -1.0, collapse: 0, breakout: 0 },
  },
};

// --- MARKET IMPACT DATA ---
export type AssetId = 'oil' | 'sp500' | 'treasury' | 'dxy' | 'gold';

export interface AssetRange {
  lo: number;
  mid: number;
  hi: number;
  direction: string;
}

export interface AssetDef {
  id: AssetId;
  name: string;
  unit: string;
  currentValue: number;
  format: (v: number) => string;
  formatShort: (v: number) => string;
}

export const ASSETS: AssetDef[] = [
  { id: 'oil',      name: 'Brent Crude',       unit: '$/bbl',  currentValue: 97,    format: (v) => `$${v.toFixed(0)}/bbl`,  formatShort: (v) => `$${v.toFixed(0)}` },
  { id: 'sp500',    name: 'S&P 500',           unit: '%',       currentValue: 6783,  format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`, formatShort: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
  { id: 'treasury', name: '10Y Treasury',      unit: '%',       currentValue: 4.28,  format: (v) => `${v.toFixed(2)}%`,      formatShort: (v) => `${v.toFixed(2)}%` },
  { id: 'dxy',      name: 'USD Index (DXY)',   unit: 'pts',     currentValue: 99,    format: (v) => v.toFixed(1),            formatShort: (v) => v.toFixed(0) },
  { id: 'gold',     name: 'Gold',              unit: '$/oz',    currentValue: 4750,  format: (v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, formatShort: (v) => `$${(v/1000).toFixed(1)}k` },
];

export const ASSET_MAP = Object.fromEntries(ASSETS.map(a => [a.id, a])) as Record<AssetId, AssetDef>;

export const MARKET_IMPACT: Record<ScenarioId, Record<AssetId, AssetRange>> = {
  deal:       { oil: { lo: 65, mid: 72, hi: 80, direction: 'Strongly bearish' }, sp500: { lo: 8, mid: 11, hi: 14, direction: 'Bullish' }, treasury: { lo: 3.90, mid: 4.05, hi: 4.20, direction: 'Lower yields' }, dxy: { lo: 94, mid: 96, hi: 98, direction: 'Weakens' }, gold: { lo: 4200, mid: 4350, hi: 4550, direction: 'Bearish' } },
  frozen:     { oil: { lo: 80, mid: 90, hi: 97, direction: 'Bearish vs. peak' }, sp500: { lo: 2, mid: 4, hi: 7, direction: 'Modestly bullish' }, treasury: { lo: 4.15, mid: 4.28, hi: 4.45, direction: 'Range-bound' }, dxy: { lo: 97, mid: 99, hi: 101, direction: 'Stable' }, gold: { lo: 4600, mid: 4750, hi: 4950, direction: 'Stable' } },
  resumed:    { oil: { lo: 110, mid: 120, hi: 130, direction: 'Bullish' }, sp500: { lo: -12, mid: -8, hi: -5, direction: 'Bearish' }, treasury: { lo: 3.90, mid: 4.20, hi: 4.55, direction: 'Mixed' }, dxy: { lo: 100, mid: 102, hi: 104, direction: 'Strengthens' }, gold: { lo: 5000, mid: 5150, hi: 5400, direction: 'Bullish' } },
  hormuz:     { oil: { lo: 105, mid: 115, hi: 125, direction: 'Strongly bullish' }, sp500: { lo: -18, mid: -13, hi: -8, direction: 'Strongly bearish' }, treasury: { lo: 3.80, mid: 4.35, hi: 4.80, direction: 'Mixed' }, dxy: { lo: 102, mid: 105, hi: 108, direction: 'Strongly strengthens' }, gold: { lo: 5200, mid: 5500, hi: 5900, direction: 'Strongly bullish' } },
  dual:       { oil: { lo: 150, mid: 165, hi: 180, direction: 'Extreme bullish' }, sp500: { lo: -30, mid: -23, hi: -16, direction: 'Extreme bearish' }, treasury: { lo: 3.50, mid: 4.00, hi: 5.00, direction: 'Extreme mixed' }, dxy: { lo: 105, mid: 108, hi: 112, direction: 'Extreme strengthening' }, gold: { lo: 5800, mid: 6400, hi: 7000, direction: 'Extreme bullish' } },
  trump_exit: { oil: { lo: 70, mid: 77, hi: 85, direction: 'Bearish' }, sp500: { lo: 4, mid: 7, hi: 10, direction: 'Bullish' }, treasury: { lo: 4.00, mid: 4.15, hi: 4.30, direction: 'Modestly lower' }, dxy: { lo: 95, mid: 97, hi: 99, direction: 'Weakens' }, gold: { lo: 4300, mid: 4500, hi: 4700, direction: 'Modestly bearish' } },
  collapse:   { oil: { lo: 60, mid: 70, hi: 80, direction: 'Strongly bearish' }, sp500: { lo: 3, mid: 7, hi: 12, direction: 'Bullish' }, treasury: { lo: 4.00, mid: 4.30, hi: 4.60, direction: 'Mixed' }, dxy: { lo: 97, mid: 100, hi: 104, direction: 'Volatile' }, gold: { lo: 4800, mid: 5100, hi: 5500, direction: 'Bullish' } },
  breakout:   { oil: { lo: 100, mid: 115, hi: 130, direction: 'Bullish' }, sp500: { lo: -25, mid: -18, hi: -12, direction: 'Strongly bearish' }, treasury: { lo: 3.50, mid: 4.50, hi: 5.00, direction: 'Volatile' }, dxy: { lo: 103, mid: 106, hi: 110, direction: 'Strongly strengthens' }, gold: { lo: 5800, mid: 6500, hi: 8000, direction: 'Extreme bullish' } },
};

// --- NARRATIVE TEMPLATES FOR MARKET COMMENTARY ---
export const MARKET_COMMENTARY: Record<string, (values: Record<string, string>) => string> = {
  oil_high: ({ price }) => `Brent crude is expected at ${price}, reflecting sustained supply disruption through the Strait of Hormuz and elevated risk premiums in tanker insurance markets.`,
  oil_low: ({ price }) => `Brent crude is expected to ease toward ${price} as the risk premium dissipates and Strait transit normalises, restoring approximately 20m bbl/day of flow capacity.`,
  oil_mid: ({ price }) => `Brent crude is expected around ${price}, trading in an elevated but stable range as partial Strait restrictions maintain a moderate risk premium.`,
  equity_bearish: ({ pct }) => `The S&P 500 is expected to decline ${pct} over 3–12 months, driven by energy input cost inflation, earnings compression in transport and industrials, and elevated geopolitical risk premiums.`,
  equity_bullish: ({ pct }) => `The S&P 500 is expected to gain ${pct} as de-escalation removes the conflict risk premium, energy costs normalise, and investor confidence in the growth outlook improves.`,
  equity_flat: ({ pct }) => `The S&P 500 is expected to move ${pct}, reflecting an uneasy balance between persistent geopolitical risk and the market\'s ability to price in a prolonged stalemate.`,
  gold_high: ({ price }) => `Gold is expected at ${price}, driven by safe-haven demand, central bank accumulation, and hedging against tail-risk scenarios including nuclear escalation.`,
  gold_low: ({ price }) => `Gold is expected around ${price}, moderating from peak levels as de-escalation reduces the systemic risk premium that drove the recent rally.`,
};
