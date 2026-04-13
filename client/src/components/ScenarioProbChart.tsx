import { memo, useMemo, useState } from 'react';
import { SCENARIOS, SCENARIO_MAP, type ScenarioId } from '../lib/config';
import { Info } from 'lucide-react';

interface ScenarioProbChartProps {
  currentProbs: Record<ScenarioId, number>;
  baselineProbs: Record<ScenarioId, number>;
}

/** Prominent horizontal bar chart showing scenario probabilities with descriptions */
export const ScenarioProbChart = memo(function ScenarioProbChart({
  currentProbs,
  baselineProbs,
}: ScenarioProbChartProps) {
  const [hoveredId, setHoveredId] = useState<ScenarioId | null>(null);

  const sorted = useMemo(
    () =>
      [...SCENARIOS]
        .sort((a, b) => (currentProbs[b.id] ?? 0) - (currentProbs[a.id] ?? 0)),
    [currentProbs]
  );

  const maxProb = Math.max(...Object.values(currentProbs)) * 100;
  const barScale = Math.min(100, Math.max(40, maxProb + 10));

  return (
    <div className="space-y-1" data-testid="scenario-prob-chart">
      {sorted.map(scenario => {
        const pct = (currentProbs[scenario.id] ?? 0) * 100;
        const basePct = (baselineProbs[scenario.id] ?? 0) * 100;
        const delta = pct - basePct;
        const barWidth = (pct / barScale) * 100;
        const isHovered = hoveredId === scenario.id;

        return (
          <div
            key={scenario.id}
            className="group"
            onMouseEnter={() => setHoveredId(scenario.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-center gap-2">
              {/* Label */}
              <div className="w-[150px] sm:w-[180px] flex-shrink-0 text-right">
                <span className="text-[12px] leading-tight font-medium">
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

            {/* Tooltip description — shown on hover */}
            {isHovered && (
              <div className="ml-[150px] sm:ml-[180px] pl-2 mt-0.5 mb-1">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {scenario.tooltipDesc}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Note about mutual exclusivity */}
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-2 pt-2 border-t border-border/30">
        Scenarios are modelled as archetypes — each describes a distinct dominant dynamic.
        Probabilities are normalised to sum to 100%, reflecting a forced ranking of which
        equilibrium is most likely to prevail. In practice, outcomes may blend features of
        multiple scenarios. Hover over a scenario for a description.
      </p>
    </div>
  );
});
