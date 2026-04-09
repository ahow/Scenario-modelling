import { memo, useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  type ScenarioId,
  type AssetId,
  SCENARIOS,
  SCENARIO_IDS,
  SCENARIO_MAP,
  ASSETS,
  ASSET_MAP,
  MARKET_IMPACT,
  ANALOGUES,
} from "../lib/config";
import { computeScenarioContributions } from "../lib/engine";
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";

interface MarketDashboardProps {
  currentProbs: Record<ScenarioId, number>;
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
}

// Hook to detect dark mode for chart theming
function useDarkMode() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export const MarketDashboard = memo(function MarketDashboard({
  currentProbs,
  weightedMarket,
}: MarketDashboardProps) {
  const [activeAsset, setActiveAsset] = useState<AssetId>("oil");
  const [showPctChange, setShowPctChange] = useState(false);
  const isDark = useDarkMode();

  return (
    <div className="space-y-4" data-testid="market-dashboard">
      {/* Asset Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ASSETS.map((asset) => {
          const wm = weightedMarket[asset.id];
          const isActive = activeAsset === asset.id;
          return (
            <Card
              key={asset.id}
              className={`cursor-pointer transition-colors ${
                isActive
                  ? "ring-2 ring-[hsl(var(--primary))] ring-offset-1 ring-offset-background"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => setActiveAsset(asset.id)}
              data-testid={`asset-card-${asset.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {asset.name}
                  </span>
                  <DirectionIcon asset={asset.id} weightedMarket={weightedMarket} />
                </div>
                <div className="text-lg font-semibold tabular-nums leading-tight">
                  {asset.format(wm.mid)}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                  {asset.formatShort(wm.lo)} — {asset.formatShort(wm.hi)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts for active asset */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContributionChart
          assetId={activeAsset}
          currentProbs={currentProbs}
          isDark={isDark}
        />
        <RangeFanChart
          assetId={activeAsset}
          currentProbs={currentProbs}
        />
      </div>

      {/* Historical Analogues */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold">
            Historical Conflict Analogues
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Reference only — past performance does not predict future outcomes
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="analogues-table">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b">
                  <th className="text-left py-2 pr-4 font-medium">Event</th>
                  <th className="text-left py-2 pr-4 font-medium">Period</th>
                  <th className="text-left py-2 pr-4 font-medium">Oil Impact</th>
                  <th className="text-left py-2 pr-4 font-medium">Equity Impact</th>
                  <th className="text-left py-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {ANALOGUES.map((a, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium">{a.event}</td>
                    <td className="py-2 pr-4 text-muted-foreground tabular-nums">
                      {a.year}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{a.oilImpact}</td>
                    <td className="py-2 pr-4 tabular-nums">{a.equityImpact}</td>
                    <td className="py-2 tabular-nums">{a.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// --- Sub-components ---

function DirectionIcon({
  asset,
  weightedMarket,
}: {
  asset: AssetId;
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
}) {
  const assetDef = ASSET_MAP[asset];
  const mid = weightedMarket[asset].mid;

  // Determine direction based on current value
  let isUp = false;
  let isNeutral = false;

  if (asset === "oil") {
    isUp = mid > assetDef.currentValue * 1.03;
    isNeutral = Math.abs(mid - assetDef.currentValue) / assetDef.currentValue < 0.03;
  } else if (asset === "sp500") {
    isUp = mid > 0;
    isNeutral = Math.abs(mid) < 1;
  } else if (asset === "treasury") {
    isUp = mid > assetDef.currentValue;
    isNeutral = Math.abs(mid - assetDef.currentValue) < 0.05;
  } else if (asset === "dxy") {
    isUp = mid > assetDef.currentValue;
    isNeutral = Math.abs(mid - assetDef.currentValue) < 1;
  } else {
    isUp = mid > assetDef.currentValue * 1.03;
    isNeutral = Math.abs(mid - assetDef.currentValue) / assetDef.currentValue < 0.03;
  }

  if (isNeutral) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  if (isUp) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
}

function ContributionChart({
  assetId,
  currentProbs,
  isDark,
}: {
  assetId: AssetId;
  currentProbs: Record<ScenarioId, number>;
  isDark: boolean;
}) {
  const data = useMemo(() => {
    const contributions = computeScenarioContributions(currentProbs, assetId);
    return contributions
      .filter((c) => c.probability > 0.005)
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .map((c) => ({
        name: SCENARIO_MAP[c.scenarioId].name.length > 22
          ? SCENARIO_MAP[c.scenarioId].name.substring(0, 20) + "…"
          : SCENARIO_MAP[c.scenarioId].name,
        fullName: SCENARIO_MAP[c.scenarioId].name,
        contribution: parseFloat(c.contribution.toFixed(2)),
        probability: (c.probability * 100).toFixed(1),
        impact: c.impact.mid,
        color: SCENARIO_MAP[c.scenarioId].color,
      }));
  }, [currentProbs, assetId]);

  const asset = ASSET_MAP[assetId];

  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-semibold">
          Scenario Contributions — {asset.name}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Probability-weighted impact by scenario
        </p>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? '#b0b0b0' : '#555' }} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11, fill: isDark ? '#b0b0b0' : '#555' }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-md text-sm">
                    <p className="font-medium">{d.fullName}</p>
                    <p className="text-muted-foreground text-xs">
                      Probability: {d.probability}% · Impact: {asset.format(d.impact)}
                    </p>
                    <p className="text-xs font-medium mt-1">
                      Contribution: {d.contribution.toFixed(2)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="contribution" radius={[0, 2, 2, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RangeFanChart({
  assetId,
  currentProbs,
}: {
  assetId: AssetId;
  currentProbs: Record<ScenarioId, number>;
}) {
  const asset = ASSET_MAP[assetId];
  const data = useMemo(() => {
    return SCENARIOS.map((s) => {
      const impact = MARKET_IMPACT[s.id][assetId];
      const prob = currentProbs[s.id];
      return {
        name: s.name.length > 22 ? s.name.substring(0, 20) + "…" : s.name,
        fullName: s.name,
        lo: impact.lo,
        mid: impact.mid,
        hi: impact.hi,
        range: [impact.lo, impact.hi],
        probability: prob,
        color: s.color,
        direction: impact.direction,
      };
    }).sort((a, b) => b.probability - a.probability);
  }, [currentProbs, assetId]);

  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-semibold">
          Outcome Ranges — {asset.name}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Low–mid–high per scenario, opacity weighted by probability
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-2">
          {data.map((d) => {
            const allVals = data.flatMap((s) => [s.lo, s.hi]);
            const minVal = Math.min(...allVals);
            const maxVal = Math.max(...allVals);
            const range = maxVal - minVal || 1;
            const loPos = ((d.lo - minVal) / range) * 100;
            const midPos = ((d.mid - minVal) / range) * 100;
            const hiPos = ((d.hi - minVal) / range) * 100;
            const currentPos = ((asset.currentValue - minVal) / range) * 100;

            return (
              <div
                key={d.fullName}
                style={{ opacity: Math.max(0.25, d.probability * 3.5) }}
                className="group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium truncate pr-2">
                    {d.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
                    {(d.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-3 bg-muted/50 rounded-sm">
                  {/* Current value reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-muted-foreground/30 z-10"
                    style={{ left: `${Math.min(Math.max(currentPos, 0), 100)}%` }}
                  />
                  {/* Range bar */}
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-sm"
                    style={{
                      left: `${loPos}%`,
                      width: `${hiPos - loPos}%`,
                      backgroundColor: d.color,
                      opacity: 0.3,
                    }}
                  />
                  {/* Mid dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-20"
                    style={{
                      left: `${midPos}%`,
                      backgroundColor: d.color,
                      marginLeft: "-4px",
                    }}
                  />
                </div>
                {/* Tooltip on hover */}
                <div className="hidden group-hover:flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    Lo: {asset.format(d.lo)} · Mid: {asset.format(d.mid)} · Hi: {asset.format(d.hi)}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {d.direction}
                  </Badge>
                </div>
              </div>
            );
          })}
          {/* Scale labels */}
          <div className="flex justify-between mt-1">
            {(() => {
              const allVals = data.flatMap((s) => [s.lo, s.hi]);
              const minVal = Math.min(...allVals);
              const maxVal = Math.max(...allVals);
              return (
                <>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {asset.format(minVal)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ▼ Current: {asset.format(asset.currentValue)}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {asset.format(maxVal)}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
