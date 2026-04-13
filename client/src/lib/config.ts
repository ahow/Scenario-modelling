// ============================================================
// Iran Conflict Scenario Engine — Configuration v7
// New asset classes + improved scenario descriptions
// ============================================================

// --- SCENARIO DEFINITIONS ---
export type ScenarioId = 'deal' | 'frozen' | 'resumed' | 'hormuz' | 'dual' | 'trump_exit' | 'collapse' | 'breakout';

export interface Scenario {
  id: ScenarioId;
  name: string;
  shortDesc: string;
  tooltipDesc: string; // expanded description for charts
  baseProb: number;
  color: string;
  narrative: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'deal',
    name: 'Diplomatic deal',
    shortDesc: 'Full Hormuz reopening + nuclear agreement',
    tooltipDesc: 'Iran agrees to verifiable nuclear limits in exchange for phased sanctions relief. Hormuz reopens fully, shipping normalises, and risk premiums evaporate across energy and financial markets.',
    baseProb: 0.11,
    color: '#1D9E75',
    narrative: 'A comprehensive deal is reached. Iran agrees to verifiable nuclear limits in exchange for phased sanctions relief. The Strait of Hormuz reopens fully, shipping normalises within weeks, and Brent crude drops sharply as the risk premium evaporates. Equities rally on the removal of tail risk.',
  },
  {
    id: 'frozen',
    name: 'Frozen conflict',
    shortDesc: 'Ceasefire holds but no settlement',
    tooltipDesc: 'The ceasefire holds but neither side moves toward a comprehensive settlement. Hormuz remains partially restricted. Markets settle into an elevated but stable risk-premium regime.',
    baseProb: 0.28,
    color: '#3266AD',
    narrative: 'The ceasefire holds but neither side moves toward a comprehensive settlement. Hormuz remains partially restricted. Oil prices settle into an elevated range, equities drift modestly higher as the worst-case fades, and investors price in a prolonged stalemate.',
  },
  {
    id: 'resumed',
    name: 'Ceasefire collapses',
    shortDesc: 'Limited war resumes; Hormuz re-closes',
    tooltipDesc: 'The ceasefire breaks down, likely triggered by Israel\'s exclusion of Lebanon from the deal. Iran re-closes Hormuz. Oil spikes, equities sell off, and safe-haven assets rally.',
    baseProb: 0.22,
    color: '#E9AB2E',
    narrative: 'The ceasefire breaks down, likely triggered by Israel\'s exclusion of Lebanon from the deal. Iran re-closes the Strait of Hormuz. Oil spikes above $120/bbl as supply disruptions cascade through refinery markets. Equities sell off sharply and treasury yields whipsaw.',
  },
  {
    id: 'hormuz',
    name: 'Prolonged Hormuz closure',
    shortDesc: '6–12 month Strait disruption',
    tooltipDesc: 'Iran maintains prolonged closure or a managed toll system on the Strait for 6–12 months. Oil sustains above $110/bbl, global growth is revised down, and central banks face stagflationary pressure.',
    baseProb: 0.16,
    color: '#D85A30',
    narrative: 'Iran maintains a prolonged closure or managed toll system on the Strait. The disruption persists for 6–12 months. Oil sustains above $110/bbl, global growth estimates are revised down, and central banks face a stagflationary dilemma. The dollar strengthens as a safe-haven bid.',
  },
  {
    id: 'dual',
    name: 'Dual chokepoint crisis',
    shortDesc: 'Hormuz + Red Sea both disrupted',
    tooltipDesc: 'The worst supply-chain scenario: Hormuz closed while Houthis resume Red Sea attacks. ~35% of global seaborne oil faces simultaneous disruption. Oil surges past $150/bbl, equities enter bear-market territory.',
    baseProb: 0.06,
    color: '#A32D2D',
    narrative: 'The worst supply-chain scenario materialises: Hormuz remains closed while Houthis resume active Red Sea attacks. Global shipping faces simultaneous disruption at two critical chokepoints. Oil surges past $150/bbl, equities enter a bear market, and gold spikes as a systemic hedge.',
  },
  {
    id: 'trump_exit',
    name: 'US withdrawal',
    shortDesc: 'Trump declares victory; no deal; Iran rebuilds',
    tooltipDesc: 'Trump declares a political victory and withdraws US engagement without a deal. Iran quietly rebuilds capabilities. Immediate risk falls but medium-term nuclear ambiguity caps recovery.',
    baseProb: 0.13,
    color: '#888780',
    narrative: 'Trump declares a political victory and draws down US engagement without a comprehensive deal. Iran quietly rebuilds its capabilities. Oil eases as immediate conflict risk falls, equities recover modestly, but the medium-term overhang of unresolved nuclear ambiguity caps the rally.',
  },
  {
    id: 'collapse',
    name: 'Regime fractures',
    shortDesc: 'Internal collapse; nuclear material uncertainty',
    tooltipDesc: 'Internal regime fractures from popular unrest or IRGC splits lead to loss of centralised control. Energy disruption eases but nuclear material security becomes a global concern.',
    baseProb: 0.06,
    color: '#534AB7',
    narrative: 'Internal fractures within the regime — whether from popular unrest or IRGC splits — lead to a loss of centralised control. The immediate energy disruption eases as military posture fragments, but nuclear material security becomes a global concern. Markets rally on lower oil but hedging demand for gold rises.',
  },
  {
    id: 'breakout',
    name: 'Nuclear breakout',
    shortDesc: 'Iran weaponises; severe geopolitical re-rating',
    tooltipDesc: 'Iran achieves nuclear weapons capability under an IAEA monitoring blackout. Triggers Saudi proliferation, potential Israeli pre-emption, and a severe re-rating of geopolitical risk across all asset classes.',
    baseProb: 0.04,
    color: '#791F1F',
    narrative: 'Iran achieves nuclear weapons capability under an IAEA monitoring blackout. This triggers a severe geopolitical re-rating: Saudi Arabia accelerates its own programme, Israel considers pre-emptive action, and the US faces a strategic crisis. Equities sell off violently, gold surges past $6,000, and oil spikes on fears of regional escalation.',
  },
];

