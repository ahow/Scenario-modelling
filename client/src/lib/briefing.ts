// ============================================================
// News Briefing Layer — Live intelligence for the scenario engine
// Combines GDELT news monitoring with structured analysis
// ============================================================

import type { SignalId, ScenarioId } from './config';

export interface BriefingItem {
  signalId: SignalId;
  headline: string;
  detail: string;
  sources: Array<{ name: string; url: string }>;
  timestamp: string;
}

export interface SliderShift {
  signalId: SignalId;
  direction: 'left' | 'right';
  magnitude: number;        // 0–50 (how far from centre)
  newEstimate: number;      // 0–100 slider position
  previousEstimate: number; // 0–100 slider position
  reasoning: string;
}

export interface ScenarioShift {
  scenarioId: ScenarioId;
  previousProb: number; // percentage
  updatedProb: number;  // percentage
}

export interface Briefing {
  timestamp: string;
  title: string;
  items: BriefingItem[];
  sliderShifts: SliderShift[];
  scenarioShifts: ScenarioShift[];
  severity: 'normal' | 'elevated' | 'critical';
}

// Pre-seeded briefing based on April 12–13, 2026 events
const LATEST_BRIEFING: Briefing = {
  timestamp: '2026-04-13T08:00:00Z',
  title: 'Islamabad Talks Collapse; US Announces Hormuz Blockade',
  severity: 'critical',
  items: [
    {
      signalId: 'trump_war',
      headline: 'Islamabad peace talks collapse after 21 hours',
      detail: 'VP Vance stated Iran "chose not to accept our terms," citing Iran\'s refusal to commit to abandoning nuclear weapons capability. Vance left with a "final and best offer" still on the table but no timeline for resumption. Trump announced a naval blockade of the Strait of Hormuz. Analysts consider immediate resumed talks unlikely.',
      sources: [
        { name: 'NPR', url: 'https://www.npr.org/2026/04/12/nx-s1-5782538/u-s-iran-peace-talks-islamabad-collapse' },
        { name: 'Time', url: 'https://time.com/article/2026/04/11/strait-of-hormuz-iran-peace-talks/' },
      ],
      timestamp: '2026-04-12T07:00:00Z',
    },
    {
      signalId: 'iran_strait',
      headline: 'US naval blockade of Strait of Hormuz announced',
      detail: 'Trump ordered a US naval blockade of all ships entering or exiting the Strait. Two US guided-missile destroyers transited Hormuz for the first time since the conflict began. CENTCOM confirmed mine-clearing operations have commenced. Iran previously demanded continued control of the Strait and the right to levy transit fees as a condition of any deal.',
      sources: [
        { name: 'NPR', url: 'https://www.npr.org/2026/04/12/nx-s1-5782538/u-s-iran-peace-talks-islamabad-collapse' },
        { name: 'Al Jazeera', url: 'https://www.aljazeera.com/news/2026/4/12/us-and-iran-fail-to-reach-peace-deal-after-marathon-talks-in-pakistan' },
      ],
      timestamp: '2026-04-12T10:00:00Z',
    },
    {
      signalId: 'iran_nuke',
      headline: 'Nuclear question was the stated reason for collapse',
      detail: 'US demands included: end to all enrichment, dismantling of enrichment facilities, and US retrieval of highly enriched uranium. Iran maintains its programme is for peaceful purposes. Neither side indicated willingness to compromise on this core issue.',
      sources: [
        { name: 'Time', url: 'https://time.com/article/2026/04/11/strait-of-hormuz-iran-peace-talks/' },
        { name: 'BBC', url: 'https://www.bbc.com/news/videos/cqj82xn9n8eo' },
      ],
      timestamp: '2026-04-12T08:00:00Z',
    },
    {
      signalId: 'israel_leb',
      headline: 'Israel strikes 200+ Hezbollah targets despite ceasefire',
      detail: 'Israel struck over 200 Hezbollah targets in Lebanon over the weekend. At least 35 killed on Sunday according to Lebanese officials. Iran\'s deal demands included ending Israeli attacks on Hezbollah. Lebanon-Israel ambassadorial talks set for Tuesday at the State Department — the first direct high-level contact.',
      sources: [
        { name: 'NPR', url: 'https://www.npr.org/2026/04/11/nx-s1-5781760/pakistan-peace-talks-us-iran' },
        { name: 'DW', url: 'https://www.dw.com/en/us-iran-talks-what-prevented-a-deal-and-whats-next/a-76755660' },
      ],
      timestamp: '2026-04-12T14:00:00Z',
    },
  ],
  sliderShifts: [
    {
      signalId: 'trump_war',
      direction: 'right',
      magnitude: 18,
      newEstimate: 68,
      previousEstimate: 50,
      reasoning: 'Diplomacy failed; blockade announced. Probability of a negotiated settlement drops significantly.',
    },
    {
      signalId: 'iran_strait',
      direction: 'right',
      magnitude: 22,
      newEstimate: 72,
      previousEstimate: 50,
      reasoning: 'US blockade announced + mine clearing underway. Strait situation escalating, not de-escalating.',
    },
    {
      signalId: 'iran_nuke',
      direction: 'right',
      magnitude: 12,
      newEstimate: 62,
      previousEstimate: 50,
      reasoning: 'Core US demand rejected. Under maximum military pressure with no diplomatic offramp. Historical pattern: cornered regimes accelerate programmes.',
    },
    {
      signalId: 'israel_leb',
      direction: 'right',
      magnitude: 20,
      newEstimate: 70,
      previousEstimate: 50,
      reasoning: '200+ strikes despite ceasefire suggests US has tacitly endorsed continued operations. Iran will view this as a deal-breaker.',
    },
    {
      signalId: 'iran_regime',
      direction: 'left',
      magnitude: 2,
      newEstimate: 43,
      previousEstimate: 50,
      reasoning: 'War has so far consolidated regime support. No signs of internal fracturing despite military losses.',
    },
    {
      signalId: 'china',
      direction: 'left',
      magnitude: 8,
      newEstimate: 42,
      previousEstimate: 50,
      reasoning: 'Talks collapse + blockade increases pressure on China to intervene diplomatically to protect energy imports.',
    },
    {
      signalId: 'houthi',
      direction: 'right',
      magnitude: 10,
      newEstimate: 60,
      previousEstimate: 50,
      reasoning: 'Ceasefire collapse risk increases probability of Houthi resuming Red Sea attacks in solidarity.',
    },
    {
      signalId: 'market',
      direction: 'right',
      magnitude: 15,
      newEstimate: 65,
      previousEstimate: 50,
      reasoning: 'Talks failure + blockade announcement = significant increase in shipping insurance premiums expected.',
    },
    {
      signalId: 'trump_leb',
      direction: 'right',
      magnitude: 12,
      newEstimate: 62,
      previousEstimate: 50,
      reasoning: 'Israel struck 200+ targets while US was negotiating. No public US criticism suggests tacit green-lighting.',
    },
  ],
  scenarioShifts: [
    { scenarioId: 'deal', previousProb: 11, updatedProb: 6 },
    { scenarioId: 'frozen', previousProb: 28, updatedProb: 21 },
    { scenarioId: 'resumed', previousProb: 22, updatedProb: 28 },
    { scenarioId: 'hormuz', previousProb: 16, updatedProb: 23 },
    { scenarioId: 'trump_exit', previousProb: 13, updatedProb: 10 },
    { scenarioId: 'dual', previousProb: 6, updatedProb: 7 },
    { scenarioId: 'collapse', previousProb: 6, updatedProb: 5 },
    { scenarioId: 'breakout', previousProb: 4, updatedProb: 5 },
  ],
};

