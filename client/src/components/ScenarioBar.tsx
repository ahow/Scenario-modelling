import { memo, useMemo, useState } from "react";
import { type ScenarioId, SCENARIOS, SCENARIO_MAP } from "../lib/config";

interface ScenarioBarProps {
  currentProbs: Record<ScenarioId, number>;
  baselineProbs: Record<ScenarioId, number>;
  onScenarioClick: (id: ScenarioId) => void;
}

export const ScenarioBar = memo(function ScenarioBar({
  currentProbs,
  baselineProbs,
  onScenarioClick,
}: ScenarioBarProps) {
  const [hoveredId, setHoveredId] = useState<ScenarioId | null>(null);

  const sorted = useMemo(() => {
    return [...SCENARIOS].sort(
      (a, b) => (currentProbs[b.id] ?? 0) - (currentProbs[a.id] ?? 0)
    );
  }, [currentProbs]);

  return (
    <div data-testid="scenario-bar">
      {/* Stacked horizontal bar */}
      <div className="flex h-8 overflow-hidden border border-border/30">
        {sorted.map((scenario) => {
          const prob = currentProbs[scenario.id] ?? 0;
          const pct = prob * 100;
          if (pct < 0.5) return null;

          const isHovered = hoveredId === scenario.id;

          return (
            <button
              key={scenario.id}
              className="relative h-full transition-all duration-200 cursor-pointer hover:brightness-110 group"
              style={{
                width: `${pct}%`,
                backgroundColor: scenario.color,
                opacity: hoveredId && !isHovered ? 0.5 : 1,
                minWidth: pct > 2 ? '28px' : '12px',
              }}
              onClick={() => onScenarioClick(scenario.id)}
              onMouseEnter={() => setHoveredId(scenario.id)}
              onMouseLeave={() => setHoveredId(null)}
              data-testid={`scenario-segment-${scenario.id}`}
              aria-label={`${scenario.name}: ${Math.round(pct)}%`}
            >
              {pct > 5 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-semibold tabular-nums drop-shadow-sm">
                  {Math.round(pct)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {sorted.map((scenario) => {
          const prob = currentProbs[scenario.id] ?? 0;
          const base = baselineProbs[scenario.id] ?? 0;
          const delta = (prob - base) * 100;
          const pct = prob * 100;
          if (pct < 0.5) return null;

          const isHovered = hoveredId === scenario.id;

          return (
            <button
              key={scenario.id}
              className={`flex items-center gap-1 text-[11px] leading-tight py-0.5 transition-opacity ${
                hoveredId && !isHovered ? "opacity-40" : "opacity-100"
              } hover:opacity-100 cursor-pointer`}
              onClick={() => onScenarioClick(scenario.id)}
              onMouseEnter={() => setHoveredId(scenario.id)}
              onMouseLeave={() => setHoveredId(null)}
              data-testid={`scenario-legend-${scenario.id}`}
            >
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: scenario.color }}
              />
              <span className="font-medium whitespace-nowrap">{scenario.name}</span>
              <span className="tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
              {Math.abs(delta) >= 0.5 && (
                <span
                  className={`tabular-nums font-medium ${
                    delta > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
