import { memo } from "react";
import { type ScenarioId, SCENARIO_MAP, ASSETS, ASSET_MAP, type AssetId } from "../lib/config";

interface NarrativePanelProps {
  scenarioNarrative: string;
  marketNarrative: string;
  topScenarios: Array<{ id: ScenarioId; prob: number }>;
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
  setCount: number;
}

export const NarrativePanel = memo(function NarrativePanel({
  scenarioNarrative,
  marketNarrative,
  topScenarios,
  weightedMarket,
  setCount,
}: NarrativePanelProps) {
  if (setCount === 0) {
    return (
      <div className="border border-dashed border-border/60 bg-[var(--sch-light-bg)] dark:bg-muted/20 p-5" data-testid="narrative-panel">
        <p className="text-[13px] text-muted-foreground text-center">
          Adjust the sliders below to explore how different decision paths change the scenario outlook.
          Drag left or right to shift probabilities toward each pole.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card shadow-sm overflow-hidden" data-testid="narrative-panel">
      {/* Scenario narrative */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Scenario Outlook
        </h3>
        <p className="text-[13px] leading-relaxed text-foreground">
          {scenarioNarrative}
        </p>
      </div>

      {/* Market impact summary */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Market Impact
        </h3>

        {/* Asset cards */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {ASSETS.map((asset) => {
            const wm = weightedMarket[asset.id];
            return (
              <div
                key={asset.id}
                className="text-center p-2 rounded-md bg-muted/30 border border-border/30"
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {asset.name}
                </div>
                <div className="text-sm font-bold tabular-nums">
                  {asset.format(wm.mid)}
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {asset.formatShort(wm.lo)} – {asset.formatShort(wm.hi)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[12px] leading-relaxed text-muted-foreground">
          {marketNarrative}
        </div>
      </div>

      {/* Top scenarios mini bar */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Probability Distribution
        </h3>
        <div className="space-y-1.5">
          {topScenarios.map(({ id, prob }) => {
            const scenario = SCENARIO_MAP[id];
            const pct = Math.round(prob * 100);
            return (
              <div key={id} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: scenario.color }}
                />
                <span className="text-[12px] flex-1 truncate">{scenario.name}</span>
                <span className="text-[12px] font-semibold tabular-nums w-8 text-right">
                  {pct}%
                </span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: scenario.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
