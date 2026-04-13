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

export type PortfolioAssetId = 'dm_eq' | 'em_eq' | 'credit' | 'govbond' | 'brent' | 'gold' | 'cash';

export const PORTFOLIO_ASSETS: { id: PortfolioAssetId; label: string }[] = [
  { id: 'dm_eq', label: 'DM Equities' },
  { id: 'em_eq', label: 'EM Equities' },
  { id: 'credit', label: 'Credit' },
  { id: 'govbond', label: 'Gov Bonds' },
  { id: 'brent', label: 'Oil' },
  { id: 'gold', label: 'Gold' },
  { id: 'cash', label: 'Cash' },
];

export const DEFAULT_PORTFOLIO_WEIGHTS: Record<PortfolioAssetId, number> = {
  dm_eq: 40,
  em_eq: 10,
  credit: 20,
  govbond: 15,
  brent: 5,
  gold: 5,
  cash: 5,
};

const ASSET_COLORS: Record<AssetId, string> = {
  brent: '#D85A30',
  gold: '#E9AB2E',
  govbond: '#3266AD',
  credit: '#888780',
  dm_eq: '#1D9E75',
  em_eq: '#534AB7',
  usd: '#A32D2D',
};

const PORTFOLIO_COLOR = '#0074B7';

const KDE_POINTS = 200;

type TabSelection = AssetId | 'portfolio';

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

/**
 * Convert absolute-price asset outcomes to % returns for portfolio blending.
 * Brent & Gold are absolute prices → convert to % change from current.
 * Gov bonds, credit, equities, USD are already in % return.
 * Cash is always 0%.
 */
function getAssetReturnForScenario(
  portfolioAssetId: PortfolioAssetId,
  scenarioId: ScenarioId,
): { lo: number; mid: number; hi: number } {
  if (portfolioAssetId === 'cash') return { lo: 0, mid: 0, hi: 0 };
  const impact = MARKET_IMPACT[scenarioId][portfolioAssetId as AssetId];
  const asset = ASSET_MAP[portfolioAssetId as AssetId];
  // Brent & Gold: absolute price → convert to % return
  if (asset.currentValue !== 0) {
    return {
      lo: ((impact.lo - asset.currentValue) / asset.currentValue) * 100,
      mid: ((impact.mid - asset.currentValue) / asset.currentValue) * 100,
      hi: ((impact.hi - asset.currentValue) / asset.currentValue) * 100,
    };
  }
  // Already in % return
  return { lo: impact.lo, mid: impact.mid, hi: impact.hi };
}

/**
 * Build a KDE curve for the blended portfolio return (in % terms),
 * then rebase to 100 so the x-axis shows portfolio index values.
 */
