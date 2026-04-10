import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RotateCcw, Link2, Check, Info } from "lucide-react";
import { MarketStrip } from "./components/MarketStrip";
import { ScenarioBar } from "./components/ScenarioBar";
import { DecisionCard } from "./components/DecisionCard";
import { ScenarioDrawer } from "./components/ScenarioDrawer";
import {
  type SignalId,
  type ScenarioId,
  SIGNALS,
} from "./lib/config";
import {
  computeProbs,
  getBaseProbs,
  countDefiniteSignals,
  computeWeightedMarket,
} from "./lib/engine";

function getDefaultSelections(): Record<SignalId, string> {
  return Object.fromEntries(
    SIGNALS.map((s) => [s.id, s.defaultValue])
  ) as Record<SignalId, string>;
}

function parseUrlState(): Record<SignalId, string> | null {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  if (params.toString() === "") return null;
  const selections = getDefaultSelections();
  for (const [key, value] of params.entries()) {
    if (key in selections) {
      (selections as any)[key] = value;
    }
  }
  return selections;
}

function serializeState(selections: Record<SignalId, string>): string {
  const defaults = getDefaultSelections();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(selections)) {
    if (value !== defaults[key as SignalId]) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${window.location.origin}${window.location.pathname}#/?${qs}` : window.location.href.split("?")[0];
}

export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [selections, setSelections] = useState<Record<SignalId, string>>(
    () => parseUrlState() || getDefaultSelections()
  );
  const [copied, setCopied] = useState(false);
  const [drawerScenario, setDrawerScenario] = useState<ScenarioId | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  const baseProbs = useMemo(() => getBaseProbs(), []);
  const baselineProbs = useMemo(
    () => computeProbs(getDefaultSelections(), baseProbs),
    [baseProbs]
  );
  const currentProbs = useMemo(
    () => computeProbs(selections, baseProbs),
    [selections, baseProbs]
  );
  const weightedMarket = useMemo(
    () => computeWeightedMarket(currentProbs),
    [currentProbs]
  );
  const certainty = countDefiniteSignals(selections);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSignalChange = useCallback(
    (signalId: SignalId, value: string) => {
      setSelections((prev) => ({ ...prev, [signalId]: value }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setSelections(getDefaultSelections());
  }, []);

  const handleCopyLink = useCallback(() => {
    const url = serializeState(selections);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [selections]);

  // Group signals by actor for compact display
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
          {/* Title row */}
          <div className="h-11 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" aria-label="Logo">
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="4" stroke="hsl(213, 60%, 42%)" strokeWidth="2" />
                <path d="M12 1v22M1 12h22" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
              </svg>
              <div>
                <h1 className="text-sm font-semibold tracking-tight leading-none">
                  Iran Conflict Scenario Engine
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Certainty indicator */}
              <div className="hidden sm:flex items-center gap-1.5 mr-1.5 px-2 py-1 rounded-md bg-muted/50">
                <div className="flex gap-0.5">
                  {Array.from({ length: SIGNALS.length }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-sm transition-colors ${
                        i < certainty ? "bg-[hsl(var(--primary))]" : "bg-muted-foreground/15"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {certainty}/{SIGNALS.length}
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

          {/* Market impact strip — always visible */}
          <MarketStrip weightedMarket={weightedMarket} />
        </div>
      </header>

      {/* Scenario probability bar */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <ScenarioBar
          currentProbs={currentProbs}
          baselineProbs={baselineProbs}
          onScenarioClick={setDrawerScenario}
        />
      </div>

      {/* Decision cards */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-8">
        <div className="flex items-center justify-between mb-3 mt-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key Decisions
          </h2>
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setShowMethodology((v) => !v)}
            data-testid="button-methodology"
          >
            <Info className="w-3 h-3" />
            {showMethodology ? "Hide" : "How it works"}
          </button>
        </div>

        {showMethodology && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-[12px] text-muted-foreground leading-relaxed space-y-1.5">
            <p>
              Each decision adjusts the probability of 8 conflict scenarios using an additive Bayesian weight matrix.
              The market impact strip shows probability-weighted expected values across all scenarios.
            </p>
            <p>
              Select the option you believe matches current intelligence for each decision point.
              "Unknown" leaves the prior probabilities unchanged. The more decisions you set, the more
              the model diverges from the baseline.
            </p>
            <p className="text-muted-foreground/70">
              Editorial estimates — not investment advice. Base probabilities and weights reflect analyst judgement as of April 2026.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {actorGroups.map((group) => (
            <div key={group.actor} className="space-y-3">
              {group.signals.map((signal) => (
                <DecisionCard
                  key={signal.id}
                  signal={signal}
                  selectedValue={selections[signal.id]}
                  onSelect={(value) => handleSignalChange(signal.id, value)}
                  currentProbs={currentProbs}
                  baseProbs={baseProbs}
                  allSelections={selections}
                />
              ))}
            </div>
          ))}
        </div>
      </main>

      {/* Scenario detail drawer */}
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
