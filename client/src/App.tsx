import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RotateCcw, Cpu } from "lucide-react";
import { SchrodersLogo } from "./components/SchrodersLogo";
import { MarketStrip } from "./components/MarketStrip";
import { ScenarioBar } from "./components/ScenarioBar";
import { DecisionCard, type AnchorMarker } from "./components/DecisionCard";
import { NarrativePanel } from "./components/NarrativePanel";
import { ScenarioDrawer } from "./components/ScenarioDrawer";
import { BriefingPanel } from "./components/BriefingPanel";
import { ScenarioProbChart } from "./components/ScenarioProbChart";
import { MarketImpactChart } from "./components/MarketImpactChart";
import {
  type SignalId,
  type ScenarioId,
  SIGNALS,
  SIGNAL_MAP,
  SCENARIOS,
  SCENARIO_MAP,
} from "./lib/config";
import {
  type AllSignalStates,
  computeProbsFromSliders,
  getBaseProbs,
  getDefaultStates,
  getBriefingDefaultStates,
  countMovedSignals,
  computeWeightedMarket,
  generateNarrative,
} from "./lib/engine";
import {
  getCurrentBriefing,
  getBriefingAnchors,
  getBriefingAge,
} from "./lib/briefing";
import {
  fetchPolymarketData,
  getPolymarketAnchor,
  type PolymarketMapping,
} from "./lib/polymarket";
import {
  ENDOGENOUS_SIGNALS,
  isEndogenous,
  computeAllEndogenous,
  getReactionFunction,
} from "./lib/endogenous";

type TabId = 'decisions' | 'results' | 'about';

