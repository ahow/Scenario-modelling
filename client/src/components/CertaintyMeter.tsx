import { Progress } from "@/components/ui/progress";

interface CertaintyMeterProps {
  count: number;
  total: number;
}

const LABELS = ["Low", "Low", "Low", "Moderate", "Moderate", "Moderate", "Good", "Good", "High", "Full"];

export function CertaintyMeter({ count, total }: CertaintyMeterProps) {
  const pct = (count / total) * 100;
  const label = LABELS[count] || "Full";

  return (
    <div className="hidden sm:flex items-center gap-2 mr-2" data-testid="certainty-meter">
      <div className="w-20">
        <Progress value={pct} className="h-1.5" />
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
        {count}/{total} signals — {label}
      </span>
    </div>
  );
}
