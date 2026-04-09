import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ScenarioId, SCENARIOS, SCENARIO_MAP } from "../lib/config";

interface ScenarioDisplayProps {
  currentProbs: Record<ScenarioId, number>;
  baselineProbs: Record<ScenarioId, number>;
}

export const ScenarioDisplay = memo(function ScenarioDisplay({
  currentProbs,
  baselineProbs,
}: ScenarioDisplayProps) {
  // Sort scenarios by probability, highest first
  const sorted = useMemo(() => {
    return [...SCENARIOS].sort(
      (a, b) => (currentProbs[b.id] ?? 0) - (currentProbs[a.id] ?? 0)
    );
  }, [currentProbs]);

  const topProb = sorted.length > 0 ? currentProbs[sorted[0].id] : 0;

  return (
    <Card className="overflow-hidden" data-testid="scenario-display">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold">
          Scenario Probabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-2.5" role="list" aria-label="Scenario probabilities">
          {sorted.map((scenario) => {
            const prob = currentProbs[scenario.id] ?? 0;
            const baseline = baselineProbs[scenario.id] ?? 0;
            const delta = (prob - baseline) * 100;
            const pct = prob * 100;
            const isTop = scenario.id === sorted[0].id && prob > 0.22;

            return (
              <div key={scenario.id} role="listitem" data-testid={`scenario-${scenario.id}`}>
                <div className="flex items-baseline justify-between mb-1 gap-1">
                  <span className="text-[13px] font-medium truncate min-w-0">
                    {scenario.name}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-shrink-0">
                    {isTop && (
                      <Badge
                        variant="outline"
                        className="text-[9px] h-[18px] px-1 border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/30"
                      >
                        Top
                      </Badge>
                    )}
                    <DeltaBadge delta={delta} />
                    <span className="text-[13px] font-semibold tabular-nums">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm bar-animate"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: scenario.color,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  {scenario.shortDesc}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.5) {
    return (
      <span className="text-[11px] text-muted-foreground/50 tabular-nums w-12 text-right">
        —
      </span>
    );
  }

  // Red for increases (more risk), green for decreases (less risk)
  const isUp = delta > 0;
  const color = isUp
    ? "text-red-600 dark:text-red-400"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <span className={`text-[11px] font-medium tabular-nums w-12 text-right ${color}`}>
      {isUp ? "+" : ""}
      {delta.toFixed(1)}pp
    </span>
  );
}
