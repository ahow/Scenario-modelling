// ============================================================
// Iran Conflict Scenario Engine — Configuration
// All editorial data in one file for easy analyst updates
// ============================================================

// --- SCENARIO DEFINITIONS ---
export type ScenarioId = 'deal' | 'frozen' | 'resumed' | 'hormuz' | 'dual' | 'trump_exit' | 'collapse' | 'breakout';

export interface Scenario {
  id: ScenarioId;
  name: string;
  shortDesc: string;
  baseProb: number; // as decimal, sums to 1.0
  color: string;
}

export const SCENARIOS: Scenario[] = [
  { id: 'deal',       name: 'Durable diplomatic deal',           shortDesc: 'Full Hormuz reopening + nuclear agreement',              baseProb: 0.11, color: '#1D9E75' },
  { id: 'frozen',     name: 'Frozen conflict — no deal',         shortDesc: 'Ceasefire holds; no comprehensive settlement',           baseProb: 0.28, color: '#3266AD' },
  { id: 'resumed',    name: 'Ceasefire collapses — limited war', shortDesc: 'Lebanon exclusion triggers Hormuz re-closure',           baseProb: 0.22, color: '#E9AB2E' },
  { id: 'hormuz',     name: 'Prolonged Hormuz chokepoint',       shortDesc: '6–12 month partial/full Strait disruption',              baseProb: 0.16, color: '#D85A30' },
  { id: 'dual',       name: 'Dual chokepoint crisis',            shortDesc: 'Houthis resume Red Sea attacks + Hormuz closure',       baseProb: 0.06, color: '#A32D2D' },
  { id: 'trump_exit', name: 'Trump declares victory / exits',    shortDesc: 'US draws down unilaterally; no deal; Iran rebuilds',     baseProb: 0.13, color: '#888780' },
  { id: 'collapse',   name: 'Iranian regime fractures',          shortDesc: 'Internal collapse; nuclear material uncertainty',        baseProb: 0.06, color: '#534AB7' },
  { id: 'breakout',   name: 'Nuclear breakout',                  shortDesc: 'Iran weaponises under IAEA blackout',                   baseProb: 0.04, color: '#791F1F' },
];

export const SCENARIO_MAP = Object.fromEntries(SCENARIOS.map(s => [s.id, s])) as Record<ScenarioId, Scenario>;
export const SCENARIO_IDS = SCENARIOS.map(s => s.id);

// --- SIGNAL DEFINITIONS ---
export type SignalId = 'trump_war' | 'trump_leb' | 'iran_nuke' | 'iran_strait' | 'iran_regime' | 'israel_leb' | 'china' | 'houthi' | 'market';

export interface SignalOption {
  value: string;
  label: string;
  subLabel?: string; // which scenarios most affected
}

export interface Signal {
  id: SignalId;
  actor: string;
  actorColor: string;
  question: string;
  options: SignalOption[];
  defaultValue: string; // editorial default
}

