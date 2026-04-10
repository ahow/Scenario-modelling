import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RotateCcw, Link2, Check } from "lucide-react";
import { MarketStrip } from "./components/MarketStrip";
import { ScenarioBar } from "./components/ScenarioBar";
import { DecisionCard } from "./components/DecisionCard";
import { NarrativePanel } from "./components/NarrativePanel";
import { ScenarioDrawer } from "./components/ScenarioDrawer";
import {
  type SignalId,
  type ScenarioId,
  SIGNALS,
} from "./lib/config";
import {
  type AllSignalStates,
  type SignalState,
  computeProbsFromDistributions,
  getBaseProbs,
  getDefaultStates,
  countSetSignals,
  computeWeightedMarket,
  generateNarrative,
} from "./lib/engine";

export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [states, setStates] = useState<AllSignalStates>(() => getDefaultStates());
  const [copied, setCopied] = useState(false);
  const [drawerScenario, setDrawerScenario] = useState<ScenarioId | null>(null);

  const baseProbs = useMemo(() => getBaseProbs(), []);
  const baselineProbs = useMemo(
    () => computeProbsFromDistributions(getDefaultStates(), baseProbs),
    [baseProbs]
  );
  const currentProbs = useMemo(
    () => computeProbsFromDistributions(states, baseProbs),
    [states, baseProbs]
  );
  const weightedMarket = useMemo(
    () => computeWeightedMarket(currentProbs),
    [currentProbs]
  );
  const setCount = useMemo(() => countSetSignals(states), [states]);

  const narrative = useMemo(
    () => generateNarrative(currentProbs, weightedMarket, states),
    [currentProbs, weightedMarket, states]
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleStateChange = useCallback(
    (signalId: SignalId, state: SignalState) => {
      setStates((prev) => ({ ...prev, [signalId]: state }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setStates(getDefaultStates());
  }, []);

  const handleCopyLink = useCallback(() => {
    // Serialize state to URL for sharing
    const encoded = btoa(JSON.stringify(states));
    const url = `${window.location.origin}${window.location.pathname}#/?s=${encodeURIComponent(encoded)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [states]);

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
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="h-11 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" aria-label="Logo">
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="4" stroke="hsl(213, 60%, 42%)" strokeWidth="2" />
                <path d="M12 1v22M1 12h22" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
              </svg>
              <h1 className="text-sm font-semibold tracking-tight">
                Iran Conflict Scenario Engine
              </h1>
            </div>
            <div className="flex items-center gap-1">
              {/* Certainty indicator */}
              <div className="hidden sm:flex items-center gap-1.5 mr-1.5 px-2 py-1 rounded-md bg-muted/50">
                <div className="flex gap-0.5">
                  {Array.from({ length: SIGNALS.length }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-sm transition-colors ${
                        i < setCount ? "bg-[hsl(var(--primary))]" : "bg-muted-foreground/15"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {setCount}/{SIGNALS.length}
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
          </div>
          <MarketStrip weightedMarket={weightedMarket} />
        </div>
      </header>

      {/* Scenario bar */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <ScenarioBar
          currentProbs={currentProbs}
          baselineProbs={baselineProbs}
          onScenarioClick={setDrawerScenario}
        />
      </div>

      {/* Main content: narrative + decisions */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-8">
        {/* Narrative panel */}
        <div className="mb-4">
          <NarrativePanel
            scenarioNarrative={narrative.scenarioNarrative}
            marketNarrative={narrative.marketNarrative}
            topScenarios={narrative.topScenarios}
            weightedMarket={weightedMarket}
            setCount={setCount}
          />
        </div>

        {/* Decisions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key Decisions — Probability Assessment
          </h2>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-[12px] text-muted-foreground leading-relaxed space-y-1.5">
          <p>
            For each decision point, toggle from "Unknown" to "Active" to engage the probability sliders.
            Assign your probability estimate to each possible option — the sliders automatically sum to 100%.
          </p>
          <p>
            The engine computes expected scenario probabilities by weighting each option's impact by
            your assigned probability, then propagates through to probability-weighted market outcomes.
            The narrative synthesises the most likely path and its market consequences.
          </p>
          <p className="text-muted-foreground/70">
            Editorial estimates — not investment advice. Base probabilities and weights reflect analyst judgement as of April 2026.
          </p>
        </div>

        <div className="space-y-3">
          {actorGroups.map((group) => (
            <div key={group.actor} className="space-y-3">
              {group.signals.map((signal) => (
                <DecisionCard
                  key={signal.id}
                  signal={signal}
                  state={states[signal.id]}
                  onStateChange={handleStateChange}
                />
              ))}
            </div>
          ))}
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
