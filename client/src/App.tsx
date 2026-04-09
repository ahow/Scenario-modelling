import { useState, useMemo, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RotateCcw, Link2, Check } from "lucide-react";
import { SignalBoard } from "./components/SignalBoard";
import { ScenarioDisplay } from "./components/ScenarioDisplay";
import { MarketDashboard } from "./components/MarketDashboard";
import { KeyIntelligence } from "./components/KeyIntelligence";
import { CertaintyMeter } from "./components/CertaintyMeter";
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

// Parse URL state
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

// Serialize state to URL
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
  const certainty = useMemo(
    () => countDefiniteSignals(selections),
    [selections]
  );

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 28 28"
              fill="none"
              className="w-7 h-7"
              aria-label="Iran Scenario Engine"
            >
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M7 14h14M14 7v14M9.5 9.5l9 9M18.5 9.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.2"
                opacity="0.4"
              />
              <circle cx="14" cy="14" r="4" stroke="hsl(213, 60%, 42%)" strokeWidth="2" />
            </svg>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">
                Iran Conflict Scenario Engine
              </h1>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                Bayesian signal board
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <CertaintyMeter count={certainty} total={SIGNALS.length} />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={handleCopyLink}
              data-testid="button-copy-link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Share"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDark((d) => !d)}
              data-testid="button-theme"
            >
              {dark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
        <Tabs defaultValue="signals" className="w-full">
          <TabsList className="mb-4" data-testid="tab-list">
            <TabsTrigger value="signals" data-testid="tab-signals">
              Signal Board
            </TabsTrigger>
            <TabsTrigger value="markets" data-testid="tab-markets">
              Market Impact
            </TabsTrigger>
            <TabsTrigger value="intelligence" data-testid="tab-intelligence">
              Key Intelligence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signals">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
              <SignalBoard
                selections={selections}
                onSignalChange={handleSignalChange}
              />
              <div className="lg:sticky lg:top-[72px] lg:self-start">
                <ScenarioDisplay
                  currentProbs={currentProbs}
                  baselineProbs={baselineProbs}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="markets">
            <MarketDashboard
              currentProbs={currentProbs}
              weightedMarket={weightedMarket}
            />
          </TabsContent>

          <TabsContent value="intelligence">
            <KeyIntelligence selections={selections} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-3 mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <p className="text-[11px] text-muted-foreground">
            Editorial estimates — not investment advice. Base probabilities and weight matrix reflect analyst judgement as of April 2026. All market impact ranges are conditional 3–12 month estimates.
          </p>
        </div>
      </footer>
    </div>
  );
}
