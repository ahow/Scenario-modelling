import { memo } from "react";
import { type AssetId, ASSETS } from "../lib/config";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LiveQuotes } from "../lib/marketData";
import { FALLBACK_PRICES, pctFromBaseline } from "../lib/marketData";

interface MarketStripProps {
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
  liveQuotes?: LiveQuotes | null;
}

/** Convert expected (% from baseline) to expected (% from current) */
function pctFromCurrent(expectedFromBaseline: number, currentFromBaseline: number): number {
  return ((1 + expectedFromBaseline / 100) / (1 + currentFromBaseline / 100) - 1) * 100;
}

const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

export const MarketStrip = memo(function MarketStrip({ weightedMarket, liveQuotes }: MarketStripProps) {
  // Show a subset in the header strip for space
  const stripAssets: AssetId[] = ['brent', 'gold', 'dm_eq', 'em_eq', 'usd'];

  return (
    <div className="flex items-center gap-0 py-1.5 -mx-1 overflow-x-auto" data-testid="market-strip">
      {stripAssets.map((assetId, i) => {
        const asset = ASSETS.find(a => a.id === assetId)!;
        const wm = weightedMarket[assetId];
        const currentFromBaseline = liveQuotes?.pctFromBaseline[assetId] ?? pctFromBaseline(assetId, FALLBACK_PRICES[assetId]);
        const expectedFromCurr = pctFromCurrent(wm.mid, currentFromBaseline);
        const { direction, color } = getDirection(assetId, expectedFromCurr);

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
                  {fmtPct(expectedFromCurr)}
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

/** Values are now % from current. Direction/color logic. */
function getDirection(
  assetId: AssetId,
  pctFromCurr: number,
): { direction: "up" | "down" | "flat"; color: string } {
  if (Math.abs(pctFromCurr) < 0.5) return { direction: "flat", color: "" };

  // Brent: higher oil = risk indicator (red for high)
  if (assetId === 'brent') {
    return pctFromCurr > 5
      ? { direction: "up", color: "text-red-600 dark:text-red-400" }
      : pctFromCurr > 0
        ? { direction: "up", color: "" }
        : { direction: "down", color: "text-emerald-600 dark:text-emerald-400" };
  }
  // Gold / USD: neutral colors
  if (assetId === 'gold' || assetId === 'usd') {
    return pctFromCurr > 0
      ? { direction: "up", color: "" }
      : { direction: "down", color: "" };
  }
  // Equities / bonds / credit: positive = green, negative = red
  return pctFromCurr > 0
    ? { direction: "up", color: "text-emerald-600 dark:text-emerald-400" }
    : { direction: "down", color: "text-red-600 dark:text-red-400" };
}
