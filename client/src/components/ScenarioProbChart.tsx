import { memo, useMemo } from 'react';
import { SCENARIOS, SCENARIO_MAP, type ScenarioId } from '../lib/config';

interface ScenarioProbChartProps {
  currentProbs: Record<ScenarioId, number>;
  baselineProbs: Record<ScenarioId, number>;
}

/** Prominent horizontal bar chart showing scenario probabilities */
export const ScenarioProbChart = memo(function ScenarioProbChart({
  currentProbs,
  baselineProbs,
}: ScenarioProbChartProps) {
  const sorted = useMemo(
    () =>
      [...SCENARIOS]
        .sort((a, b) => (currentProbs[b.id] ?? 0) - (currentProbs[a.id] ?? 0)),
    [currentProbs]
  );

  const maxProb = Math.max(...Object.values(currentProbs)) * 100;
  const barScale = Math.min(100, Math.max(40, maxProb + 10));

  return (
    <div className="space-y-1.5" data-testid="scenario-prob-chart">
      {sorted.map(scenario => {
        const pct = (currentProbs[scenario.id] ?? 0) * 100;
        const basePct = (baselineProbs[scenario.id] ?? 0) * 100;
        const delta = pct - basePct;
        const barWidth = (pct / barScale) * 100;

        return (
          <div key={scenario.id} className="flex items-center gap-2">
            {/* Label */}
            <div className="w-[160px] sm:w-[200px] flex-shrink-0 text-right">
              <span className="text-[12px] leading-tight">
                {scenario.name}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="flex-1 h-5 bg-muted/40 rounded-sm relative overflow-hidden">
                {/* Baseline marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-foreground/15 z-10"
                  style={{ left: `${(basePct / barScale) * 100}%` }}
                />
                {/* Current bar */}
                <div
                  className="h-full rounded-sm transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(barWidth, 1)}%`,
                    backgroundColor: scenario.color,
                    opacity: 0.85,
                  }}
                />
              </div>

              {/* Percentage + delta */}
              <div className="w-[72px] flex-shrink-0 flex items-baseline gap-1">
                <span className="text-[13px] font-semibold tabular-nums">
                  {pct.toFixed(0)}%
                </span>
                {Math.abs(delta) >= 0.5 && (
                  <span
                    className={`text-[10px] tabular-nums ${
                      delta > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
