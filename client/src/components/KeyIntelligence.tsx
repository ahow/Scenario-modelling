import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type SignalId,
  type ScenarioId,
  SIGNAL_MAP,
  SCENARIO_MAP,
  KEY_INFO_POINTS,
} from "../lib/config";
import { computeSensitivity, getBaseProbs, computeProbs } from "../lib/engine";
import { AlertTriangle, Eye, Radio } from "lucide-react";

interface KeyIntelligenceProps {
  selections: Record<SignalId, string>;
}

export const KeyIntelligence = memo(function KeyIntelligence({
  selections,
}: KeyIntelligenceProps) {
  const baseProbs = useMemo(() => getBaseProbs(), []);
  const sensitivity = useMemo(
    () => computeSensitivity(selections, baseProbs),
    [selections, baseProbs]
  );

  return (
    <div className="space-y-4" data-testid="key-intelligence">
      {/* Sensitivity Analysis - my addition */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Sensitivity Analysis
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Which signals currently have the most leverage on the probability distribution?
            Ranked by the maximum probability swing each signal can produce.
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {sensitivity.map((s, i) => {
              const signal = SIGNAL_MAP[s.signalId];
              const scenario = SCENARIO_MAP[s.mostAffectedScenario];
              const swingPct = (s.maxSwing * 100).toFixed(1);
              const isSet = selections[s.signalId] !== "unknown";

              return (
                <div
                  key={s.signalId}
                  className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  data-testid={`sensitivity-${s.signalId}`}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[11px] font-semibold tabular-nums">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {signal.question}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 border-0"
                        style={{
                          backgroundColor: `${signal.actorColor}15`,
                          color: signal.actorColor,
                        }}
                      >
                        {signal.actor}
                      </Badge>
                      {isSet && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                        >
                          Set
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Max swing: <span className="font-medium tabular-nums">{swingPct}pp</span> on{" "}
                      <span
                        className="font-medium"
                        style={{ color: scenario.color }}
                      >
                        {scenario.name}
                      </span>
                    </p>
                  </div>
                  {/* Swing bar */}
                  <div className="w-16 flex-shrink-0 pt-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 dark:bg-amber-400"
                        style={{
                          width: `${Math.min(
                            (s.maxSwing / sensitivity[0].maxSwing) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Information Points */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            Key Information Points
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            The nine observable signals ranked by discriminatory power.
            Monitor these to maximise forecast certainty.
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-3">
            {KEY_INFO_POINTS.map((kip) => {
              const signal = SIGNAL_MAP[kip.signalId];
              const currentValue = selections[kip.signalId];
              const isSet = currentValue !== "unknown";
              const currentOption = signal.options.find(
                (o) => o.value === currentValue
              );

              return (
                <div
                  key={kip.rank}
                  className="py-2 border-b border-border/50 last:border-0"
                  data-testid={`kip-${kip.rank}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                      <span className="text-[11px] font-semibold tabular-nums text-white">
                        {kip.rank}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {kip.label}
                        </span>
                        {isSet && currentOption && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5"
                          >
                            <Radio className="w-2.5 h-2.5 mr-1" />
                            {currentOption.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {kip.whatToMonitor}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Sources: {kip.dataSources}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
