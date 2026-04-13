import { memo, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import { ASSETS, ASSET_MAP, type AssetId } from '../lib/config';
import { computeHistoricalMarketOutcomes } from '../lib/history';

const ASSET_COLORS: Record<AssetId, string> = {
  oil: '#D85A30',
  sp500: '#3266AD',
  treasury: '#888780',
  dxy: '#534AB7',
  gold: '#E9AB2E',
};

export const HistoryMarketChart = memo(function HistoryMarketChart() {
  const [selectedAsset, setSelectedAsset] = useState<AssetId>('oil');

  const history = useMemo(() => computeHistoricalMarketOutcomes(), []);

  const chartData = useMemo(
    () =>
      history.map(h => {
        const row: Record<string, any> = {
          date: h.date,
          label: h.label,
        };
        for (const asset of ASSETS) {
          const m = h.markets[asset.id];
          row[`${asset.id}_expected`] = Math.round(m.expected * 100) / 100;
          row[`${asset.id}_lo`] = Math.round(m.lo * 100) / 100;
          row[`${asset.id}_hi`] = Math.round(m.hi * 100) / 100;
          // For the Area component, we need a range array [lo, hi]
          row[`${asset.id}_range`] = [Math.round(m.lo * 100) / 100, Math.round(m.hi * 100) / 100];
        }
        return row;
      }),
    [history]
  );

  const asset = ASSET_MAP[selectedAsset];
  const color = ASSET_COLORS[selectedAsset];

  // Compute domain
  const allHi = chartData.map(d => d[`${selectedAsset}_hi`]);
  const allLo = chartData.map(d => d[`${selectedAsset}_lo`]);
  const yMin = Math.floor(Math.min(...allLo) * 0.95);
  const yMax = Math.ceil(Math.max(...allHi) * 1.05);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = chartData.find(d => d.date === label);
    const expected = item?.[`${selectedAsset}_expected`];
    const lo = item?.[`${selectedAsset}_lo`];
    const hi = item?.[`${selectedAsset}_hi`];

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-[240px]">
        <div className="text-[11px] text-muted-foreground mb-0.5">
          {new Date(label).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <div className="text-[12px] font-semibold mb-1">{item?.label}</div>
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between gap-4">
            <span>Expected</span>
            <span className="font-semibold tabular-nums">{asset.format(expected)}</span>
          </div>
          <div className="flex justify-between gap-4 text-muted-foreground">
            <span>±1σ range</span>
            <span className="tabular-nums">{asset.formatShort(lo)} – {asset.formatShort(hi)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Historical Market Outcomes — Timeline
        </h3>
        <span className="text-[10px] text-muted-foreground">
          Expected value ± 1σ
        </span>
      </div>

      <div className="border-t border-border/50">
          {/* Asset selector tabs */}
          <div className="px-4 pt-2 pb-1 flex gap-1 flex-wrap">
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

          {/* Chart */}
          <div className="px-2 pt-2 pb-1">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  domain={[yMin, yMax]}
                  tickFormatter={v => asset.formatShort(v)}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* \u00b11 std deviation band */}
                <Area
                  type="monotone"
                  dataKey={`${selectedAsset}_range`}
                  fill={color}
                  fillOpacity={0.12}
                  stroke="none"
                />

                {/* Expected value line */}
                <Line
                  type="monotone"
                  dataKey={`${selectedAsset}_expected`}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="px-4 pb-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              Expected value
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-2 rounded-sm opacity-20" style={{ backgroundColor: color }} />
              ±1 std deviation
            </div>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Expected values are probability-weighted midpoints across all scenarios.
              The shaded band represents ± one standard deviation — a measure of outcome dispersion
              reflecting how concentrated or spread the probability distribution is across scenarios
              with different market impacts. Wider bands indicate greater uncertainty. All values
              are model estimates based on retrospective slider positions.
            </p>
          </div>
        </div>
    </div>
  );
});
