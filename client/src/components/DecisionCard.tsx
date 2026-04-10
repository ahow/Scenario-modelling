import { memo, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { type Signal, type SignalId } from "../lib/config";

interface DecisionCardProps {
  signal: Signal;
  position: number; // 0–100 slider value
  onPositionChange: (signalId: SignalId, position: number) => void;
}

export const DecisionCard = memo(function DecisionCard({
  signal,
  position,
  onPositionChange,
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

  // Compute which pole is dominant for visual feedback
  const leftDominant = position < 45;
  const rightDominant = position > 55;
  const centered = !leftDominant && !rightDominant;

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isMoved
          ? "border-[hsl(var(--primary)/.25)] bg-card shadow-sm"
          : "border-border/50 bg-card/50"
      }`}
      data-testid={`decision-${signal.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
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
          </div>
        </div>
        {isMoved && (
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ml-2"
            onClick={handleReset}
            data-testid={`reset-${signal.id}`}
          >
            Reset
          </button>
        )}
      </div>

      {/* Context text */}
      <div className="px-3 pb-2">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {signal.context}
        </p>
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

          {/* Hidden range input */}
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={handleChange}
            className="absolute inset-x-0 h-8 opacity-0 cursor-pointer"
            data-testid={`slider-${signal.id}`}
          />

          {/* Visible thumb */}
          <div
            className="absolute w-4 h-4 rounded-full border-2 transition-all duration-100 pointer-events-none -ml-2"
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
