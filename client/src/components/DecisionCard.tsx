import { memo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { type Signal, type SignalId, type ScenarioId, SIGNAL_MAP } from "../lib/config";
import { type SignalState, createEqualDistribution } from "../lib/engine";

interface DecisionCardProps {
  signal: Signal;
  state: SignalState;
  onStateChange: (signalId: SignalId, state: SignalState) => void;
}

export const DecisionCard = memo(function DecisionCard({
  signal,
  state,
  onStateChange,
}: DecisionCardProps) {
  const isSet = state.mode === 'distribution';

  const handleToggleActive = useCallback(() => {
    if (isSet) {
      onStateChange(signal.id, { mode: 'unknown' });
    } else {
      onStateChange(signal.id, createEqualDistribution(signal.id));
    }
  }, [isSet, signal.id, onStateChange]);

  const handleSliderChange = useCallback(
    (optionValue: string, newPct: number) => {
      if (state.mode !== 'distribution') return;

      const options = signal.options;
      const currentWeights = { ...state.weights };
      const oldPct = currentWeights[optionValue] * 100;
      const delta = newPct - oldPct;

      // Distribute the delta proportionally among other options
      const others = options.filter((o) => o.value !== optionValue);
      const othersTotal = others.reduce((s, o) => s + (currentWeights[o.value] ?? 0), 0);

      const newWeights: Record<string, number> = {};
      newWeights[optionValue] = Math.max(0, Math.min(100, newPct)) / 100;

      if (othersTotal > 0.001) {
        const remaining = 1 - newWeights[optionValue];
        for (const other of others) {
          const share = (currentWeights[other.value] ?? 0) / othersTotal;
          newWeights[other.value] = Math.max(0, remaining * share);
        }
      } else {
        // All others are zero; distribute equally
        const remaining = 1 - newWeights[optionValue];
        for (const other of others) {
          newWeights[other.value] = remaining / others.length;
        }
      }

      // Normalize to exactly 1.0
      const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
      for (const key of Object.keys(newWeights)) {
        newWeights[key] = newWeights[key] / total;
      }

      onStateChange(signal.id, { mode: 'distribution', weights: newWeights });
    },
    [state, signal, onStateChange]
  );

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isSet
          ? "border-[hsl(var(--primary)/.25)] bg-card shadow-sm"
          : "border-border/50 bg-card/50"
      }`}
      data-testid={`decision-${signal.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
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
            <span className="text-[13px] font-semibold">{signal.question}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              isSet
                ? "bg-[hsl(var(--primary))] text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            onClick={handleToggleActive}
            data-testid={`toggle-${signal.id}`}
          >
            {isSet ? "Active" : "Unknown"}
          </button>
        </div>
      </div>

      {/* Context text — always visible */}
      <div className="px-3 pb-2">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {signal.context}
        </p>
      </div>

      {/* Sliders */}
      {isSet && state.mode === 'distribution' && (
        <div className="px-3 pb-3 space-y-2">
          {signal.options.map((option) => {
            const pct = Math.round((state.weights[option.value] ?? 0) * 100);
            const isMax = pct === Math.max(...Object.values(state.weights).map(w => Math.round(w * 100)));

            return (
              <div key={option.value} className="group" data-testid={`slider-row-${signal.id}-${option.value}`}>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[12px] w-[90px] flex-shrink-0 truncate ${
                      isMax ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                    title={option.label}
                  >
                    {option.shortLabel}
                  </span>
                  <div className="flex-1 relative h-6 flex items-center">
                    <div className="absolute inset-x-0 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-150"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isMax ? signal.actorColor : `${signal.actorColor}60`,
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) =>
                        handleSliderChange(option.value, Number(e.target.value))
                      }
                      className="absolute inset-x-0 h-6 opacity-0 cursor-pointer"
                      data-testid={`slider-${signal.id}-${option.value}`}
                    />
                  </div>
                  <span
                    className={`text-[13px] tabular-nums w-[36px] text-right flex-shrink-0 ${
                      isMax ? "font-bold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                {option.label !== option.shortLabel && (
                  <p className="text-[11px] text-muted-foreground/60 ml-[98px] leading-tight mt-0.5">
                    {option.label}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
