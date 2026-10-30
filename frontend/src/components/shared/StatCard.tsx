import type { LucideIcon } from "lucide-react";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  hint?: string;
  decimals?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  suffix,
  prefix,
  icon: Icon,
  hint,
  decimals = 0,
  className,
}: StatCardProps) {
  const { value: animated, ref } = useCountUp(value);

  return (
    <div
      ref={ref}
      className={cn(
        "group rounded-lg border border-border bg-card p-5 shadow-e1 transition-all duration-200 ease-standard hover:-translate-y-[2px] hover:border-gold/35 hover:shadow-e2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
        <span className="rounded-sm bg-secondary p-1.5 text-gold transition-colors duration-200 group-hover:bg-primary/15">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        {prefix ? <span className="font-mono-nums text-sm text-muted-foreground">{prefix}</span> : null}
        <span className="font-mono-nums text-3xl font-bold leading-none tracking-[-0.02em] text-foreground">
          {animated.toLocaleString("vi-VN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </span>
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      {hint ? <p className="mt-2 text-[13px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