export const SIGNALS: Signal[] = [
  {
    id: 'trump_war',
    actor: 'Trump — White House',
    actorColor: '#3266AD',
    question: 'War termination posture',
    options: [
      { value: 'ceasefire_deal', label: 'Pursuing ceasefire / deal', subLabel: 'deal ↑, trump_exit ↑' },
      { value: 'declare_victory', label: 'Declaring victory / exit signals', subLabel: 'trump_exit ↑↑↑' },
      { value: 'resume_strikes', label: 'Threatening / resuming strikes', subLabel: 'resumed ↑↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'trump_leb',
    actor: 'Trump — White House',
    actorColor: '#3266AD',
    question: 'Lebanon ceasefire scope',
    options: [
      { value: 'pressure_israel', label: 'Pressuring Israel on Lebanon', subLabel: 'deal ↑↑, resumed ↓↓' },
      { value: 'greenlight_israel', label: 'Green-lighting Israel operations', subLabel: 'resumed ↑↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'iran_nuke',
    actor: 'Iran / Mojtaba',
    actorColor: '#D85A30',
    question: 'Nuclear posture',
    options: [
      { value: 'iaea_talks', label: 'Engaging IAEA / inspections', subLabel: 'deal ↑↑, breakout ↓↓↓' },
      { value: 'reject_inspections', label: 'Rejecting inspections', subLabel: 'breakout ↑' },
      { value: 'covert_signals', label: 'Covert weaponisation signals', subLabel: 'breakout ↑↑↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'iran_strait',
    actor: 'Iran / Mojtaba',
    actorColor: '#D85A30',
    question: 'Strait of Hormuz strategy',
    options: [
      { value: 'partial_open', label: 'Partial opening / de-escalation', subLabel: 'hormuz ↓↓, deal ↑' },
      { value: 'tolls_yuan', label: 'Yuan transit tolls / managed closure', subLabel: 'hormuz ↑↑↑' },
      { value: 'full_closure', label: 'Full closure maintained', subLabel: 'hormuz ↑↑, dual ↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'iran_regime',
    actor: 'Iran / Mojtaba',
    actorColor: '#D85A30',
    question: 'Regime stability',
    options: [
      { value: 'consolidated', label: 'Mojtaba consolidated', subLabel: 'frozen ↑, collapse ↓↓↓' },
      { value: 'protest_resurgence', label: 'Protest resurgence', subLabel: 'collapse ↑↑↑' },
      { value: 'irgc_fracture', label: 'IRGC fracture signals', subLabel: 'collapse ↑↑↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'israel_leb',
    actor: 'Netanyahu — Israel',
    actorColor: '#1D9E75',
    question: 'Lebanon operations',
    options: [
      { value: 'continuing_ops', label: 'Continuing operations', subLabel: 'resumed ↑↑↑' },
      { value: 'pause_leb', label: 'Pausing / withdrawing', subLabel: 'deal ↑↑, resumed ↓↓' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'china',
    actor: 'Xi — China',
    actorColor: '#A32D2D',
    question: 'Diplomatic pressure',
    options: [
      { value: 'pressuring_iran', label: 'Pressuring Iran to de-escalate', subLabel: 'hormuz ↓↓, deal ↑' },
      { value: 'passive_china', label: 'Passive / non-interventionist', subLabel: 'hormuz ↑' },
      { value: 'backchannel_deal', label: 'Backchannel deal-making', subLabel: 'frozen ↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'houthi',
    actor: 'Houthis',
    actorColor: '#534AB7',
    question: 'Red Sea posture',
    options: [
      { value: 'restraint', label: 'Restraint / ceasefire holding', subLabel: 'dual ↓↓↓↓' },
      { value: 'preparing_attacks', label: 'Preparing new attacks', subLabel: 'dual ↑↑↑' },
      { value: 'active_attacks', label: 'Active Red Sea attacks', subLabel: 'dual ↑↑↑↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
  {
    id: 'market',
    actor: 'Market signal',
    actorColor: '#888780',
    question: 'Insurance / risk premiums',
    options: [
      { value: 'premiums_falling', label: 'War risk premiums falling', subLabel: 'hormuz ↓↓, frozen ↑' },
      { value: 'premiums_spiking', label: 'War risk premiums spiking', subLabel: 'hormuz ↑↑↑' },
      { value: 'unknown', label: 'Unknown / unclear' },
    ],
    defaultValue: 'unknown',
  },
];

export const SIGNAL_MAP = Object.fromEntries(SIGNALS.map(s => [s.id, s])) as Record<SignalId, Signal>;

// --- WEIGHT MATRIX ---
// weight[signalId][optionValue][scenarioId] = number (additive probability mass units)
type WeightMatrix = Record<string, Record<string, Partial<Record<ScenarioId, number>>>>;

export const WEIGHTS: WeightMatrix = {
  trump_war: {
    ceasefire_deal:  { deal: 2.5, frozen: 1.0, resumed: -1.5, hormuz: -1.0, dual: -1.0, trump_exit: -1.5, collapse: 0, breakout: -0.5 },
    declare_victory: { deal: -2.0, frozen: -0.5, resumed: -1.0, hormuz: -0.5, dual: -0.5, trump_exit: 4.0, collapse: 0, breakout: 0.5 },
    resume_strikes:  { deal: -3.0, frozen: -1.5, resumed: 2.5, hormuz: 1.0, dual: 0.5, trump_exit: -2.0, collapse: 1.5, breakout: 1.0 },
    unknown: {},
  },
  trump_leb: {
    pressure_israel:  { deal: 1.5, frozen: 1.0, resumed: -2.0, hormuz: -0.5, dual: -1.0, trump_exit: 0, collapse: 0, breakout: 0 },
    greenlight_israel: { deal: -2.5, frozen: -0.5, resumed: 3.0, hormuz: 0.5, dual: 1.5, trump_exit: 0, collapse: 0, breakout: 0 },
    unknown: {},
  },
  iran_nuke: {
    iaea_talks:         { deal: 2.0, frozen: 0.5, resumed: 0, hormuz: 0, dual: 0, trump_exit: 0, collapse: 0, breakout: -3.0 },
    reject_inspections: { deal: -2.0, frozen: 0, resumed: 0.5, hormuz: 0, dual: 0, trump_exit: 0, collapse: 0, breakout: 1.5 },
    covert_signals:     { deal: -3.5, frozen: -1.0, resumed: 1.0, hormuz: 0, dual: 0, trump_exit: -0.5, collapse: 1.0, breakout: 4.0 },
    unknown: {},
  },
  iran_strait: {
    partial_open: { deal: 1.0, frozen: 1.5, resumed: -1.0, hormuz: -2.5, dual: -2.0, trump_exit: 0.5, collapse: 0, breakout: 0 },
    tolls_yuan:   { deal: -2.0, frozen: 1.0, resumed: 0.5, hormuz: 3.5, dual: 0.5, trump_exit: 0, collapse: 0, breakout: 0 },
    full_closure: { deal: -3.0, frozen: -1.0, resumed: 2.0, hormuz: 2.0, dual: 2.0, trump_exit: -1.0, collapse: 0, breakout: 0 },
    unknown: {},
  },
  iran_regime: {
    consolidated:       { deal: 0, frozen: 1.5, resumed: 0.5, hormuz: 0.5, dual: 0, trump_exit: 0, collapse: -3.0, breakout: -0.5 },
    protest_resurgence: { deal: 0.5, frozen: -1.0, resumed: 0, hormuz: -0.5, dual: -0.5, trump_exit: 0.5, collapse: 3.5, breakout: -0.5 },
    irgc_fracture:      { deal: -1.0, frozen: -1.5, resumed: -0.5, hormuz: -0.5, dual: 0, trump_exit: 0, collapse: 4.0, breakout: 1.5 },
    unknown: {},
  },
  israel_leb: {
    continuing_ops: { deal: -2.5, frozen: -0.5, resumed: 3.0, hormuz: 0.5, dual: 1.0, trump_exit: -0.5, collapse: 0, breakout: 0 },
    pause_leb:      { deal: 2.0, frozen: 1.0, resumed: -2.5, hormuz: -0.5, dual: -1.0, trump_exit: 0, collapse: 0, breakout: 0 },
    unknown: {},
  },
  china: {
    pressuring_iran:  { deal: 1.5, frozen: 1.0, resumed: -0.5, hormuz: -2.0, dual: -1.5, trump_exit: 0, collapse: 0, breakout: -0.5 },
    passive_china:    { deal: 0, frozen: 0, resumed: 0, hormuz: 1.5, dual: 0, trump_exit: 0, collapse: 0, breakout: 0 },
    backchannel_deal: { deal: -1.5, frozen: 2.0, resumed: 0, hormuz: 1.5, dual: 0, trump_exit: 0, collapse: 0, breakout: 0 },
    unknown: {},
  },
  houthi: {
    restraint:          { deal: 0.5, frozen: 1.0, resumed: 0, hormuz: 0, dual: -4.0, trump_exit: 0, collapse: 0, breakout: 0 },
    preparing_attacks:  { deal: -1.0, frozen: -0.5, resumed: 0.5, hormuz: 1.0, dual: 3.0, trump_exit: -0.5, collapse: 0, breakout: 0 },
    active_attacks:     { deal: -3.0, frozen: -2.0, resumed: 1.0, hormuz: 2.0, dual: 5.0, trump_exit: -1.0, collapse: 0, breakout: 0 },
    unknown: {},
  },
  market: {
    premiums_falling: { deal: 1.0, frozen: 1.5, resumed: -1.0, hormuz: -2.0, dual: -2.0, trump_exit: 0.5, collapse: 0, breakout: 0 },
    premiums_spiking: { deal: -1.5, frozen: -0.5, resumed: 1.5, hormuz: 2.5, dual: 1.5, trump_exit: -1.0, collapse: 0, breakout: 0 },
    unknown: {},
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
  currentValue: number; // baseline for % change
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

// Per-scenario market impact: MARKET_IMPACT[scenarioId][assetId] = { lo, mid, hi, direction }
export const MARKET_IMPACT: Record<ScenarioId, Record<AssetId, AssetRange>> = {
  deal: {
    oil:      { lo: 65,   mid: 72,    hi: 80,   direction: 'Strongly bearish' },
    sp500:    { lo: 8,    mid: 11,    hi: 14,   direction: 'Bullish' },
    treasury: { lo: 3.90, mid: 4.05,  hi: 4.20, direction: 'Lower yields' },
    dxy:      { lo: 94,   mid: 96,    hi: 98,   direction: 'Weakens' },
    gold:     { lo: 4200, mid: 4350,  hi: 4550, direction: 'Bearish' },
  },
  frozen: {
    oil:      { lo: 80,   mid: 90,    hi: 97,   direction: 'Bearish vs. peak' },
    sp500:    { lo: 2,    mid: 4,     hi: 7,    direction: 'Modestly bullish' },
    treasury: { lo: 4.15, mid: 4.28,  hi: 4.45, direction: 'Range-bound' },
    dxy:      { lo: 97,   mid: 99,    hi: 101,  direction: 'Stable' },
    gold:     { lo: 4600, mid: 4750,  hi: 4950, direction: 'Stable / mildly bullish' },
  },
  resumed: {
    oil:      { lo: 110,  mid: 120,   hi: 130,  direction: 'Bullish' },
    sp500:    { lo: -12,  mid: -8,    hi: -5,   direction: 'Bearish' },
    treasury: { lo: 3.90, mid: 4.20,  hi: 4.55, direction: 'Mixed / volatile' },
    dxy:      { lo: 100,  mid: 102,   hi: 104,  direction: 'Strengthens' },
    gold:     { lo: 5000, mid: 5150,  hi: 5400, direction: 'Bullish' },
  },
  hormuz: {
    oil:      { lo: 105,  mid: 115,   hi: 125,  direction: 'Strongly bullish' },
    sp500:    { lo: -18,  mid: -13,   hi: -8,   direction: 'Strongly bearish' },
    treasury: { lo: 3.80, mid: 4.35,  hi: 4.80, direction: 'Mixed' },
    dxy:      { lo: 102,  mid: 105,   hi: 108,  direction: 'Strongly strengthens' },
    gold:     { lo: 5200, mid: 5500,  hi: 5900, direction: 'Strongly bullish' },
  },
  dual: {
    oil:      { lo: 150,  mid: 165,   hi: 180,  direction: 'Extreme bullish' },
    sp500:    { lo: -30,  mid: -23,   hi: -16,  direction: 'Extreme bearish' },
    treasury: { lo: 3.50, mid: 4.00,  hi: 5.00, direction: 'Extreme mixed' },
    dxy:      { lo: 105,  mid: 108,   hi: 112,  direction: 'Extreme strengthening' },
    gold:     { lo: 5800, mid: 6400,  hi: 7000, direction: 'Extreme bullish' },
  },
  trump_exit: {
    oil:      { lo: 70,   mid: 77,    hi: 85,   direction: 'Bearish' },
    sp500:    { lo: 4,    mid: 7,     hi: 10,   direction: 'Bullish' },
    treasury: { lo: 4.00, mid: 4.15,  hi: 4.30, direction: 'Modestly lower' },
    dxy:      { lo: 95,   mid: 97,    hi: 99,   direction: 'Modestly weakens' },
    gold:     { lo: 4300, mid: 4500,  hi: 4700, direction: 'Modestly bearish' },
  },
  collapse: {
    oil:      { lo: 60,   mid: 70,    hi: 80,   direction: 'Strongly bearish' },
    sp500:    { lo: 3,    mid: 7,     hi: 12,   direction: 'Bullish' },
    treasury: { lo: 4.00, mid: 4.30,  hi: 4.60, direction: 'Mixed' },
    dxy:      { lo: 97,   mid: 100,   hi: 104,  direction: 'Volatile / stable' },
    gold:     { lo: 4800, mid: 5100,  hi: 5500, direction: 'Bullish' },
  },
  breakout: {
    oil:      { lo: 100,  mid: 115,   hi: 130,  direction: 'Bullish' },
    sp500:    { lo: -25,  mid: -18,   hi: -12,  direction: 'Strongly bearish' },
    treasury: { lo: 3.50, mid: 4.50,  hi: 5.00, direction: 'Volatile' },
    dxy:      { lo: 103,  mid: 106,   hi: 110,  direction: 'Strongly strengthens' },
    gold:     { lo: 5800, mid: 6500,  hi: 8000, direction: 'Extreme bullish' },
  },
};

// --- HISTORICAL ANALOGUES ---
export interface Analogue {
  event: string;
  year: string;
  oilImpact: string;
  equityImpact: string;
  duration: string;
}

export const ANALOGUES: Analogue[] = [
  { event: '1973 Arab Oil Embargo',   year: '1973–74', oilImpact: '+300% (US$3→$12)',           equityImpact: 'S&P 500 −48%',     duration: '6 months' },
  { event: '1990 Gulf War',           year: '1990–91', oilImpact: '+130% ($17→$40)',             equityImpact: 'S&P 500 −20%',     duration: '7 months' },
  { event: '2003 Iraq Invasion',      year: '2003',    oilImpact: '+40% pre-invasion spike',     equityImpact: 'S&P 500 −33%',     duration: '3 months' },
  { event: '2019 Aramco Attack',      year: '2019',    oilImpact: '+15% intraday spike',         equityImpact: 'Minimal lasting',   duration: '2 weeks' },
  { event: '2022 Ukraine Invasion',   year: '2022',    oilImpact: '+60% ($70→$128 peak)',        equityImpact: 'S&P 500 −25%',     duration: '9 months' },
];

// --- KEY INFORMATION POINTS (ranked by discriminatory power) ---
export interface KeyInfoPoint {
  rank: number;
  signalId: SignalId;
  label: string;
  whatToMonitor: string;
  dataSources: string;
}

export const KEY_INFO_POINTS: KeyInfoPoint[] = [
  { rank: 1, signalId: 'houthi',      label: 'Houthi Red Sea posture',            whatToMonitor: 'Drone/missile attack reports on Red Sea shipping; Iranian green-light signals to Sanaa', dataSources: 'ACLED, Lloyd\'s List, UKMTO shipping alerts' },
  { rank: 2, signalId: 'iran_nuke',   label: 'Iran nuclear site activity',         whatToMonitor: 'IAEA access / denial; satellite imagery of Isfahan tunnel complex; HEU movements', dataSources: 'IAEA GOV reports, Planet Labs, Middlebury Institute' },
  { rank: 3, signalId: 'israel_leb',  label: 'Israeli Lebanon operations',         whatToMonitor: 'IDF division movements; Hezbollah rocket cadence; US-Israel ceasefire statements', dataSources: 'IDF spokesperson, ACLED, Reuters' },
  { rank: 4, signalId: 'market',      label: 'Tanker insurance premiums',          whatToMonitor: 'Gulf war risk premiums ($/voyage); actual tanker transit numbers through Hormuz', dataSources: 'Lloyd\'s Market Assoc., Clarksons Research, IMB PRC' },
  { rank: 5, signalId: 'trump_war',   label: 'Trump war termination posture',      whatToMonitor: '"Mission Accomplished" signals vs. deal-seeking vs. strike threats', dataSources: 'White House press office, C-SPAN, Reuters' },
  { rank: 6, signalId: 'iran_strait', label: 'Iran Strait strategy',               whatToMonitor: 'Selective vs. full closure; yuan transit fees; IRGC Navy statements', dataSources: 'IRNA, PressTV, Tasnim; shipping trackers' },
  { rank: 7, signalId: 'iran_regime', label: 'Iranian regime stability',            whatToMonitor: 'Protest volume; IRGC command communications; Mojtaba Khamenei consolidation', dataSources: 'ACLED, Iran Human Rights Monitor, OSINT' },
  { rank: 8, signalId: 'china',       label: 'Chinese diplomatic pressure',         whatToMonitor: 'MFA statements; Xi-Mojtaba communications; separate yuan oil deal reports', dataSources: 'Chinese MFA readouts, Xinhua, Bloomberg' },
  { rank: 9, signalId: 'trump_leb',   label: 'Trump / Netanyahu alignment',        whatToMonitor: 'Public contradictions on Lebanon ceasefire exclusion; joint statements', dataSources: 'White House, Israeli PMO readouts' },
];
