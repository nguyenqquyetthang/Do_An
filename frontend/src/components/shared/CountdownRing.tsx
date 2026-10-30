import { useNow } from "@/hooks/use-now";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CountdownRingProps {
  target: number;
  total: number;
  label?: string;
  size?: number;
  className?: string;
  compact?: boolean;
}

export function CountdownRing({
  target,
  total,
  label,
  size = 128,
  className,
  compact = false,
}: CountdownRingProps) {
  const now = useNow(1000);
  const remaining = Math.max(0, target - now);
  const progress = total > 0 ? Math.min(1, remaining / total) : 0;

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const urgent = remaining <= 30_000;
  const warning = remaining <= 120_000;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={6}
            className="stroke-secondary"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className={cn(
              "stroke-current transition-[stroke-dashoffset] duration-1000 ease-linear",
              urgent ? "text-destructive-text" : warning ? "text-warning" : "text-gold",
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-mono-nums font-bold tabular-nums",
              compact ? "text-lg" : "text-xl",
              urgent ? "animate-tick text-destructive-text" : warning ? "text-warning" : "text-foreground",
            )}
          >
            {formatDuration(remaining)}
          </span>
          {label ? (
            <span className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
