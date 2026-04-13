import { memo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ScenarioId,
  type AssetId,
  SCENARIO_MAP,
  ASSETS,
  MARKET_IMPACT,
} from "../lib/config";

interface ScenarioDrawerProps {
  scenarioId: ScenarioId;
  currentProbs: Record<ScenarioId, number>;
  baselineProbs: Record<ScenarioId, number>;
  onClose: () => void;
}

export const ScenarioDrawer = memo(function ScenarioDrawer({
  scenarioId,
  currentProbs,
  baselineProbs,
  onClose,
}: ScenarioDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const scenario = SCENARIO_MAP[scenarioId];
  const prob = currentProbs[scenarioId] ?? 0;
  const base = baselineProbs[scenarioId] ?? 0;
  const delta = (prob - base) * 100;
  const pct = prob * 100;
  const impact = MARKET_IMPACT[scenarioId];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid="scenario-drawer"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: scenario.color }}
              />
              <h3 className="text-base font-semibold">{scenario.name}</h3>
            </div>
            <p className="text-[12px] text-muted-foreground">{scenario.tooltipDesc}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Probability */}
        <div className="px-4 pb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{Math.round(pct)}%</span>
            <span className="text-sm text-muted-foreground">probability</span>
            {Math.abs(delta) >= 0.5 && (
              <span
                className={`text-sm font-medium tabular-nums ${
                  delta > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)}pp vs baseline
              </span>
            )}
          </div>
          <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: scenario.color }}
            />
          </div>
        </div>

        {/* Market impact grid */}
        <div className="px-4 pb-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Conditional Market Impact (3–12m)
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {ASSETS.map((asset) => {
              const assetImpact = impact[asset.id];
              return (
                <div
                  key={asset.id}
                  className="text-center p-2 rounded-md bg-muted/30 border border-border/30"
                >
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 leading-tight">
                    {asset.name}
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {asset.format(assetImpact.mid)}
                  </div>
                  <div className="text-[9px] text-muted-foreground tabular-nums">
                    {asset.formatShort(assetImpact.lo)}–{asset.formatShort(assetImpact.hi)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
