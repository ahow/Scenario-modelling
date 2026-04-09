import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type SignalId, SIGNALS } from "../lib/config";

interface SignalBoardProps {
  selections: Record<SignalId, string>;
  onSignalChange: (signalId: SignalId, value: string) => void;
}

export const SignalBoard = memo(function SignalBoard({
  selections,
  onSignalChange,
}: SignalBoardProps) {
  // Group signals by actor
  const actorGroups = SIGNALS.reduce(
    (acc, signal) => {
      if (!acc[signal.actor]) acc[signal.actor] = [];
      acc[signal.actor].push(signal);
      return acc;
    },
    {} as Record<string, typeof SIGNALS>
  );

  return (
    <div className="space-y-3" data-testid="signal-board">
      {Object.entries(actorGroups).map(([actor, signals]) => (
        <Card key={actor} className="overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] font-medium px-2 py-0 h-5 border-0"
                style={{
                  backgroundColor: `${signals[0].actorColor}18`,
                  color: signals[0].actorColor,
                }}
              >
                {actor}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {signals.map((signal) => (
              <div key={signal.id}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {signal.question}
                </p>
                <div className="space-y-1" role="radiogroup" aria-label={signal.question}>
                  {signal.options.map((option) => {
                    const isSelected =
                      selections[signal.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        role="radio"
                        aria-checked={isSelected}
                        className={`signal-option w-full text-left px-3 py-2 rounded-md border cursor-pointer flex items-start gap-2 ${
                          isSelected
                            ? "selected"
                            : "border-transparent"
                        }`}
                        onClick={() =>
                          onSignalChange(signal.id, option.value)
                        }
                        data-testid={`radio-${signal.id}-${option.value}`}
                      >
                        <div
                          className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                              : "border-[hsl(var(--input))]"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm leading-tight block">
                            {option.label}
                          </span>
                          {option.subLabel && option.value !== "unknown" && (
                            <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                              {option.subLabel}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
