import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  type Signal,
  type SignalId,
  type ScenarioId,
  SCENARIOS,
  SCENARIO_MAP,
  ASSETS,
  WEIGHTS,
} from "../lib/config";
import { computeProbs, computeWeightedMarket } from "../lib/engine";

interface DecisionCardProps {
  signal: Signal;
  selectedValue: string;
  onSelect: (value: string) => void;
  currentProbs: Record<ScenarioId, number>;
  baseProbs: Record<ScenarioId, number>;
  allSelections: Record<SignalId, string>;
}

export const DecisionCard = memo(function DecisionCard({
  signal,
  selectedValue,
  onSelect,
  currentProbs,
  baseProbs,
  allSelections,
}: DecisionCardProps) {
  const isSet = selectedValue !== "unknown";

  // Compute the impact preview: what happens if you pick each non-unknown option vs. unknown
  const impactPreview = useMemo(() => {
    if (!isSet) return null;

    // Current state (with this signal set)
    const withSignal = computeProbs(allSelections, baseProbs);
    // State without this signal (set to unknown)
    const withoutSignal = computeProbs({ ...allSelections, [signal.id]: "unknown" }, baseProbs);

    const marketWith = computeWeightedMarket(withSignal);
    const marketWithout = computeWeightedMarket(withoutSignal);

    // Find the top 3 most affected scenarios
    const scenarioDiffs = SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      delta: (withSignal[s.id] - withoutSignal[s.id]) * 100,
      prob: withSignal[s.id] * 100,
    }))
      .filter((d) => Math.abs(d.delta) > 0.3)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);

    // Key market shifts
    const marketDiffs = ASSETS.map((a) => {
      const mid = marketWith[a.id].mid;
      const midBase = marketWithout[a.id].mid;
      let delta: number;
      let formatted: string;

      if (a.id === "sp500") {
        delta = mid - midBase;
        formatted = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}pp`;
      } else if (a.id === "treasury") {
        delta = (mid - midBase) * 100;
        formatted = `${delta > 0 ? "+" : ""}${delta.toFixed(0)}bp`;
      } else if (a.id === "oil" || a.id === "gold") {
        delta = mid - midBase;
        formatted = `${delta > 0 ? "+" : ""}$${Math.abs(delta).toFixed(0)}`;
      } else {
        delta = mid - midBase;
        formatted = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
      }

      return { id: a.id, name: a.name, delta, formatted, absDelta: Math.abs(delta) };
    })
      .filter((d) => d.absDelta > 0.01)
      .sort((a, b) => b.absDelta - a.absDelta)
      .slice(0, 3);

    return { scenarioDiffs, marketDiffs };
  }, [isSet, signal.id, allSelections, baseProbs]);

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isSet
          ? "border-[hsl(var(--primary)/.25)] bg-card shadow-sm"
          : "border-border/50 bg-card/50"
      }`}
      data-testid={`decision-${signal.id}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <Badge
          variant="outline"
          className="text-[10px] font-medium px-1.5 py-0 h-[18px] border-0 flex-shrink-0"
          style={{
            backgroundColor: `${signal.actorColor}14`,
            color: signal.actorColor,
          }}
        >
          {signal.actor}
        </Badge>
        <span className="text-[13px] font-medium">{signal.question}</span>
      </div>

      {/* Pill toggles */}
      <div className="px-3 pb-2">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={signal.question}>
          {signal.options.map((option) => {
            const isSelected = selectedValue === option.value;
            const isUnknown = option.value === "unknown";

            return (
              <button
                key={option.value}
                role="radio"
                aria-checked={isSelected}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 border cursor-pointer ${
                  isSelected
                    ? isUnknown
                      ? "bg-muted border-muted-foreground/20 text-muted-foreground"
                      : "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))] shadow-sm"
                    : "bg-transparent border-border/60 text-foreground/80 hover:bg-accent hover:border-border"
                }`}
                onClick={() => onSelect(option.value)}
                data-testid={`pill-${signal.id}-${option.value}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Impact preview — only shown when a non-unknown option is selected */}
      {impactPreview && (
        <div className="px-3 pb-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            {/* Scenario shifts */}
            {impactPreview.scenarioDiffs.map((sd) => (
              <span key={sd.id} className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sd.color }}
                />
                <span className="text-muted-foreground truncate max-w-[120px]">{sd.name}</span>
                <span
                  className={`font-medium tabular-nums ${
                    sd.delta > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {sd.delta > 0 ? "+" : ""}
                  {sd.delta.toFixed(1)}pp
                </span>
              </span>
            ))}

            {/* Separator */}
            {impactPreview.marketDiffs.length > 0 && impactPreview.scenarioDiffs.length > 0 && (
              <span className="text-border">|</span>
            )}

            {/* Market shifts */}
            {impactPreview.marketDiffs.map((md) => (
              <span key={md.id} className="flex items-center gap-1">
                <span className="text-muted-foreground">{md.name}</span>
                <span
                  className={`font-medium tabular-nums ${
                    md.id === "oil"
                      ? md.delta > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                      : md.id === "sp500"
                      ? md.delta > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {md.formatted}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
