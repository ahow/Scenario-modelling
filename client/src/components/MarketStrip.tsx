import { memo } from "react";
import { type AssetId, ASSETS } from "../lib/config";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketStripProps {
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
}

export const MarketStrip = memo(function MarketStrip({ weightedMarket }: MarketStripProps) {
  return (
    <div className="flex items-center gap-0 py-1.5 -mx-1 overflow-x-auto" data-testid="market-strip">
      {ASSETS.map((asset, i) => {
        const wm = weightedMarket[asset.id];
        const { direction, color } = getDirection(asset.id, wm.mid, asset.currentValue);

        return (
          <div
            key={asset.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 ${
              i > 0 ? "border-l border-border/50" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5 whitespace-nowrap">
                {asset.name}
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold tabular-nums leading-none ${color} num-transition`}>
                  {asset.format(wm.mid)}
                </span>
                {direction === "up" && <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                {direction === "down" && <TrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />}
                {direction === "flat" && <Minus className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

function getDirection(
  assetId: AssetId,
  mid: number,
  current: number
): { direction: "up" | "down" | "flat"; color: string } {
  const threshold = assetId === "sp500" ? 1 : assetId === "treasury" ? 0.05 : current * 0.03;
  const delta = assetId === "sp500" ? mid : mid - current;

  if (Math.abs(delta) < threshold) return { direction: "flat", color: "" };

  // For S&P, oil, gold: up is green. For DXY: strong = higher geopolitical risk. For treasury: higher yield = mixed
  if (assetId === "sp500") {
    return delta > 0
      ? { direction: "up", color: "text-emerald-600 dark:text-emerald-400" }
      : { direction: "down", color: "text-red-600 dark:text-red-400" };
  }
  if (assetId === "oil") {
    // Higher oil = more conflict risk
    return delta > 0
      ? { direction: "up", color: "text-red-600 dark:text-red-400" }
      : { direction: "down", color: "text-emerald-600 dark:text-emerald-400" };
  }
  return delta > 0
    ? { direction: "up", color: "" }
    : { direction: "down", color: "" };
}