export const SCENARIO_MAP = Object.fromEntries(SCENARIOS.map(s => [s.id, s])) as Record<ScenarioId, Scenario>;
export const SCENARIO_IDS = SCENARIOS.map(s => s.id);

// --- SPECTRUM SIGNAL DEFINITIONS ---
export type SignalId = 'trump_war' | 'trump_leb' | 'iran_nuke' | 'iran_strait' | 'iran_regime' | 'israel_leb' | 'china' | 'houthi' | 'market';

export interface Signal {
  id: SignalId;
  actor: string;
  actorColor: string;
  question: string;
  context: string;
  leftLabel: string;
  rightLabel: string;
  centerLabel?: string;
  anchors: string[];
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
// v7.3: All assets expressed as % change from pre-war baseline
// Baselines: 3-month average (Nov 15 2025 – Feb 15 2026) of ETF proxies
// Live current levels fetched from FMP API at runtime
export type AssetId = 'brent' | 'gold' | 'govbond' | 'credit' | 'dm_eq' | 'em_eq' | 'usd';

export interface AssetRange {
  lo: number;
  mid: number;
  hi: number;
  direction: string;
}

export interface AssetDef {
  id: AssetId;
  name: string;
  ticker: string;      // ETF/futures proxy ticker
  format: (v: number) => string;
  formatShort: (v: number) => string;
}

// All assets now use % change from pre-war baseline
const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

export const ASSETS: AssetDef[] = [
  { id: 'brent',   name: 'Brent Crude',   ticker: 'BZUSD', format: fmtPct, formatShort: fmtPct },
  { id: 'gold',    name: 'Gold',          ticker: 'GCUSD', format: fmtPct, formatShort: fmtPct },
  { id: 'govbond', name: 'Gov Bonds',     ticker: 'TLT',   format: fmtPct, formatShort: fmtPct },
  { id: 'credit',  name: 'Credit',        ticker: 'LQD',   format: fmtPct, formatShort: fmtPct },
  { id: 'dm_eq',   name: 'DM Equities',   ticker: 'ACWI',  format: fmtPct, formatShort: fmtPct },
  { id: 'em_eq',   name: 'EM Equities',   ticker: 'EEM',   format: fmtPct, formatShort: fmtPct },
  { id: 'usd',     name: 'USD Basket',    ticker: 'DXUSD', format: fmtPct, formatShort: fmtPct },
];

export const ASSET_MAP = Object.fromEntries(ASSETS.map(a => [a.id, a])) as Record<AssetId, AssetDef>;

/**
 * MARKET_IMPACT — Scenario-conditional expected outcomes for each asset over a 3–12 month horizon.
 *
 * ALL VALUES ARE NOW % CHANGES FROM PRE-WAR BASELINE.
 *
 * Baselines (3-month avg, Nov 15 2025 – Feb 15 2026):
 *   Brent (BZUSD):  $63.82/bbl
 *   Gold (GCUSD):   $4,535/oz
 *   Gov Bonds (TLT): 88.09
 *   Credit (LQD):   110.67
 *   DM Equities (ACWI): 142.93
 *   EM Equities (EEM): 56.44
 *   USD Basket (DXUSD): 98.31
 *
 * These are editorial estimates informed by historical conflict-era market moves,
 * geopolitical risk premia research, and scenario-specific supply/demand analysis.
 * They are not investment recommendations.
 */
export const MARKET_IMPACT: Record<ScenarioId, Record<AssetId, AssetRange>> = {
  deal: {
    brent:   { lo: 2, mid: 13, hi: 25, direction: 'Strongly bearish vs. war peak' },
    gold:    { lo: -7, mid: -4, hi: 0, direction: 'Bearish' },
    govbond: { lo: 1, mid: 3, hi: 5, direction: 'Rally (yields fall)' },
    credit:  { lo: 1, mid: 3, hi: 5, direction: 'Spreads tighten sharply' },
    dm_eq:   { lo: 8, mid: 12, hi: 16, direction: 'Strong rally' },
    em_eq:   { lo: 10, mid: 15, hi: 20, direction: 'Strong rally' },
    usd:     { lo: -4, mid: -2, hi: 0, direction: 'Weakens (risk-on)' },
  },
  frozen: {
    brent:   { lo: 25, mid: 41, hi: 52, direction: 'Elevated but stable' },
    gold:    { lo: 1, mid: 5, hi: 9, direction: 'Stable' },
    govbond: { lo: -1, mid: 1, hi: 2, direction: 'Modest rally' },
    credit:  { lo: 0, mid: 1, hi: 2, direction: 'Stable to modest tightening' },
    dm_eq:   { lo: 2, mid: 5, hi: 8, direction: 'Modestly positive' },
    em_eq:   { lo: 0, mid: 3, hi: 7, direction: 'Modestly positive' },
    usd:     { lo: -1, mid: 0, hi: 2, direction: 'Stable' },
  },
  resumed: {
    brent:   { lo: 72, mid: 88, hi: 104, direction: 'Bullish' },
    gold:    { lo: 10, mid: 14, hi: 19, direction: 'Bullish' },
    govbond: { lo: -2, mid: 1, hi: 4, direction: 'Mixed (flight-to-quality vs. inflation)' },
    credit:  { lo: -6, mid: -3, hi: -1, direction: 'Spreads widen' },
    dm_eq:   { lo: -14, mid: -9, hi: -5, direction: 'Bearish' },
    em_eq:   { lo: -18, mid: -12, hi: -7, direction: 'Bearish' },
    usd:     { lo: 2, mid: 4, hi: 6, direction: 'Strengthens (safe haven)' },
  },
  hormuz: {
    brent:   { lo: 65, mid: 80, hi: 96, direction: 'Strongly bullish' },
    gold:    { lo: 15, mid: 21, hi: 30, direction: 'Strongly bullish' },
    govbond: { lo: -3, mid: 0, hi: 3, direction: 'Volatile — stagflation dilemma' },
    credit:  { lo: -8, mid: -5, hi: -2, direction: 'Spreads widen significantly' },
    dm_eq:   { lo: -20, mid: -14, hi: -8, direction: 'Strongly bearish' },
    em_eq:   { lo: -25, mid: -18, hi: -10, direction: 'Strongly bearish' },
    usd:     { lo: 3, mid: 6, hi: 9, direction: 'Strongly strengthens' },
  },
  dual: {
    brent:   { lo: 135, mid: 159, hi: 182, direction: 'Extreme bullish' },
    gold:    { lo: 28, mid: 41, hi: 54, direction: 'Extreme bullish' },
    govbond: { lo: -5, mid: -1, hi: 4, direction: 'Extreme volatility' },
    credit:  { lo: -15, mid: -10, hi: -6, direction: 'Crisis-level spread widening' },
    dm_eq:   { lo: -32, mid: -24, hi: -16, direction: 'Bear market' },
    em_eq:   { lo: -40, mid: -30, hi: -20, direction: 'Severe bear market' },
    usd:     { lo: 5, mid: 9, hi: 13, direction: 'Strong safe-haven bid' },
  },
  trump_exit: {
    brent:   { lo: 10, mid: 21, hi: 33, direction: 'Bearish vs. war peak' },
    gold:    { lo: -5, mid: -1, hi: 4, direction: 'Modestly bearish' },
    govbond: { lo: 0, mid: 2, hi: 3, direction: 'Modest rally' },
    credit:  { lo: 0, mid: 2, hi: 3, direction: 'Modest tightening' },
    dm_eq:   { lo: 4, mid: 7, hi: 11, direction: 'Positive' },
    em_eq:   { lo: 3, mid: 6, hi: 10, direction: 'Positive' },
    usd:     { lo: -3, mid: -1, hi: 1, direction: 'Modestly weaker' },
  },
  collapse: {
    brent:   { lo: -6, mid: 10, hi: 25, direction: 'Strongly bearish' },
    gold:    { lo: 6, mid: 12, hi: 21, direction: 'Bullish (nuclear uncertainty)' },
    govbond: { lo: 0, mid: 2, hi: 4, direction: 'Rally on lower oil' },
    credit:  { lo: -2, mid: 1, hi: 3, direction: 'Mixed' },
    dm_eq:   { lo: 3, mid: 8, hi: 13, direction: 'Positive (energy relief)' },
    em_eq:   { lo: 2, mid: 7, hi: 12, direction: 'Positive' },
    usd:     { lo: -2, mid: 1, hi: 4, direction: 'Volatile' },
  },
  breakout: {
    brent:   { lo: 57, mid: 80, hi: 104, direction: 'Bullish' },
    gold:    { lo: 28, mid: 43, hi: 76, direction: 'Extreme bullish' },
    govbond: { lo: -4, mid: 0, hi: 5, direction: 'Extreme volatility' },
    credit:  { lo: -12, mid: -7, hi: -3, direction: 'Sharp spread widening' },
    dm_eq:   { lo: -28, mid: -20, hi: -12, direction: 'Strongly bearish' },
    em_eq:   { lo: -35, mid: -25, hi: -15, direction: 'Strongly bearish' },
    usd:     { lo: 4, mid: 7, hi: 11, direction: 'Strongly strengthens' },
  },
};

// --- NARRATIVE TEMPLATES FOR MARKET COMMENTARY ---
export const MARKET_COMMENTARY: Record<string, (values: Record<string, string>) => string> = {
  oil_high: ({ pct }) => `Brent crude is expected ${pct} from current levels, reflecting sustained supply disruption through the Strait of Hormuz and elevated risk premiums in tanker insurance markets.`,
  oil_low: ({ pct }) => `Brent crude is expected ${pct} from current levels as the risk premium partially dissipates and Strait transit normalises, restoring approximately 20m bbl/day of flow capacity.`,
  oil_mid: ({ pct }) => `Brent crude is expected ${pct} from current levels, trading in an elevated but stable range as partial Strait restrictions maintain a moderate risk premium.`,
  equity_bearish: ({ pct }) => `Developed market equities are expected ${pct} from current levels, driven by energy input cost inflation, earnings compression in transport and industrials, and elevated geopolitical risk premiums.`,
  equity_bullish: ({ pct }) => `Developed market equities are expected ${pct} from current levels as de-escalation removes the conflict risk premium, energy costs normalise, and investor confidence in the growth outlook improves.`,
  equity_flat: ({ pct }) => `Developed market equities are expected ${pct} from current levels, reflecting an uneasy balance between persistent geopolitical risk and the market's ability to price in a prolonged stalemate.`,
  gold_high: ({ pct }) => `Gold is expected ${pct} from current levels, driven by safe-haven demand, central bank accumulation, and hedging against tail-risk scenarios including nuclear escalation.`,
  gold_low: ({ pct }) => `Gold is expected ${pct} from current levels, moderating from peak levels as de-escalation reduces the systemic risk premium that drove the recent rally.`,
};
