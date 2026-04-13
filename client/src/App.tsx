import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RotateCcw, Link2, Check, Cpu } from "lucide-react";
import { SchrodersLogo } from "./components/SchrodersLogo";
import { MarketStrip } from "./components/MarketStrip";
import { ScenarioBar } from "./components/ScenarioBar";
import { DecisionCard, type AnchorMarker } from "./components/DecisionCard";
import { NarrativePanel } from "./components/NarrativePanel";
import { ScenarioDrawer } from "./components/ScenarioDrawer";
import { BriefingPanel } from "./components/BriefingPanel";
import { ScenarioProbChart } from "./components/ScenarioProbChart";
import { HistoryChart } from "./components/HistoryChart";
import { MarketImpactChart } from "./components/MarketImpactChart";
import { HistoryMarketChart } from "./components/HistoryMarketChart";
import {
  type SignalId,
  type ScenarioId,
  SIGNALS,
  SIGNAL_MAP,
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

export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  // Default to briefing positions (not neutral midpoints)
  const briefingAnchorsInit = getBriefingAnchors();
  const [states, setStates] = useState<AllSignalStates>(() =>
    getBriefingDefaultStates(briefingAnchorsInit)
  );
  const [copied, setCopied] = useState(false);
  const [drawerScenario, setDrawerScenario] = useState<ScenarioId | null>(null);
  const [autoCompute, setAutoCompute] = useState(true);
  const [lockedSignals, setLockedSignals] = useState<Set<SignalId>>(new Set());
  const [polymarketData, setPolymarketData] = useState<PolymarketMapping[]>([]);

  // Fetch Polymarket data on mount
  useEffect(() => {
    fetchPolymarketData().then(setPolymarketData).catch(() => {});
  }, []);

  // Auto-compute endogenous signals when exogenous ones change
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

    if (hasChanges) {
      setStates(newStates);
    }
  }, [
    autoCompute,
    lockedSignals,
    // Only re-run when exogenous signals change
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

  // Briefing data
  const briefing = useMemo(() => getCurrentBriefing(), []);
  const briefingAnchors = useMemo(() => getBriefingAnchors(), []);
  const briefingAge = useMemo(() => getBriefingAge(), []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handlePositionChange = useCallback(
    (signalId: SignalId, position: number) => {
      // If this is an endogenous signal being manually changed, auto-lock it
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
      if (next.has(signalId)) {
        next.delete(signalId);
      } else {
        next.add(signalId);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    // Reset to briefing positions (the informed default), not neutral midpoints
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
    if (!autoCompute) {
      // Re-enabling: unlock all endogenous signals
      setLockedSignals(new Set());
    }
  }, [autoCompute]);

  const handleCopyLink = useCallback(() => {
    const encoded = btoa(JSON.stringify(states));
    const url = `${window.location.origin}${window.location.pathname}#/?s=${encodeURIComponent(encoded)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [states]);

  // Build anchor markers for each signal
  const getAnchor = useCallback(
    (signalId: SignalId): AnchorMarker | undefined => {
      // Priority: Polymarket > Briefing
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

  // Actor groups for rendering
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--sch-border)] bg-white dark:bg-[hsl(var(--card))] dark:border-border">
        <div className="max-w-[1104px] mx-auto px-4 sm:px-6">
          {/* Top row: title + Schroders logo */}
          <div className="flex items-center justify-between pt-3 pb-1">
            <h1 className="font-heading text-[22px] sm:text-[26px] font-bold tracking-tight text-[var(--sch-navy)] dark:text-foreground">
              Scenario Engine: Iran Conflict
            </h1>
            <SchrodersLogo className="h-5 sm:h-6 w-auto text-[var(--sch-navy)] dark:text-foreground flex-shrink-0 ml-6" />
          </div>

          {/* Toolbar row: controls + market strip */}
          <div className="flex items-center justify-between pb-2 gap-3">
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant={autoCompute ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-2 text-[11px] gap-1 ${autoCompute ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''}`}
                onClick={handleToggleAutoCompute}
                title="Auto-compute: when enabled, reactive decisions (China, Houthis, Markets) update automatically based on your other settings"
                data-testid="button-auto-compute"
              >
                <Cpu className="w-3 h-3" />
                <span className="hidden sm:inline">Auto</span>
              </Button>
              <div
                className="hidden sm:flex items-center gap-1.5 ml-1 px-2 py-1 rounded-md bg-muted/50"
                title={`Signal coverage: ${movedCount} of ${SIGNALS.length} decision signals have been set (moved from neutral position)`}
              >
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
                  {movedCount}/{SIGNALS.length}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1" onClick={handleCopyLink} data-testid="button-copy-link">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Link2 className="w-3 h-3" />}
                {copied ? "Copied" : "Share"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1" onClick={handleReset} data-testid="button-reset">
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDark((d) => !d)} data-testid="button-theme">
                {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <MarketStrip weightedMarket={weightedMarket} />
          </div>
        </div>
      </header>

      {/* Briefing Panel */}
      <div className="max-w-[1104px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <BriefingPanel
          briefing={briefing}
          briefingAge={briefingAge}
          onApplyEstimates={handleApplyBriefingEstimates}
        />
      </div>

      {/* Scenario probability chart + bar */}
      <div className="max-w-[1104px] mx-auto px-4 sm:px-6 pt-3 pb-2 space-y-3">
        {/* Prominent probability distribution chart */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-4 sch-accent-bar">
            Probability Distribution
          </h3>
          <ScenarioProbChart
            currentProbs={currentProbs}
            baselineProbs={baselineProbs}
          />
        </div>

        {/* Scenario bar (compact) */}
        <ScenarioBar
          currentProbs={currentProbs}
          baselineProbs={baselineProbs}
          onScenarioClick={setDrawerScenario}
        />

        {/* Historical scenario probabilities timeline */}
        <HistoryChart />
      </div>

      {/* Main content: narrative + decisions */}
      <main className="max-w-[1104px] mx-auto px-4 sm:px-6 pb-8">
        {/* Narrative panel */}
        <div className="mb-4">
          <NarrativePanel
            scenarioNarrative={narrative.scenarioNarrative}
            marketNarrative={narrative.marketNarrative}
            topScenarios={narrative.topScenarios}
            weightedMarket={weightedMarket}
            setCount={movedCount}
          />
        </div>

        {/* Market impact range chart — outcome variable distributions */}
        <div className="mb-4 border border-border bg-card p-5">
          <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-4 sch-accent-bar">
            Market Impact — Outcome Distributions
          </h3>
          <MarketImpactChart
            currentProbs={currentProbs}
            weightedMarket={weightedMarket}
          />
        </div>

        {/* Historical market outcomes timeline */}
        <div className="mb-4">
          <HistoryMarketChart />
        </div>

        {/* Decisions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground sch-accent-bar">
            Key Decisions — Spectrum Assessment
          </h2>
        </div>

        <div className="mb-4 p-4 bg-[var(--sch-light-bg)] dark:bg-muted/50 border border-border text-[12px] text-muted-foreground leading-relaxed space-y-1.5">
          <p>
            Each decision point is represented as a spectrum between two opposing outcomes.
            Drag the slider toward the pole you believe is more likely — the further you move it,
            the stronger that signal's influence on the scenario probabilities.
          </p>
          <p>
            <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rotate-45 bg-blue-500 inline-block" /> Diamond markers</span> show
            quantitative best-estimate anchors from prediction markets or news analysis.
            <span className="inline-flex items-center gap-1 ml-1"><Cpu className="w-3 h-3 inline" /> Auto</span> decisions
            are computed from other inputs using reaction functions — click the lock icon to override.
          </p>
          <p className="text-muted-foreground/70">
            Editorial estimates — not investment advice. Base probabilities and weights reflect analyst judgement as of April 2026.
          </p>
        </div>

        <div className="space-y-3">
          {/* Exogenous decisions first */}
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

          {/* Endogenous decisions section */}
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

        {/* Methodology */}
        <div className="mt-8 p-4 bg-[var(--sch-light-bg)] dark:bg-muted/50 border border-border text-[12px] text-muted-foreground leading-relaxed space-y-1.5">
          <h3 className="text-xs font-heading font-semibold uppercase tracking-wider mb-2 sch-accent-bar">Methodology</h3>
          <p>
            The engine uses a three-stage computation pipeline: (1) each slider position is converted
            to interpolated option weights via piecewise linear interpolation between 2 or 3 anchor points;
            (2) these weights are applied to a 9×8 weight matrix to shift scenario base probabilities,
            then floored at 0.2% and normalised; (3) probability-weighted asset ranges are computed
            for each outcome variable.
          </p>
          <p>
            Endogenous (reactive) decisions use weighted reaction functions to auto-position based
            on exogenous inputs. The system iterates twice to resolve dependencies. Quantitative
            anchors come from Polymarket prediction markets (Tier 2) or news-derived briefing
            estimates (Tier 3). All weights, probabilities, and ranges are editorial estimates.
          </p>
        </div>
      </main>

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
