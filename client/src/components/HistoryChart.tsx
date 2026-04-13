import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SCENARIOS, SCENARIO_MAP, type ScenarioId } from '../lib/config';
import { computeHistoricalProbabilities } from '../lib/history';
import { ExternalLink } from 'lucide-react';

export const HistoryChart = memo(function HistoryChart() {

  const history = useMemo(() => computeHistoricalProbabilities(), []);

  const chartData = useMemo(
    () =>
      history.map(h => {
        const row: Record<string, any> = {
          date: h.date,
          label: h.label,
          detail: h.detail,
          source: h.source,
        };
        for (const s of SCENARIOS) {
          row[s.id] = Math.round((h.probs[s.id] ?? 0) * 1000) / 10; // percentage with 1 dp
        }
        return row;
      }),
    [history]
  );

  // Show top 5 scenarios to keep chart readable
  const visibleScenarios = useMemo(() => {
    return SCENARIOS.slice(0, 5); // deal, frozen, resumed, hormuz, dual — ordered by base prob impact
  }, []);

  // Format date for axis
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = chartData.find(d => d.date === label);
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-[280px]">
        <div className="text-[11px] text-muted-foreground mb-0.5">
          {new Date(label).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <div className="text-[12px] font-semibold mb-1.5">{item?.label}</div>
        <div className="space-y-0.5">
          {payload
            .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))
            .map((entry: any) => {
              const scenario = SCENARIO_MAP[entry.dataKey as ScenarioId];
              return (
                <div key={entry.dataKey} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: scenario?.color }}
                  />
                  <span className="flex-1 truncate">{scenario?.name}</span>
                  <span className="tabular-nums font-medium">
                    {entry.value.toFixed(1)}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
          Historical Scenario Probabilities — Timeline
        </h3>
        <span className="text-[10px] text-muted-foreground">
          Jun 2025 — Apr 2026
        </span>
      </div>

      <div className="border-t border-border/50">
          {/* Chart */}
          <div className="px-2 pt-3 pb-1">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
                  domain={[0, 45]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                {visibleScenarios.map(scenario => (
                  <Area
                    key={scenario.id}
                    type="monotone"
                    dataKey={scenario.id}
                    name={scenario.name}
                    stroke={scenario.color}
                    fill={scenario.color}
                    fillOpacity={0.08}
                    strokeWidth={2}
                    dot={{ r: 3, fill: scenario.color, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="px-4 pb-2 flex flex-wrap gap-x-4 gap-y-1">
            {visibleScenarios.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-3 h-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                {s.name}
              </div>
            ))}
          </div>

          {/* Event list */}
          <div className="px-4 py-2 border-t border-border/50 space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="tabular-nums text-muted-foreground flex-shrink-0 w-[68px]">
                  {new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
                <span className="font-medium flex-shrink-0">{h.label}</span>
                {h.source && (
                  <a href={h.source} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] flex-shrink-0">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Historical probabilities are retrospective estimates — slider positions at each date are
              inferred from events known at the time, then run through the same engine. They represent
              what the model would have computed given that information, not actual forecasts made at the time.
            </p>
          </div>
        </div>
    </div>
  );
});
