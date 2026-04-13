import { memo } from "react";
import { type AssetId, ASSETS } from "../lib/config";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketStripProps {
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
}

export const MarketStrip = memo(function MarketStrip({ weightedMarket }: MarketStripProps) {
  // Show a subset in the header strip for space
  const stripAssets: AssetId[] = ['brent', 'gold', 'dm_eq', 'em_eq', 'usd'];

  return (
    <div className="flex items-center gap-0 py-1.5 -mx-1 overflow-x-auto" data-testid="market-strip">
      {stripAssets.map((assetId, i) => {
        const asset = ASSETS.find(a => a.id === assetId)!;
        const wm = weightedMarket[assetId];
        const { direction, color } = getDirection(assetId, wm.mid, asset.currentValue);

        return (
          <div
            key={assetId}
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
  // For absolute price assets (brent, gold), compare to current
  if (assetId === 'brent') {
    const delta = mid - current;
    if (Math.abs(delta) < current * 0.03) return { direction: "flat", color: "" };
    return delta > 0
      ? { direction: "up", color: "text-red-600 dark:text-red-400" }    // higher oil = risk
      : { direction: "down", color: "text-emerald-600 dark:text-emerald-400" };
  }
  if (assetId === 'gold') {
    const delta = mid - current;
    if (Math.abs(delta) < current * 0.03) return { direction: "flat", color: "" };
    return delta > 0
      ? { direction: "up", color: "" }
      : { direction: "down", color: "" };
  }
  // For % return assets: positive = green, negative = red
  if (Math.abs(mid) < 1) return { direction: "flat", color: "" };
  if (assetId === 'usd') {
    // Stronger USD can be ambiguous, keep neutral colors
    return mid > 0
      ? { direction: "up", color: "" }
      : { direction: "down", color: "" };
  }
  // Equities / bonds / credit: positive return = green
  return mid > 0
    ? { direction: "up", color: "text-emerald-600 dark:text-emerald-400" }
    : { direction: "down", color: "text-red-600 dark:text-red-400" };
}
