import { useNow } from "@/hooks/use-now";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CountdownTextProps {
  target: number;
  className?: string;
  overLabel?: string;
}

export function CountdownText({ target, className, overLabel = "Đã kết thúc" }: CountdownTextProps) {
  const now = useNow(1000);
  const remaining = target - now;

  return (
    <span
      className={cn(
        "font-mono-nums tabular-nums",
        remaining <= 0 && "text-muted-foreground",
        remaining > 0 && remaining < 60 * 60 * 1000 && "text-warning",
        className,
      )}
    >
      {remaining > 0 ? formatDuration(remaining) : overLabel}
    </span>
  );
}