function buildPortfolioKdeCurve(
  probs: Record<ScenarioId, number>,
  weights: Record<PortfolioAssetId, number>,
): { x: number; density: number }[] {
  // For each scenario, compute weighted portfolio % return
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return [];

  const scenarioReturns = SCENARIO_IDS.map(sid => {
    let lo = 0, mid = 0, hi = 0;
    for (const pa of PORTFOLIO_ASSETS) {
      const w = (weights[pa.id] || 0) / totalWeight;
      const r = getAssetReturnForScenario(pa.id, sid);
      lo += w * r.lo;
      mid += w * r.mid;
      hi += w * r.hi;
    }
    return { sid, lo, mid, hi };
  });

  // Build kernels in rebased-to-100 space
  const kernels = scenarioReturns.map(sr => {
    const muRebased = 100 + sr.mid;
    const loRebased = 100 + sr.lo;
    const hiRebased = 100 + sr.hi;
    const sigma = Math.max((hiRebased - loRebased) / 2, 0.01);
    return { mu: muRebased, sigma, weight: probs[sr.sid] };
  });

  let xMin = Infinity;
  let xMax = -Infinity;
  for (const k of kernels) {
    xMin = Math.min(xMin, k.mu - 2.5 * k.sigma);
    xMax = Math.max(xMax, k.mu + 2.5 * k.sigma);
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

/** Compute expected portfolio return (rebased to 100) from weighted market */
function computePortfolioExpected(
  probs: Record<ScenarioId, number>,
  weights: Record<PortfolioAssetId, number>,
): { lo: number; mid: number; hi: number } {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return { lo: 100, mid: 100, hi: 100 };

  let wLo = 0, wMid = 0, wHi = 0;
  for (const sid of SCENARIO_IDS) {
    const p = probs[sid];
    let sLo = 0, sMid = 0, sHi = 0;
    for (const pa of PORTFOLIO_ASSETS) {
      const w = (weights[pa.id] || 0) / totalWeight;
      const r = getAssetReturnForScenario(pa.id, sid);
      sLo += w * r.lo;
      sMid += w * r.mid;
      sHi += w * r.hi;
    }
    wLo += p * sLo;
    wMid += p * sMid;
    wHi += p * sHi;
  }

  return { lo: 100 + wLo, mid: 100 + wMid, hi: 100 + wHi };
}

interface MarketImpactChartProps {
  currentProbs: Record<ScenarioId, number>;
  weightedMarket: Record<AssetId, { lo: number; mid: number; hi: number }>;
  portfolioWeights?: Record<PortfolioAssetId, number>;
}

export const MarketImpactChart = memo(function MarketImpactChart({
  currentProbs,
  weightedMarket,
  portfolioWeights,
}: MarketImpactChartProps) {
  const [selectedTab, setSelectedTab] = useState<TabSelection>('brent');

  const isPortfolio = selectedTab === 'portfolio';
  const selectedAsset = isPortfolio ? 'brent' : selectedTab as AssetId; // fallback for typing
  const asset = isPortfolio ? null : ASSET_MAP[selectedAsset];
  const color = isPortfolio ? PORTFOLIO_COLOR : ASSET_COLORS[selectedAsset];
  const wm = isPortfolio ? null : weightedMarket[selectedAsset];

  const curveData = useMemo(() => {
    if (isPortfolio && portfolioWeights) {
      return buildPortfolioKdeCurve(currentProbs, portfolioWeights);
    }
    return buildKdeCurve(selectedAsset, currentProbs);
  }, [selectedTab, currentProbs, portfolioWeights]);

  const portfolioExpected = useMemo(() => {
    if (isPortfolio && portfolioWeights) {
      return computePortfolioExpected(currentProbs, portfolioWeights);
    }
    return null;
  }, [isPortfolio, currentProbs, portfolioWeights]);

  const expectedValue = isPortfolio
    ? (portfolioExpected?.mid ?? 100)
    : (wm?.mid ?? 0);

  const currentValue = isPortfolio ? 100 : (asset?.currentValue ?? 0);
  const hasCurrentValue = isPortfolio ? true : currentValue !== 0;

  const formatTick = (v: number) => {
    if (isPortfolio) return v.toFixed(0);
    return asset!.formatShort(v);
  };

  const formatValue = (v: number) => {
    if (isPortfolio) return v.toFixed(1);
    return asset!.format(v);
  };

  const formatShortValue = (v: number) => {
    if (isPortfolio) return v.toFixed(1);
    return asset!.formatShort(v);
  };

  const displayName = isPortfolio ? 'Portfolio' : asset!.name;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const pt = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-2.5">
        <div className="text-[12px] font-semibold tabular-nums">
          {isPortfolio ? pt.x.toFixed(1) : asset!.format(pt.x)}
        </div>
        <div className="text-[10px] text-muted-foreground">
          Relative density: {(pt.density * 100).toFixed(1)}
        </div>
      </div>
    );
  };

  const expectedLo = isPortfolio ? (portfolioExpected?.lo ?? 100) : (wm?.lo ?? 0);
  const expectedHi = isPortfolio ? (portfolioExpected?.hi ?? 100) : (wm?.hi ?? 0);

  return (
    <div data-testid="market-impact-chart">
      {/* Asset selector tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {ASSETS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedTab(a.id)}
            className={`px-2.5 py-1 rounded-[10px] text-[11px] font-medium transition-colors ${
              selectedTab === a.id
                ? 'bg-[var(--sch-navy)] text-white'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {a.name}
          </button>
        ))}
        {portfolioWeights && (
          <button
            onClick={() => setSelectedTab('portfolio')}
            className={`px-2.5 py-1 rounded-[10px] text-[11px] font-medium transition-colors ${
              selectedTab === 'portfolio'
                ? 'bg-[var(--sch-blue)] text-white'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            Portfolio
          </button>
        )}
      </div>

      {/* Expected value summary */}
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-[13px] font-semibold">{displayName}</h4>
        <div className="flex items-baseline gap-3">
          {hasCurrentValue && (
            <span className="text-[11px] text-muted-foreground">
              {isPortfolio ? 'Base' : 'Current'}: <span className="font-semibold tabular-nums text-foreground">{isPortfolio ? '100' : asset!.format(currentValue)}</span>
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            Expected: <span className="font-bold tabular-nums text-[14px] text-foreground">{formatShortValue(expectedValue)}</span>
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ({formatShortValue(expectedLo)} – {formatShortValue(expectedHi)})
          </span>
        </div>
      </div>

      {/* KDE distribution curve */}
      <div className="h-[245px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveData} margin={{ top: 20, right: 10, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id={`kde-fill-${selectedTab}`} x1="0" y1="0" x2="0" y2="1">
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

            {/* Current / Base value line */}
            {hasCurrentValue && (
              <ReferenceLine
                x={currentValue}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{
                  value: isPortfolio ? 'Base (100)' : 'Current',
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
                value: `Expected: ${formatShortValue(expectedValue)}`,
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
              fill={`url(#kde-fill-${selectedTab})`}
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
            {isPortfolio ? 'Base level (100)' : 'Current level'}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-2 rounded-sm inline-block" style={{ backgroundColor: color, opacity: 0.3 }} />
          Probability distribution
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-2">
        {isPortfolio
          ? 'The curve shows the probability-weighted distribution of portfolio outcomes, rebased to 100. Each scenario contributes a blended return computed from your allocation weights across all asset classes. Oil and Gold are converted to percentage returns from current levels; Cash contributes 0%. All values are editorial estimates.'
          : <>The curve shows the probability-weighted distribution of outcomes. Each scenario
            contributes a Gaussian kernel centred on its expected value, weighted by its probability.
            {hasCurrentValue ? ' The thin dashed line marks the current market level.' : ''}
            {' '}The thick dashed line is the overall expected value. All values are editorial estimates.</>
        }
      </p>
    </div>
  );
});
