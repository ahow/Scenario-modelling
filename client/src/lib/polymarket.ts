// ============================================================
// Polymarket Integration — Fetch prediction market data
// Maps contracts to decision points and outcomes
// ============================================================

import type { SignalId } from './config';

export interface PolymarketContract {
  question: string;
  slug: string;
  yesPrice: number;    // 0–1
  volume: number;      // USD
  lastUpdated: string; // ISO timestamp
}

export interface PolymarketMapping {
  signalId: SignalId;
  contracts: PolymarketContract[];
  impliedPosition: number; // 0–100 slider position
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

// Known Polymarket contract slugs mapped to our decision points
const CONTRACT_SEARCH_TERMS: Array<{
  signalId: SignalId;
  queries: string[];
  mapper: (contracts: PolymarketContract[]) => { position: number; reasoning: string } | null;
}> = [
  {
    signalId: 'trump_war',
    queries: ['iran peace', 'iran conflict end', 'iran ceasefire', 'iran war'],
    mapper: (contracts) => {
      // Higher "conflict ends" price → slider left (pursuing deal)
      // Lower → slider right (resuming strikes)
      const endContracts = contracts.filter(c =>
        /end|peace|ceasefire|deal|agree/i.test(c.question)
      );
      if (endContracts.length === 0) return null;
      const best = endContracts.sort((a, b) => b.volume - a.volume)[0];
      // yesPricee 0.5 = centre, 0 = full right, 1 = full left
      const position = Math.round(100 - best.yesPrice * 100);
      return {
        position: Math.max(15, Math.min(85, position)),
        reasoning: `"${best.question}" at ${(best.yesPrice * 100).toFixed(0)}% Yes ($${(best.volume / 1e6).toFixed(1)}M volume)`,
      };
    },
  },
  {
    signalId: 'iran_strait',
    queries: ['strait hormuz', 'hormuz traffic', 'hormuz reopen'],
    mapper: (contracts) => {
      const straitContracts = contracts.filter(c =>
        /hormuz|strait/i.test(c.question)
      );
      if (straitContracts.length === 0) return null;
      const best = straitContracts.sort((a, b) => b.volume - a.volume)[0];
      // "traffic returns to normal" yes = slider left (reopening)
      const isNormalize = /normal|reopen|open/i.test(best.question);
      const position = isNormalize
        ? Math.round(100 - best.yesPrice * 100)
        : Math.round(best.yesPrice * 100);
      return {
        position: Math.max(15, Math.min(85, position)),
        reasoning: `"${best.question}" at ${(best.yesPrice * 100).toFixed(0)}% Yes ($${(best.volume / 1e6).toFixed(1)}M volume)`,
      };
    },
  },
  {
    signalId: 'iran_regime',
    queries: ['iranian regime', 'iran regime fall', 'iran government collapse'],
    mapper: (contracts) => {
      const regimeContracts = contracts.filter(c =>
        /regime|fall|collapse|government.*iran/i.test(c.question)
      );
      if (regimeContracts.length === 0) return null;
      const best = regimeContracts.sort((a, b) => b.volume - a.volume)[0];
      // "regime fall" yes = slider right (fracturing)
      const position = Math.round(50 + best.yesPrice * 50);
      return {
        position: Math.max(15, Math.min(85, position)),
        reasoning: `"${best.question}" at ${(best.yesPrice * 100).toFixed(0)}% Yes ($${(best.volume / 1e6).toFixed(1)}M volume)`,
      };
    },
  },
  {
    signalId: 'iran_nuke',
    queries: ['iran nuclear', 'iran weapon', 'iran enrichment'],
    mapper: (contracts) => {
      const nukeContracts = contracts.filter(c =>
        /nuclear|weapon|enrich|bomb/i.test(c.question) && /iran/i.test(c.question)
      );
      if (nukeContracts.length === 0) return null;
      const best = nukeContracts.sort((a, b) => b.volume - a.volume)[0];
      // "nuclear weapon" yes = slider right
      const isThreat = /weapon|bomb|breakout/i.test(best.question);
      const position = isThreat
        ? Math.round(50 + best.yesPrice * 50)
        : Math.round(50 - best.yesPrice * 50);
      return {
        position: Math.max(15, Math.min(85, position)),
        reasoning: `"${best.question}" at ${(best.yesPrice * 100).toFixed(0)}% Yes ($${(best.volume / 1e6).toFixed(1)}M volume)`,
      };
    },
  },
];

// Cache to avoid repeated fetches
let cachedData: { mappings: PolymarketMapping[]; fetchedAt: string } | null = null;

async function searchPolymarket(query: string): Promise<PolymarketContract[]> {
  try {
    const url = `https://gamma-api.polymarket.com/events?active=true&closed=false&limit=15&order=volume&ascending=false`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const events: any[] = await resp.json();

    const contracts: PolymarketContract[] = [];
    const qLower = query.toLowerCase();

    for (const event of events) {
      const title = (event.title || '').toLowerCase();
      if (!title.includes(qLower.split(' ')[0])) continue;

      for (const market of event.markets || []) {
        const question = market.question || '';
        const prices = JSON.parse(market.outcomePrices || '[]');
        contracts.push({
          question,
          slug: market.slug || '',
          yesPrice: parseFloat(prices[0]) || 0.5,
          volume: parseFloat(market.volume) || 0,
          lastUpdated: market.updatedAt || new Date().toISOString(),
        });
      }
    }
    return contracts;
  } catch {
    return [];
  }
}

export async function fetchPolymarketData(): Promise<PolymarketMapping[]> {
  // Return cache if fresh (< 5 min)
  if (cachedData) {
    const age = Date.now() - new Date(cachedData.fetchedAt).getTime();
    if (age < 5 * 60 * 1000) return cachedData.mappings;
  }

  const mappings: PolymarketMapping[] = [];

  for (const mapping of CONTRACT_SEARCH_TERMS) {
    let allContracts: PolymarketContract[] = [];
    for (const query of mapping.queries) {
      const results = await searchPolymarket(query);
      allContracts = allContracts.concat(results);
    }

    // Deduplicate by slug
    const seen = new Set<string>();
    allContracts = allContracts.filter(c => {
      if (seen.has(c.slug)) return false;
      seen.add(c.slug);
      return true;
    });

    const result = mapping.mapper(allContracts);
    if (result) {
      mappings.push({
        signalId: mapping.signalId,
        contracts: allContracts.sort((a, b) => b.volume - a.volume).slice(0, 3),
        impliedPosition: result.position,
        confidence: allContracts.some(c => c.volume > 5_000_000) ? 'high' : 'medium',
        reasoning: result.reasoning,
      });
    }
  }

  cachedData = { mappings, fetchedAt: new Date().toISOString() };
  return mappings;
}

export function getPolymarketAnchor(mappings: PolymarketMapping[], signalId: SignalId): PolymarketMapping | undefined {
  return mappings.find(m => m.signalId === signalId);
}
