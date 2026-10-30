import {
  Banknote,
  Car,
  Home,
  Plane,
  Smartphone,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

import type { PrizeCategory, Program } from "@/data/types";
import { cn } from "@/lib/utils";

const categoryVisual: Record<PrizeCategory, { gradient: string; icon: LucideIcon; tone: string }> = {
  tech: { gradient: "bg-gradient-tech", icon: Smartphone, tone: "text-gold" },
  vehicle: { gradient: "bg-gradient-vehicle", icon: Car, tone: "text-ticket-other-fg" },
  cash: { gradient: "bg-gradient-cash", icon: Banknote, tone: "text-gold-soft" },
  travel: { gradient: "bg-gradient-travel", icon: Plane, tone: "text-verified-text" },
  home: { gradient: "bg-gradient-home", icon: Home, tone: "text-verified-text" },
  other: { gradient: "bg-gradient-other", icon: Sparkles, tone: "text-foreground" },
};

const sizes = {
  sm: { frame: "h-32", icon: "h-11 w-11" },
  md: { frame: "h-44", icon: "h-16 w-16" },
  lg: { frame: "h-64 sm:h-72", icon: "h-24 w-24" },
} as const;

interface PrizeArtProps {
  program: Program;
  size?: keyof typeof sizes;
  className?: string;
  showMediaLabel?: boolean;
}

/** Hình ảnh đại diện giải thưởng được dựng thuần bằng design token (không dùng ảnh ngoài). */
export function PrizeArt({ program, size = "md", className, showMediaLabel = true }: PrizeArtProps) {
  const visual = categoryVisual[program.category] ?? categoryVisual.other;
  const Icon = visual.icon;
  const dimension = sizes[size];

  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden rounded-lg border border-border",
        visual.gradient,
        dimension.frame,
        className,
      )}
    >
      <div className="surface-grid-lines absolute inset-0 opacity-30" aria-hidden />
      <div
        className="absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-16 right-0 h-40 w-40 rounded-full bg-ticket-other-bg/50 blur-3xl"
        aria-hidden
      />
      <Icon
        className={cn(
          "animate-float relative z-10 drop-shadow-[0_10px_30px_hsl(224_60%_2%/0.7)]",
          visual.tone,
          dimension.icon,
        )}
        strokeWidth={1.4}
      />
      <span className="absolute left-3 top-3 rounded-full border border-border bg-background/70 px-2.5 py-1 font-mono-nums text-[11px] font-semibold tracking-[0.08em] text-muted-foreground backdrop-blur">
        {program.code}
      </span>
      {showMediaLabel && program.mediaName ? (
        <span className="absolute bottom-3 left-3 flex max-w-[70%] items-center gap-1.5 truncate rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
          {program.mediaKind === "video" ? <Video className="h-3 w-3" /> : null}
          <span className="truncate">{program.mediaName}</span>
        </span>
      ) : null}
    </div>
  );
}
