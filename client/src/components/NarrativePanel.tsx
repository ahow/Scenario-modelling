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
          Set your assumptions in the Decisions tab to generate a scenario outlook and market impact assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card shadow-sm overflow-hidden" data-testid="narrative-panel">
      {/* Scenario narrative */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2 sch-accent-bar">
          Scenario Outlook
        </h3>
        <p className="text-[13px] leading-relaxed text-foreground">
          {scenarioNarrative}
        </p>
      </div>

      {/* Market impact summary */}
      <div className="p-4">
        <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2 sch-accent-bar">
          Market Impact
        </h3>

        {/* Asset cards — 7 assets in a responsive grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
          {ASSETS.map((asset) => {
            const wm = weightedMarket[asset.id];
            return (
              <div
                key={asset.id}
                className="text-center p-2 rounded-md bg-muted/30 border border-border/30"
              >
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 leading-tight">
                  {asset.name}
                </div>
                <div className="text-sm font-bold tabular-nums">
                  {asset.format(wm.mid)}
                </div>
                <div className="text-[9px] text-muted-foreground tabular-nums">
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
    </div>
  );
});
