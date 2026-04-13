import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, ExternalLink, ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { Briefing } from '../lib/briefing';
import { SIGNAL_MAP, SCENARIO_MAP, type SignalId, type ScenarioId } from '../lib/config';

interface BriefingPanelProps {
  briefing: Briefing;
  briefingAge: string;
  onApplyEstimates: () => void;
}

export const BriefingPanel = memo(function BriefingPanel({
  briefing,
  briefingAge,
  onApplyEstimates,
}: BriefingPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const severityStyles = {
    normal: 'border-border bg-card',
    elevated: 'border-amber-500/30 bg-amber-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  const severityBadge = {
    normal: null,
    elevated: (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-3 h-3" /> Elevated
      </span>
    ),
    critical: (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-600 dark:text-red-400">
        <AlertTriangle className="w-3 h-3" /> Critical
      </span>
    ),
  };

  return (
    <div
      className={`border overflow-hidden transition-all ${severityStyles[briefing.severity]}`}
      data-testid="briefing-panel"
    >
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <h2 className="text-[13px] font-semibold truncate">
            {briefing.title}
          </h2>
          {severityBadge[briefing.severity]}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {briefingAge}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          {/* News Items */}
          <div className="px-4 py-3 space-y-3">
            <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
              Latest Developments
            </h3>
            {briefing.items.map((item, i) => {
              const signal = SIGNAL_MAP[item.signalId];
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${signal.actorColor}14`,
                        color: signal.actorColor,
                      }}
                    >
                      {signal.question}
                    </span>
                    <span className="text-[12px] font-semibold leading-snug">{item.headline}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed ml-0">
                    {item.detail}
                  </p>
                  <div className="flex gap-2 ml-0">
                    {item.sources.map((src, j) => (
                      <a
                        key={j}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-[hsl(var(--primary))] hover:underline"
                      >
                        {src.name}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Probability Shifts */}
          <div className="px-4 py-3 border-t border-border/50">
            <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Decision Point Shifts
            </h3>
            <div className="space-y-1.5">
              {briefing.sliderShifts
                .filter(s => Math.abs(s.magnitude) >= 5)
                .sort((a, b) => Math.abs(b.magnitude) - Math.abs(a.magnitude))
                .map(shift => {
                  const signal = SIGNAL_MAP[shift.signalId];
                  const isRight = shift.direction === 'right';
                  return (
                    <div key={shift.signalId} className="flex items-center gap-2 text-[12px]">
                      <span className="w-[140px] flex-shrink-0 truncate font-medium">
                        {signal.question}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="tabular-nums text-muted-foreground w-6 text-right">
                          {shift.previousEstimate}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={`tabular-nums font-semibold w-6 ${isRight ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {shift.newEstimate}
                        </span>
                        {isRight ? (
                          <TrendingUp className="w-3 h-3 text-red-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                      <span className="text-muted-foreground flex-1 truncate hidden sm:inline">
                        {shift.reasoning}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Scenario Impact */}
          <div className="px-4 py-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                Scenario Probability Impact
              </h3>
              <button
                className="text-[11px] font-medium text-[hsl(var(--primary))] hover:underline"
                onClick={onApplyEstimates}
              >
                Apply briefing estimates to sliders
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
              {briefing.scenarioShifts.map(shift => {
                const scenario = SCENARIO_MAP[shift.scenarioId];
                const delta = shift.updatedProb - shift.previousProb;
                return (
                  <div key={shift.scenarioId} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <span className="truncate flex-1">{scenario.name}</span>
                    <span className="tabular-nums font-semibold flex-shrink-0">
                      {shift.updatedProb}%
                    </span>
                    {delta !== 0 && (
                      <span className={`tabular-nums flex-shrink-0 ${delta > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              Briefing estimates are model-derived from news analysis and prediction market data.
              They represent a structured assessment, not a forecast. Apply to sliders to see the
              implied scenario distribution, or set your own positions based on your judgement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
