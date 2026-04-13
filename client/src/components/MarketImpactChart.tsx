import { memo, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ASSETS,
  ASSET_MAP,
  SCENARIO_IDS,
  SCENARIO_MAP,
  MARKET_IMPACT,
  type AssetId,
  type ScenarioId,
} from '../lib/config';

const ASSET_COLORS: Record<AssetId, string> = {
  oil: '#D85A30',
  sp500: '#3266AD',
  treasury: '#888780',
  dxy: '#534AB7',
  gold: '#E9AB2E',
};

/** Number of sample points across the x-axis for the KDE curve */
const KDE_POINTS = 200;

/**
 * Gaussian kernel: φ(x) = exp(-0.5 * x²) / √(2π)
 */
function gaussianPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Build a probability-weighted Gaussian mixture density for one asset.
 *
 * Each scenario contributes a Gaussian kernel centred at its mid value,
 * with σ = (hi - lo) / 2  (so lo/hi sit roughly at ±1σ).
 * The kernel is weighted by the scenario's probability.
 *
 * Returns an array of { x, density } points suitable for an AreaChart.
 */
function buildKdeCurve(
  assetId: AssetId,
  probs: Record<ScenarioId, number>,
): { x: number; density: number }[] {
  // Gather kernels
  const kernels = SCENARIO_IDS.map(sid => {
    const range = MARKET_IMPACT[sid][assetId];
    const mu = range.mid;
    const sigma = Math.max((range.hi - range.lo) / 2, 0.01); // avoid zero
    return { mu, sigma, weight: probs[sid] };
  });

  // Determine x-range: min(lo) to max(hi) with padding
  let xMin = Infinity;
  let xMax = -Infinity;
  for (const sid of SCENARIO_IDS) {
    const r = MARKET_IMPACT[sid][assetId];
    xMin = Math.min(xMin, r.lo);
    xMax = Math.max(xMax, r.hi);
  }
  const pad = (xMax - xMin) * 0.15;
  xMin -= pad;
  xMax += pad;

  const step = (xMax - xMin) / (KDE_POINTS - 1);
  const points: { x: number; density: number }[] = [];

  for (let i = 0; i < KDE_POINTS; i++) {
    const x = xMin + i * step;
    let density = 0;
    for (const k of kernels) {
      const z = (x - k.mu) / k.sigma;
      density += k.weight * gaussianPdf(z) / k.sigma;
    }
    points.push({ x: Math.round(x * 100) / 100, density });
  }

  return points;
}

interface MarketImpactChartProps {
  currentProbs: Record<ScenarioId, number>;
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
}

export const MarketImpactChart = memo(function MarketImpactChart({
  currentProbs,
  weightedMarket,
}: MarketImpactChartProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetId>('oil');

  const asset = ASSET_MAP[selectedAsset];
  const color = ASSET_COLORS[selectedAsset];
  const wm = weightedMarket[selectedAsset];

  const curveData = useMemo(
    () => buildKdeCurve(selectedAsset, currentProbs),
    [selectedAsset, currentProbs],
  );

  // Expected value — vertical reference line
  const expectedValue = wm.mid;

  // Scenario markers to show as small reference lines
  const scenarioMarkers = useMemo(() => {
    return SCENARIO_IDS
      .map(sid => ({
        id: sid,
        name: SCENARIO_MAP[sid].name,
        color: SCENARIO_MAP[sid].color,
        prob: currentProbs[sid],
        value: MARKET_IMPACT[sid][selectedAsset].mid,
      }))
      .filter(s => s.prob >= 0.03)
      .sort((a, b) => a.value - b.value);
  }, [selectedAsset, currentProbs]);

  const formatTick = (v: number) => asset.formatShort(v);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const pt = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-2.5">
        <div className="text-[12px] font-semibold tabular-nums">
          {asset.format(pt.x)}
        </div>
        <div className="text-[10px] text-muted-foreground">
          Relative density: {(pt.density * 100).toFixed(1)}
        </div>
      </div>
    );
  };

  return (
    <div data-testid="market-impact-chart">
      {/* Asset selector tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {ASSETS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAsset(a.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedAsset === a.id
                ? 'bg-foreground text-background'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Expected value summary */}
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-[13px] font-semibold">{asset.name}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-bold tabular-nums">
            {asset.format(wm.mid)}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ({asset.formatShort(wm.lo)} – {asset.formatShort(wm.hi)})
          </span>
        </div>
      </div>

      {/* KDE distribution curve */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id={`kde-fill-${selectedAsset}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              tickCount={7}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />

            {/* Scenario markers — thin coloured lines */}
            {scenarioMarkers.map(s => (
              <ReferenceLine
                key={s.id}
                x={s.value}
                stroke={s.color}
                strokeWidth={1.5}
                strokeOpacity={Math.max(0.3, Math.min(0.8, s.prob * 3))}
                strokeDasharray="4 3"
              />
            ))}

            {/* Expected value line */}
            <ReferenceLine
              x={expectedValue}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: `E[x] = ${asset.formatShort(expectedValue)}`,
                position: 'top',
                fontSize: 10,
                fill: 'hsl(var(--foreground))',
                fontWeight: 600,
              }}
            />

            {/* The distribution curve with shading */}
            <Area
              type="monotone"
              dataKey="density"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#kde-fill-${selectedAsset})`}
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario legend with values */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {scenarioMarkers.map(s => (
          <div key={s.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span
              className="w-3 h-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color, opacity: Math.max(0.3, s.prob * 3) }}
            />
            <span>{s.name}</span>
            <span className="tabular-nums font-medium">{asset.formatShort(s.value)}</span>
            <span className="tabular-nums">({(s.prob * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-2">
        The curve shows the probability-weighted distribution of outcomes. Each scenario
        contributes a Gaussian kernel centred on its expected value, weighted by its probability.
        Dashed coloured lines mark individual scenario midpoints. The thick dashed line is
        the overall expected value. All values are editorial estimates.
      </p>
    </div>
  );
});
