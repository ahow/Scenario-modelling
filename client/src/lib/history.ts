// ============================================================
// Historical Timeline — Implied scenario probabilities over time
// Each snapshot represents estimated slider positions at a key date
// based on events known at that time, run through the same engine.
// ============================================================

import type { SignalId, ScenarioId } from './config';
import { computeProbsFromSliders, getBaseProbs } from './engine';
import { SIGNALS } from './config';

export interface HistoricalSnapshot {
  date: string;       // ISO date
  label: string;      // Short event label
  detail: string;     // Longer description
  source?: string;    // URL for source
  sliders: Partial<Record<SignalId, number>>; // Only non-50 values
}

// Timeline of key events with estimated slider positions at that time.
// All positions are editorial estimates of where each decision sat
// given the information available at the time.
// Positions not listed default to 50 (neutral/unknown).
const TIMELINE: HistoricalSnapshot[] = [
  {
    date: '2025-06-13',
    label: 'Israel strikes Iran',
    detail: 'Israel launches strikes on Iranian nuclear and military facilities. Iran retaliates with nightly missile barrages. War begins.',
    source: 'https://www.jta.org/2026/02/28/united-states/what-happened-during-the-2025-israel-iran-war-a-timeline',
    sliders: {
      trump_war: 55,        // Ambiguous — "nobody knows what I'm going to do"
      iran_nuke: 55,        // Inspections suspended but not overtly weaponising
      iran_strait: 45,      // Strait still open at this point
      israel_leb: 65,       // Active IDF operations
      iran_regime: 45,      // Consolidated under Khamenei
    },
  },
  {
    date: '2025-06-21',
    label: 'US joins — strikes Fordow, Natanz',
    detail: 'US bombs three Iranian nuclear sites alongside Israel. Major escalation.',
    source: 'https://www.pbs.org/newshour/world/a-timeline-of-tensions-over-irans-nuclear-program-as-talks-with-u-s-approach',
    sliders: {
      trump_war: 75,        // Full military engagement
      iran_nuke: 40,        // Facilities damaged, programme set back
      iran_strait: 50,      // Not yet closed
      israel_leb: 70,       // Continuing operations
      iran_regime: 42,      // Still consolidated
    },
  },
  {
    date: '2025-06-24',
    label: 'Twelve-Day War ceasefire',
    detail: 'Trump declares ceasefire after 12 days of war. At least 610 Iranian and 28 Israeli dead.',
    source: 'https://en.wikipedia.org/wiki/2025%E2%80%932026_Iran%E2%80%93United_States_negotiations',
    sliders: {
      trump_war: 30,        // Pursuing ceasefire / deal
      iran_nuke: 50,        // Programme damaged but ambiguous
      iran_strait: 40,      // Strait open; tensions easing
      israel_leb: 50,       // Operations paused
      iran_regime: 42,      // Consolidated
    },
  },
  {
    date: '2025-07-02',
    label: 'Iran blocks IAEA inspectors',
    detail: 'Iran legislates to prevent IAEA inspectors accessing nuclear sites without explicit authorisation.',
    source: 'https://www.aljazeera.com/news/2026/2/28/us-israel-bomb-iran-a-timeline-of-talks-and-threats-leading-up-to-attacks',
    sliders: {
      trump_war: 40,        // Between deal-seeking and frustration
      iran_nuke: 65,        // Blocking inspections — moving toward opacity
      iran_strait: 40,      // Still open
      iran_regime: 40,      // Consolidated, assertive
    },
  },
  {
    date: '2025-08-28',
    label: 'EU reinstates UN sanctions',
    detail: 'UK, France, Germany activate snapback mechanism reinstating UN sanctions on Iran.',
    source: 'https://www.pbs.org/newshour/world/a-timeline-of-tensions-over-irans-nuclear-program-as-talks-with-u-s-approach',
    sliders: {
      trump_war: 45,        // Diplomatic pressure track
      iran_nuke: 60,        // Still blocking inspections
      iran_strait: 42,      // Strait open
      iran_regime: 45,      // Sanctions pressure building
    },
  },
  {
    date: '2025-12-28',
    label: 'Protests erupt in Iran',
    detail: 'Major protests in Tehran as rial collapses to 1.42M per USD. Economic crisis deepens.',
    source: 'https://www.pbs.org/newshour/world/a-timeline-of-tensions-over-irans-nuclear-program-as-talks-with-u-s-approach',
    sliders: {
      trump_war: 50,        // Watching and waiting
      iran_nuke: 58,        // Still opaque
      iran_strait: 42,      // Open
      iran_regime: 62,      // Significant instability — protests
    },
  },
  {
    date: '2026-01-08',
    label: 'Iran internet blackout; crackdown',
    detail: 'Internet disrupted for 2+ weeks. Security forces crack down on largest protests since 1979. Trump hints at military intervention.',
    source: 'https://www.aljazeera.com/news/2026/2/28/us-israel-bomb-iran-a-timeline-of-talks-and-threats-leading-up-to-attacks',
    sliders: {
      trump_war: 60,        // Trump hints at intervention
      iran_nuke: 58,        // No change
      iran_strait: 42,      // Still open
      iran_regime: 70,      // Major internal crisis
    },
  },
  {
    date: '2026-02-17',
    label: 'Geneva talks resume; Hormuz closed',
    detail: 'Iran and US resume talks in Geneva. Iran announces temporary Strait of Hormuz closure.',
    source: 'https://www.pbs.org/newshour/world/a-timeline-of-tensions-over-irans-nuclear-program-as-talks-with-u-s-approach',
    sliders: {
      trump_war: 45,        // Pursuing diplomacy
      iran_nuke: 55,        // Talks ongoing
      iran_strait: 80,      // Strait closed
      iran_regime: 55,      // Crackdown succeeded partially
      houthi: 55,           // Preparing
    },
  },
  {
    date: '2026-02-28',
    label: 'US & Israel strike Iran — Khamenei killed',
    detail: 'Surprise US-Israeli strikes during active negotiations. Supreme Leader Khamenei assassinated. Iran retaliates across the region. Full-scale war begins.',
    source: 'https://en.wikipedia.org/wiki/2026_Iran_war',
    sliders: {
      trump_war: 85,        // Full escalation
      iran_nuke: 65,        // Nuclear ambiguity high
      iran_strait: 90,      // Full closure
      iran_regime: 60,      // Khamenei dead, Mojtaba succeeds
      israel_leb: 80,       // Major strikes on Hezbollah
      houthi: 65,           // Mobilising
      market: 80,           // Premiums spiking
    },
  },
  {
    date: '2026-03-09',
    label: 'Trump: "war is very complete"',
    detail: 'Trump claims victory. Strait remains closed. Iran continues fighting. US prepares 15-point proposal.',
    source: 'https://en.wikipedia.org/wiki/2025%E2%80%932026_Iran%E2%80%93United_States_negotiations',
    sliders: {
      trump_war: 55,        // Between declaring victory and continuing
      iran_nuke: 65,        // Still opaque
      iran_strait: 85,      // Strait still closed
      iran_regime: 55,      // Mojtaba consolidating
      israel_leb: 75,       // Continued operations
      houthi: 60,           // Active
      market: 75,           // Elevated
    },
  },
  {
    date: '2026-03-25',
    label: 'Pakistan mediates — proposals exchanged',
    detail: 'Pakistan passes 15-point US proposal. Iran rejects it and issues 5-point counter-proposal.',
    source: 'https://en.wikipedia.org/wiki/2025%E2%80%932026_Iran%E2%80%93United_States_negotiations',
    sliders: {
      trump_war: 50,        // Negotiating
      iran_nuke: 62,        // Key sticking point
      iran_strait: 82,      // Still closed
      iran_regime: 50,      // Stabilising
      israel_leb: 70,       // Continued ops
      houthi: 55,           // Lower activity
      market: 70,           // Elevated
    },
  },
  {
    date: '2026-04-07',
    label: 'Two-week ceasefire announced',
    detail: 'US and Iran agree to two-week ceasefire via Pakistan mediation. Israel immediately strikes Lebanon. Iran warns ceasefire conditional on Lebanon.',
    source: 'https://www.nytimes.com/2026/04/07/world/middleeast/iran-war-trump-us-israel-oil-strait-of-hormuz.html',
    sliders: {
      trump_war: 35,        // Pursuing deal
      iran_nuke: 55,        // Under negotiation
      iran_strait: 70,      // Still closed but ceasefire = hope
      iran_regime: 48,      // Stabilised
      israel_leb: 75,       // Immediately struck Lebanon
      trump_leb: 60,        // Allowing Israeli ops
      houthi: 50,           // Restrained
      market: 60,           // Cautiously optimistic
    },
  },
  {
    date: '2026-04-12',
    label: 'Islamabad talks collapse; blockade',
    detail: 'Peace talks in Islamabad collapse after 21 hours. Trump announces naval blockade of Hormuz. 200+ Israeli strikes on Lebanon.',
    source: 'https://www.npr.org/2026/04/12/nx-s1-5782538/u-s-iran-peace-talks-islamabad-collapse',
    sliders: {
      trump_war: 68,
      trump_leb: 62,
      iran_nuke: 62,
      iran_strait: 72,
      iran_regime: 43,
      israel_leb: 70,
      houthi: 60,
      market: 65,
    },
  },
];

/**
 * Compute the implied scenario probabilities at each historical snapshot.
 * Returns array of { date, label, probs: Record<ScenarioId, number> }
 */
export function computeHistoricalProbabilities(): Array<{
  date: string;
  label: string;
  detail: string;
  source?: string;
  probs: Record<ScenarioId, number>;
}> {
  const baseProbs = getBaseProbs();

  return TIMELINE.map(snapshot => {
    // Build full slider state: defaults + overrides
    const fullState: Record<string, number> = {};
    for (const signal of SIGNALS) {
      fullState[signal.id] = snapshot.sliders[signal.id] ?? 50;
    }

    const probs = computeProbsFromSliders(
      fullState as Record<SignalId, number>,
      baseProbs,
    );

    return {
      date: snapshot.date,
      label: snapshot.label,
      detail: snapshot.detail,
      source: snapshot.source,
      probs,
    };
  });
}
