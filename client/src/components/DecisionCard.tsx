import { memo, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Bot } from "lucide-react";
import { type Signal, type SignalId } from "../lib/config";

export interface AnchorMarker {
  position: number;    // 0–100
  source: string;      // e.g. "Polymarket", "Briefing", "Estimated"
  tooltip: string;     // detailed hover text
  tier: 1 | 2 | 3;    // 1=observable, 2=prediction market, 3=estimate
}

interface DecisionCardProps {
  signal: Signal;
  position: number;
  onPositionChange: (signalId: SignalId, position: number) => void;
  anchor?: AnchorMarker;
  isEndogenous?: boolean;
  isLocked?: boolean;
  onToggleLock?: (signalId: SignalId) => void;
  endogenousLabel?: string;
  reactionDrivers?: string;
}

export const DecisionCard = memo(function DecisionCard({
  signal,
  position,
  onPositionChange,
  anchor,
  isEndogenous,
  isLocked,
  onToggleLock,
  endogenousLabel,
  reactionDrivers,
}: DecisionCardProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const isMoved = position !== 50;
  const hasCenter = signal.anchors.length === 3;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPositionChange(signal.id, Number(e.target.value));
    },
    [signal.id, onPositionChange]
  );

  const handleReset = useCallback(() => {
    onPositionChange(signal.id, 50);
  }, [signal.id, onPositionChange]);

  const leftDominant = position < 45;
  const rightDominant = position > 55;
  const centered = !leftDominant && !rightDominant;

  const tierColors = {
    1: 'bg-emerald-500',
    2: 'bg-blue-500',
    3: 'bg-amber-500',
  };

  return (
    <div
      className={`border transition-all duration-200 ${
        isEndogenous && !isLocked
          ? "border-dashed border-[hsl(var(--primary)/.2)] bg-card/70"
          : isMoved
            ? "border-[hsl(var(--primary)/.25)] bg-card shadow-sm"
            : "border-border/50 bg-card/50"
      }`}
      data-testid={`decision-${signal.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] font-medium px-1.5 py-0 h-[18px] border-0 flex-shrink-0"
              style={{
                backgroundColor: `${signal.actorColor}14`,
                color: signal.actorColor,
              }}
            >
              {signal.actor}
            </Badge>
            <span className="text-[13px] font-semibold">{signal.question}</span>
            {isEndogenous && !isLocked && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)] px-1.5 py-0.5 rounded">
                <Bot className="w-3 h-3" />
                Auto
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isEndogenous && onToggleLock && (
            <button
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              onClick={() => onToggleLock(signal.id)}
              title={isLocked ? "Unlock — let model auto-compute" : "Lock — set your own value"}
              data-testid={`lock-${signal.id}`}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}
          {(isMoved || (isEndogenous && isLocked)) && (
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors"
              onClick={handleReset}
              data-testid={`reset-${signal.id}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Context text */}
      <div className="px-3 pb-2">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {signal.context}
        </p>
        {/* Endogenous reaction function description */}
        {isEndogenous && reactionDrivers && (
          <p className="text-[11px] text-[hsl(var(--primary)/.7)] leading-relaxed mt-1 italic">
            {isLocked ? "Override active — model auto-compute disabled." : reactionDrivers}
          </p>
        )}
      </div>

      {/* Spectrum slider */}
      <div className="px-3 pb-3">
        {/* Labels row */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-[11px] transition-colors max-w-[40%] ${
              leftDominant
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {signal.leftLabel}
          </span>
          {hasCenter && (
            <span
              className={`text-[11px] transition-colors text-center ${
                centered && isMoved
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {signal.centerLabel}
            </span>
          )}
          <span
            className={`text-[11px] text-right transition-colors max-w-[40%] ${
              rightDominant
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {signal.rightLabel}
          </span>
        </div>

        {/* Slider track */}
        <div className="relative h-8 flex items-center">
          {/* Background track */}
          <div className="absolute inset-x-0 h-2 bg-muted rounded-full" />

          {/* Filled portion — grows from centre */}
          <div
            className="absolute h-2 rounded-full transition-all duration-100"
            style={{
              backgroundColor: signal.actorColor,
              opacity: isMoved ? 0.7 : 0.15,
              left: position < 50 ? `${position}%` : '50%',
              right: position > 50 ? `${100 - position}%` : '50%',
            }}
          />

          {/* Centre tick mark */}
          <div className="absolute left-1/2 -translate-x-px w-0.5 h-3 bg-muted-foreground/20 rounded-full" />

          {/* Anchor marker (best estimate indicator) */}
          {anchor && (
            <div
              className="absolute flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${anchor.position}%` }}
              title={anchor.tooltip}
            >
              {/* Diamond marker */}
              <div
                className={`w-2.5 h-2.5 rotate-45 ${tierColors[anchor.tier]} opacity-80 -mt-0.5`}
                style={{ marginLeft: '-5px' }}
              />
              {/* Source label below track */}
              <span className="text-[8px] text-muted-foreground mt-2 whitespace-nowrap">
                {anchor.source}
              </span>
            </div>
          )}

          {/* Hidden range input */}
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={handleChange}
            disabled={isEndogenous && !isLocked}
            className={`absolute inset-x-0 h-8 opacity-0 ${
              isEndogenous && !isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            data-testid={`slider-${signal.id}`}
          />

          {/* Visible thumb */}
          <div
            className={`absolute w-4 h-4 rounded-full border-2 transition-all duration-100 pointer-events-none -ml-2 ${
              isEndogenous && !isLocked ? 'border-dashed' : ''
            }`}
            style={{
              left: `${position}%`,
              borderColor: signal.actorColor,
              backgroundColor: isMoved ? signal.actorColor : 'hsl(var(--background))',
            }}
          />
        </div>
      </div>
    </div>
  );
});
