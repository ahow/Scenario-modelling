import { memo } from 'react';
import { ASSETS, SCENARIO_IDS, SCENARIO_MAP, MARKET_IMPACT, type AssetId, type ScenarioId } from '../lib/config';

interface MarketImpactChartProps {
  currentProbs: Record<ScenarioId, number>;
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
}

/** Visual range chart showing the probability-weighted distribution of each outcome variable */
export const MarketImpactChart = memo(function MarketImpactChart({
  currentProbs,
  weightedMarket,
}: MarketImpactChartProps) {
  return (
    <div className="space-y-4" data-testid="market-impact-chart">
      {ASSETS.map(asset => {
        const wm = weightedMarket[asset.id];
        const scenarioPoints = SCENARIO_IDS
          .map(sid => ({
            id: sid,
            name: SCENARIO_MAP[sid].name,
            color: SCENARIO_MAP[sid].color,
            prob: currentProbs[sid],
            value: MARKET_IMPACT[sid][asset.id].mid,
          }))
          .sort((a, b) => a.value - b.value);

        const allValues = scenarioPoints.map(s => s.value);
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const padding = (maxVal - minVal) * 0.15;
        const rangeTotal = maxVal - minVal + 2 * padding;
        const rangeStart = minVal - padding;

        const toPct = (v: number) => ((v - rangeStart) / rangeTotal) * 100;

        return (
          <div key={asset.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <h4 className="text-[12px] font-semibold">{asset.name}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold tabular-nums">
                  {asset.format(wm.mid)}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  ({asset.formatShort(wm.lo)} – {asset.formatShort(wm.hi)})
                </span>
              </div>
            </div>

            {/* Strip visualisation */}
            <div className="relative h-7 rounded-md bg-muted/30 overflow-hidden">
              {/* Range fill: lo to hi */}
              <div
                className="absolute h-full bg-[hsl(var(--primary)/.10)] rounded-md"
                style={{
                  left: `${toPct(wm.lo)}%`,
                  right: `${100 - toPct(wm.hi)}%`,
                }}
              />
              {/* Scenario dots */}
              {scenarioPoints.map(pt => {
                const xPct = toPct(pt.value);
                const radius = Math.max(3, Math.min(10, pt.prob * 60));
                return (
                  <div
                    key={pt.id}
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${xPct}%`,
                      width: `${radius * 2}px`,
                      height: `${radius * 2}px`,
                      marginLeft: `${-radius}px`,
                      backgroundColor: pt.color,
                      opacity: Math.max(0.3, Math.min(0.9, pt.prob * 3)),
                    }}
                    title={`${pt.name}: ${asset.format(pt.value)} (${(pt.prob * 100).toFixed(0)}%)`}
                  />
                );
              })}
              {/* Expected value line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                style={{ left: `${toPct(wm.mid)}%` }}
              />
            </div>

            {/* Min/max labels */}
            <div className="flex justify-between text-[9px] text-muted-foreground/60 tabular-nums">
              <span>{asset.formatShort(minVal)}</span>
              <span>{asset.formatShort(maxVal)}</span>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {SCENARIO_IDS.map(sid => {
          const s = SCENARIO_MAP[sid];
          const prob = currentProbs[sid];
          if (prob < 0.03) return null;
          return (
            <div key={sid} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color, opacity: Math.max(0.3, prob * 3) }}
              />
              <span>{s.name}</span>
              <span className="tabular-nums font-medium">{(prob * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        Each dot represents a scenario's conditional outcome, sized by probability.
        The vertical line marks the probability-weighted expected value. The shaded
        band shows the lo–hi range. Scenario values and weights are editorial estimates.
      </p>
    </div>
  );
});