export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [activeTab, setActiveTab] = useState<TabId>('results');

  const briefingAnchorsInit = getBriefingAnchors();
  const [states, setStates] = useState<AllSignalStates>(() =>
    getBriefingDefaultStates(briefingAnchorsInit)
  );
  const [drawerScenario, setDrawerScenario] = useState<ScenarioId | null>(null);
  const [autoCompute, setAutoCompute] = useState(true);
  const [lockedSignals, setLockedSignals] = useState<Set<SignalId>>(new Set());
  const [polymarketData, setPolymarketData] = useState<PolymarketMapping[]>([]);

  useEffect(() => {
    fetchPolymarketData().then(setPolymarketData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!autoCompute) return;
    const endogenousPositions = computeAllEndogenous(states);
    let hasChanges = false;
    const newStates = { ...states };
    for (const [signalId, position] of Object.entries(endogenousPositions)) {
      if (lockedSignals.has(signalId as SignalId)) continue;
      if (newStates[signalId as SignalId] !== position) {
        newStates[signalId as SignalId] = position as number;
        hasChanges = true;
      }
    }
    if (hasChanges) setStates(newStates);
  }, [
    autoCompute,
    lockedSignals,
    ...SIGNALS.filter(s => !ENDOGENOUS_SIGNALS.includes(s.id)).map(s => states[s.id]),
  ]);

  const baseProbs = useMemo(() => getBaseProbs(), []);
  const baselineProbs = useMemo(
    () => computeProbsFromSliders(getDefaultStates(), baseProbs),
    [baseProbs]
  );
  const currentProbs = useMemo(
    () => computeProbsFromSliders(states, baseProbs),
    [states, baseProbs]
  );
  const weightedMarket = useMemo(
    () => computeWeightedMarket(currentProbs),
    [currentProbs]
  );
  const movedCount = useMemo(() => countMovedSignals(states), [states]);
  const narrative = useMemo(
    () => generateNarrative(currentProbs, weightedMarket, states),
    [currentProbs, weightedMarket, states]
  );

  const briefing = useMemo(() => getCurrentBriefing(), []);
  const briefingAnchors = useMemo(() => getBriefingAnchors(), []);
  const briefingAge = useMemo(() => getBriefingAge(), []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handlePositionChange = useCallback(
    (signalId: SignalId, position: number) => {
      if (isEndogenous(signalId) && !lockedSignals.has(signalId)) {
        setLockedSignals(prev => new Set([...prev, signalId]));
      }
      setStates((prev) => ({ ...prev, [signalId]: position }));
    },
    [lockedSignals]
  );

  const handleToggleLock = useCallback((signalId: SignalId) => {
    setLockedSignals(prev => {
      const next = new Set(prev);
      if (next.has(signalId)) next.delete(signalId);
      else next.add(signalId);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setStates(getBriefingDefaultStates(briefingAnchors));
    setLockedSignals(new Set());
  }, [briefingAnchors]);

  const handleApplyBriefingEstimates = useCallback(() => {
    const newStates = { ...states };
    for (const shift of briefing.sliderShifts) {
      if (!isEndogenous(shift.signalId) || lockedSignals.has(shift.signalId)) {
        newStates[shift.signalId] = shift.newEstimate;
      }
    }
    setStates(newStates as AllSignalStates);
  }, [states, briefing.sliderShifts, lockedSignals]);

  const handleToggleAutoCompute = useCallback(() => {
    setAutoCompute(prev => !prev);
    if (!autoCompute) setLockedSignals(new Set());
  }, [autoCompute]);

  const getAnchor = useCallback(
    (signalId: SignalId): AnchorMarker | undefined => {
      const pm = getPolymarketAnchor(polymarketData, signalId);
      if (pm) {
        return {
          position: pm.impliedPosition,
          source: 'Polymarket',
          tooltip: pm.reasoning,
          tier: 2,
        };
      }
      const briefingPos = briefingAnchors[signalId];
      if (briefingPos !== undefined && briefingPos !== 50) {
        const shift = briefing.sliderShifts.find(s => s.signalId === signalId);
        return {
          position: briefingPos,
          source: 'Briefing',
          tooltip: shift?.reasoning || 'Based on news analysis',
          tier: 3,
        };
      }
      return undefined;
    },
    [polymarketData, briefingAnchors, briefing.sliderShifts]
  );

  const actorGroups = useMemo(() => {
    const groups: Array<{ actor: string; actorColor: string; signals: typeof SIGNALS }> = [];
    const seen = new Set<string>();
    for (const signal of SIGNALS) {
      if (!seen.has(signal.actor)) {
        seen.add(signal.actor);
        groups.push({
          actor: signal.actor,
          actorColor: signal.actorColor,
          signals: SIGNALS.filter((s) => s.actor === signal.actor),
        });
      }
    }
    return groups;
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'decisions', label: 'Decisions' },
    { id: 'results', label: 'Results' },
    { id: 'about', label: 'How It Works' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--sch-border)] bg-white dark:bg-[hsl(var(--card))] dark:border-border">
        <div className="max-w-[1104px] mx-auto px-4 sm:px-6">
          {/* Top row: title + logo */}
          <div className="flex items-center justify-between pt-3 pb-1">
            <h1 className="font-heading text-[22px] sm:text-[26px] font-bold tracking-tight text-[var(--sch-navy)] dark:text-foreground">
              Scenario Engine: Iran Conflict
            </h1>
            <SchrodersLogo className="h-5 sm:h-6 w-auto text-[var(--sch-navy)] dark:text-foreground flex-shrink-0 ml-6" />
          </div>

          {/* Tab bar + controls */}
          <div className="flex items-center justify-between pb-0 gap-3">
            {/* Tabs */}
            <div className="flex gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--sch-blue)] text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1" onClick={handleReset}>
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDark((d) => !d)}>
                {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== TAB: DECISIONS ===== */}
      {activeTab === 'decisions' && (
        <main className="max-w-[1104px] mx-auto px-4 sm:px-6 pb-8">
          {/* Briefing — collapsed by default */}
          <div className="pt-4 pb-2">
            <BriefingPanel
              briefing={briefing}
              briefingAge={briefingAge}
              onApplyEstimates={handleApplyBriefingEstimates}
            />
          </div>

          {/* Brief instructions */}
          <div className="mb-4 p-3 bg-[var(--sch-light-bg)] dark:bg-muted/50 border border-border text-[12px] text-muted-foreground leading-relaxed">
            <p>
              Drag each slider toward the outcome you think is more likely.
              The further you move it, the stronger that signal's influence on the results.
              <span className="inline-flex items-center gap-0.5 mx-1"><span className="w-2 h-2 rotate-45 bg-blue-500 inline-block" /> Diamonds</span>
              show prediction market or news-derived estimates.
              <span className="inline-flex items-center gap-1 mx-1"><Cpu className="w-3 h-3 inline" /> Auto</span>
              decisions update automatically — click the lock to override.
            </p>
          </div>

          {/* Auto-compute toggle */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant={autoCompute ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2 text-[11px] gap-1 ${autoCompute ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''}`}
              onClick={handleToggleAutoCompute}
              title="Auto-compute reactive decisions based on your other settings"
            >
              <Cpu className="w-3 h-3" />
              Auto-compute reactive decisions
            </Button>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <div className="flex gap-0.5">
                {Array.from({ length: SIGNALS.length }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-3 rounded-sm transition-colors ${
                      i < movedCount ? "bg-[hsl(var(--primary))]" : "bg-muted-foreground/15"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {movedCount}/{SIGNALS.length} set
              </span>
            </div>
          </div>

          {/* Exogenous decisions */}
          <div className="space-y-3">
            {actorGroups.map((group) => (
              <div key={group.actor} className="space-y-3">
                {group.signals
                  .filter(s => !isEndogenous(s.id))
                  .map((signal) => (
                    <DecisionCard
                      key={signal.id}
                      signal={signal}
                      position={states[signal.id]}
                      onPositionChange={handlePositionChange}
                      anchor={getAnchor(signal.id)}
                    />
                  ))}
              </div>
            ))}

            {/* Endogenous decisions */}
            {ENDOGENOUS_SIGNALS.some(() => true) && (
              <>
                <div className="flex items-center gap-2 mt-4 mb-1">
                  <h2 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground sch-accent-bar">
                    Reactive Decisions — Auto-Computed
                  </h2>
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    {autoCompute ? 'Model-driven' : 'Manual mode'}
                  </span>
                </div>
                <div className="space-y-3">
                  {ENDOGENOUS_SIGNALS.map((signalId) => {
                    const signal = SIGNAL_MAP[signalId];
                    const rf = getReactionFunction(signalId);
                    const driversText = rf
                      ? `Driven by: ${rf.drivers.map(d => d.description).join(', ')}`
                      : undefined;
                    return (
                      <DecisionCard
                        key={signalId}
                        signal={signal}
                        position={states[signalId]}
                        onPositionChange={handlePositionChange}
                        anchor={getAnchor(signalId)}
                        isEndogenous={autoCompute}
                        isLocked={lockedSignals.has(signalId)}
                        onToggleLock={handleToggleLock}
                        endogenousLabel={rf?.label}
                        reactionDrivers={driversText}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* CTA to view results */}
          <div className="mt-6 text-center">
            <Button
              onClick={() => setActiveTab('results')}
              className="px-6 py-2 rounded-[10px] bg-[var(--sch-blue)] hover:bg-[var(--sch-navy)] text-white text-sm font-medium"
            >
              View Results →
            </Button>
          </div>
        </main>
      )}

      {/* ===== TAB: RESULTS ===== */}
      {activeTab === 'results' && (
        <main className="max-w-[1104px] mx-auto px-4 sm:px-6 pb-8">
          {/* Market strip summary */}
          <div className="pt-3 pb-2 border-b border-border/30 mb-4">
            <MarketStrip weightedMarket={weightedMarket} />
          </div>

          {/* Scenario Outlook — at the top */}
          <div className="mb-4">
            <NarrativePanel
              scenarioNarrative={narrative.scenarioNarrative}
              marketNarrative={narrative.marketNarrative}
              topScenarios={narrative.topScenarios}
              weightedMarket={weightedMarket}
              setCount={movedCount}
            />
          </div>

          {/* Probability Distribution */}
          <div className="mb-4 border border-border bg-card p-5">
            <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-4 sch-accent-bar">
              Probability Distribution
            </h3>
            <ScenarioProbChart
              currentProbs={currentProbs}
              baselineProbs={baselineProbs}
            />
          </div>

          {/* Scenario bar (compact) */}
          <div className="mb-4">
            <ScenarioBar
              currentProbs={currentProbs}
              baselineProbs={baselineProbs}
              onScenarioClick={setDrawerScenario}
            />
          </div>

          {/* Market impact distributions */}
          <div className="mb-4 border border-border bg-card p-5">
            <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-4 sch-accent-bar">
              Market Impact — Outcome Distributions
            </h3>
            <MarketImpactChart
              currentProbs={currentProbs}
              weightedMarket={weightedMarket}
            />
          </div>

          {/* CTA to adjust decisions */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setActiveTab('decisions')}
              className="px-6 py-2 rounded-[10px] text-sm font-medium"
            >
              ← Adjust Decisions
            </Button>
          </div>
        </main>
      )}

      {/* ===== TAB: HOW IT WORKS ===== */}
      {activeTab === 'about' && (
        <main className="max-w-[1104px] mx-auto px-4 sm:px-6 pb-8 pt-6">
          <div className="space-y-6">
            {/* Overview */}
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-2 sch-accent-bar">
                What is this?
              </h2>
              <p className="text-[14px] leading-relaxed text-foreground/90">
                This tool helps you think through the Iran conflict by modelling how different
                decisions by key actors lead to different outcomes. Rather than predicting a
                single future, it shows you the range of possibilities and their relative
                likelihoods based on your assumptions.
              </p>
            </section>

            {/* How to use */}
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-2 sch-accent-bar">
                How to use it
              </h2>
              <div className="space-y-3 text-[14px] leading-relaxed text-foreground/90">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--sch-blue)] text-white flex items-center justify-center text-[13px] font-bold">1</span>
                  <div>
                    <strong>Set your assumptions</strong> in the Decisions tab. Each slider represents
                    a key decision by a major actor (Trump, Iran, Israel, China, Houthis). Drag it toward
                    the outcome you believe is more likely.
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--sch-blue)] text-white flex items-center justify-center text-[13px] font-bold">2</span>
                  <div>
                    <strong>View the results</strong> in the Results tab. You'll see which scenarios become
                    more or less probable, a narrative outlook, and expected market impacts across
                    seven asset classes.
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--sch-blue)] text-white flex items-center justify-center text-[13px] font-bold">3</span>
                  <div>
                    <strong>Explore alternatives.</strong> Change your assumptions and see how the
                    outlook shifts. The tool is designed for "what if" analysis — try different
                    combinations to understand which decisions matter most.
                  </div>
                </div>
              </div>
            </section>

            {/* Scenarios */}
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-2 sch-accent-bar">
                The eight scenarios
              </h2>
              <p className="text-[14px] leading-relaxed text-foreground/90 mb-3">
                The model considers eight possible end-states, each representing a distinct
                equilibrium. Probabilities are normalised to sum to 100% — this is a modelling
                simplification that forces a ranking, not a claim that outcomes are perfectly
                mutually exclusive. In practice, reality may blend features of multiple scenarios.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCENARIOS.map(s => {
                  return (
                    <div key={s.id} className="flex gap-2 p-3 bg-muted/30 border border-border/30 rounded-sm">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" style={{ backgroundColor: s.color }} />
                      <div>
                        <div className="text-[13px] font-semibold">{s.name}</div>
                        <div className="text-[12px] text-muted-foreground leading-relaxed">{s.tooltipDesc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Methodology */}
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-2 sch-accent-bar">
                Methodology
              </h2>
              <div className="space-y-2 text-[14px] leading-relaxed text-foreground/90">
                <p>
                  The engine uses a three-stage computation:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Each slider position is converted to interpolated weights via piecewise linear
                    interpolation between 2 or 3 anchor points.
                  </li>
                  <li>
                    These weights are applied to a 9×8 weight matrix that shifts scenario base
                    probabilities, which are then floored at 0.2% and normalised to sum to 100%.
                  </li>
                  <li>
                    Probability-weighted asset ranges are computed for each of the seven output
                    variables across all scenarios.
                  </li>
                </ol>
                <p>
                  Three of the nine decisions (China's diplomatic pressure, Houthi Red Sea posture,
                  and insurance premiums) are "reactive" — by default, the model auto-computes
                  their positions based on the other six decisions using weighted reaction functions.
                  You can override these by clicking the lock icon.
                </p>
                <p>
                  Quantitative anchors come from Polymarket prediction markets (where available)
                  or news-derived briefing estimates. The news briefing panel provides the latest
                  intelligence assessment with source links.
                </p>
              </div>
            </section>

            {/* Output variables */}
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-2 sch-accent-bar">
                Output variables
              </h2>
              <p className="text-[14px] leading-relaxed text-foreground/90 mb-3">
                The model estimates 3–12 month expected outcomes for seven asset classes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>Brent Crude</strong> — absolute price level ($/bbl). The most directly
                  affected asset given Hormuz disruption scenarios.
                </div>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>Gold</strong> — absolute price level ($/oz). Safe-haven and inflation-hedge
                  demand driver.
                </div>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>Global Government Bonds</strong> — total return %. Reflects the
                  flight-to-quality vs. inflation trade-off.
                </div>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>Global Corporate Credit</strong> — excess return vs. govs %. Reflects
                  credit spread moves under stress.
                </div>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>DM Equities</strong> — total return % (MSCI World proxy). Captures
                  the risk-off impact of energy disruption.
                </div>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>EM Equities</strong> — total return % (MSCI EM proxy). Typically hit
                  harder by geopolitical risk and USD strength.
                </div>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-sm">
                  <strong>USD Basket</strong> — % change (DXY proxy). Tends to strengthen on
                  geopolitical stress as a safe-haven currency.
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="border-t border-border pt-4">
              <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
                All probabilities, weights, and market impact ranges are editorial estimates
                informed by analyst judgement as of April 2026. This tool is designed for
                scenario analysis and structured thinking — it is not investment advice,
                a forecast, or a recommendation. Base probabilities and weight matrices may
                not fully capture tail risks or non-linear dynamics. Use alongside, not
                instead of, your own analysis.
              </p>
            </section>
          </div>
        </main>
      )}

      {/* Scenario drawer */}
      {drawerScenario && (
        <ScenarioDrawer
          scenarioId={drawerScenario}
          currentProbs={currentProbs}
          baselineProbs={baselineProbs}
          onClose={() => setDrawerScenario(null)}
        />
      )}
    </div>
  );
}
