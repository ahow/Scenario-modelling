// ============================================================
// Live Market Data — Fetching & Baseline Definitions
// ============================================================
//
// Pre-war baselines: 3-month average (Nov 15 2025 – Feb 15 2026)
// computed from FMP historical data for ETF proxies.
//
// ETF proxies:
//   DM Equities → ACWI (iShares MSCI ACWI)
//   EM Equities → EEM (iShares MSCI Emerging Markets)
//   Credit      → LQD (iShares iBoxx $ IG Corporate Bond)
//   Gov Bonds   → TLT (iShares 20+ Year Treasury Bond)
//   Oil/Brent   → BZUSD (Brent Crude Futures)
//   Gold        → GCUSD (Gold Futures)
//   USD Basket  → DXUSD (US Dollar Index Futures)
//   Cash        → (no proxy, always 0%)

import type { AssetId } from './config';

/** Pre-war baseline prices (3-month avg, Nov 15 2025 – Feb 15 2026) */
export const BASELINES: Record<AssetId, number> = {
  dm_eq:   142.93,   // ACWI
  em_eq:   56.44,    // EEM
  credit:  110.67,   // LQD
  govbond: 88.09,    // TLT
  brent:   63.82,    // BZUSD
  gold:    4534.96,  // GCUSD
  usd:     98.31,    // DXUSD
};

/** FMP ticker symbols for each asset */
export const FMP_TICKERS: Record<AssetId, { symbol: string; type: 'equity' | 'commodity' }> = {
  dm_eq:   { symbol: 'ACWI', type: 'equity' },
  em_eq:   { symbol: 'EEM', type: 'equity' },
  credit:  { symbol: 'LQD', type: 'equity' },
  govbond: { symbol: 'TLT', type: 'equity' },
  brent:   { symbol: 'BZUSD', type: 'commodity' },
  gold:    { symbol: 'GCUSD', type: 'commodity' },
  usd:     { symbol: 'DXUSD', type: 'commodity' },
};

/** Live quote data returned by the backend */
export interface LiveQuotes {
  prices: Record<AssetId, number>;       // current price levels
  pctFromBaseline: Record<AssetId, number>; // % change from pre-war baseline
  timestamp: string;                      // ISO timestamp of last fetch
  source: 'live' | 'fallback';           // whether data is live or fallback
}

/** Fallback prices (baked in at last build time — Apr 13 2026) */
export const FALLBACK_PRICES: Record<AssetId, number> = {
  dm_eq:   146.27,
  em_eq:   61.09,
  credit:  109.62,
  govbond: 86.77,
  brent:   98.20,
  gold:    4765.00,
  usd:     98.18,
};

/** Convert absolute price to % change from baseline */
export function pctFromBaseline(assetId: AssetId, price: number): number {
  const baseline = BASELINES[assetId];
  return ((price - baseline) / baseline) * 100;
}

/** Build LiveQuotes from a prices record */
export function buildLiveQuotes(prices: Record<AssetId, number>, source: 'live' | 'fallback'): LiveQuotes {
  const pct = {} as Record<AssetId, number>;
  for (const [id, price] of Object.entries(prices)) {
    pct[id as AssetId] = pctFromBaseline(id as AssetId, price);
  }
  return {
    prices,
    pctFromBaseline: pct,
    timestamp: new Date().toISOString(),
    source,
  };
}

/** Fetch live quotes from the backend API, with fallback */
export async function fetchLiveQuotes(): Promise<LiveQuotes> {
  try {
    const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
    const res = await fetch(`${API_BASE}/api/market-data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data as LiveQuotes;
  } catch {
    // Backend unavailable (e.g. static S3 deployment) — use fallback
    return buildLiveQuotes(FALLBACK_PRICES, 'fallback');
  }
}
