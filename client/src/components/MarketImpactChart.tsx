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
  brent: '#D85A30',
  gold: '#E9AB2E',
  govbond: '#3266AD',
  credit: '#888780',
  dm_eq: '#1D9E75',
  em_eq: '#534AB7',
  usd: '#A32D2D',
};

const KDE_POINTS = 200;

function gaussianPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function buildKdeCurve(
  assetId: AssetId,
  probs: Record<ScenarioId, number>,
): { x: number; density: number }[] {
  const kernels = SCENARIO_IDS.map(sid => {
    const range = MARKET_IMPACT[sid][assetId];
    const mu = range.mid;
    const sigma = Math.max((range.hi - range.lo) / 2, 0.01);
    return { mu, sigma, weight: probs[sid] };
  });

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
  const [selectedAsset, setSelectedAsset] = useState<AssetId>('brent');

  const asset = ASSET_MAP[selectedAsset];
  const color = ASSET_COLORS[selectedAsset];
  const wm = weightedMarket[selectedAsset];

  const curveData = useMemo(
    () => buildKdeCurve(selectedAsset, currentProbs),
    [selectedAsset, currentProbs],
  );

  const expectedValue = wm.mid;
  const currentValue = asset.currentValue;
  const hasCurrentValue = currentValue !== 0; // Only show "Current" for absolute-price assets

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
            className={`px-2.5 py-1 rounded-[10px] text-[11px] font-medium transition-colors ${
              selectedAsset === a.id
                ? 'bg-[var(--sch-navy)] text-white'
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
        <div className="flex items-baseline gap-3">
          {hasCurrentValue && (
            <span className="text-[11px] text-muted-foreground">
              Current: <span className="font-semibold tabular-nums text-foreground">{asset.format(currentValue)}</span>
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            Expected: <span className="font-bold tabular-nums text-[14px] text-foreground">{asset.format(wm.mid)}</span>
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ({asset.formatShort(wm.lo)} – {asset.formatShort(wm.hi)})
          </span>
        </div>
      </div>

      {/* KDE distribution curve */}
      <div className="h-[245px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveData} margin={{ top: 20, right: 10, left: -5, bottom: 5 }}>
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

            {/* Current value line — solid, labelled */}
            {hasCurrentValue && (
              <ReferenceLine
                x={currentValue}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{
                  value: `Current`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))',
                  fontWeight: 500,
                }}
              />
            )}

            {/* Expected value line — thick, clearly labelled */}
            <ReferenceLine
              x={expectedValue}
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              label={{
                value: `Expected: ${asset.formatShort(expectedValue)}`,
                position: 'top',
                fontSize: 11,
                fill: 'hsl(var(--foreground))',
                fontWeight: 700,
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

      {/* Legend with clear labels */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-[2.5px] bg-foreground rounded-full inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--foreground)) 0, hsl(var(--foreground)) 4px, transparent 4px, transparent 7px)' }} />
          Expected value
        </div>
        {hasCurrentValue && (
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-px bg-muted-foreground rounded-full inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 2px, transparent 2px, transparent 4px)' }} />
            Current level
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-2 rounded-sm inline-block" style={{ backgroundColor: color, opacity: 0.3 }} />
          Probability distribution
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-2">
        The curve shows the probability-weighted distribution of outcomes. Each scenario
        contributes a Gaussian kernel centred on its expected value, weighted by its probability.
        {hasCurrentValue ? ' The thin dashed line marks the current market level.' : ''}
        {' '}The thick dashed line is the overall expected value. All values are editorial estimates.
      </p>
    </div>
  );
});