let currentBriefing = LATEST_BRIEFING;

// Fetch latest news from GDELT (free, no auth)
export async function fetchGDELTNews(): Promise<Array<{ title: string; url: string; domain: string; date: string }>> {
  try {
    const queries = ['iran strait hormuz', 'iran nuclear talks', 'iran ceasefire', 'houthi red sea'];
    const allArticles: Array<{ title: string; url: string; domain: string; date: string }> = [];

    for (const query of queries.slice(0, 2)) {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=5&format=json&timespan=24h&sort=DateDesc`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const articles = data.articles || [];
      for (const art of articles) {
        allArticles.push({
          title: art.title || '',
          url: art.url || '',
          domain: art.domain || '',
          date: art.seendate || '',
        });
      }
    }
    return allArticles;
  } catch {
    return [];
  }
}

export function getCurrentBriefing(): Briefing {
  return currentBriefing;
}

export function getBriefingAnchors(): Record<SignalId, number> {
  const anchors: Record<string, number> = {};
  for (const shift of currentBriefing.sliderShifts) {
    anchors[shift.signalId] = shift.newEstimate;
  }
  return anchors as Record<SignalId, number>;
}

export function getBriefingAge(): string {
  const ms = Date.now() - new Date(currentBriefing.timestamp).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return 'Updated just now';
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}
