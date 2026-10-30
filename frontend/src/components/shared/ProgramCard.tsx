import { ArrowUpRight, Clock, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CountdownText } from "@/components/shared/CountdownText";
import { PrizeArt } from "@/components/shared/PrizeArt";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { useLottery } from "@/store/lottery";
import { formatNumber, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Program } from "@/data/types";

interface ProgramCardProps {
  program: Program;
  className?: string;
}

export function ProgramCard({ program, className }: ProgramCardProps) {
  const { programStats } = useLottery();
  const stats = programStats(program.id);
  const remaining = Math.max(0, program.totalNumbers - stats.sold);
  const isOpen = program.status === "active";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-e1 transition-all duration-200 ease-standard hover:-translate-y-[3px] hover:border-gold/35 hover:shadow-e2",
        className,
      )}
    >
      <PrizeArt program={program} size="md" className="rounded-b-none border-0 border-b border-border" />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-snug">{program.name}</h3>
            <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
              Giải thưởng: {program.prizeName}
            </p>
          </div>
          <ProgramStatusBadge status={program.status} className="shrink-0" />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-[13px]">
          <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Giá trị giải</dt>
            <dd className="font-mono-nums mt-0.5 text-sm font-semibold text-gold">
              {formatPoints(program.prizeValue)}
            </dd>
          </div>
          <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">1 số</dt>
            <dd className="font-mono-nums mt-0.5 text-sm font-semibold">{formatPoints(program.ticketPrice)}</dd>
          </div>
        </dl>

        <div>
          <div className="mb-2 flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="font-mono-nums">
              Đã đặt {formatNumber(stats.sold)} / {formatNumber(program.totalNumbers)} số
            </span>
            <span className="font-mono-nums">{stats.progress}%</span>
          </div>
          <Progress value={stats.progress} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-[12px] text-muted-foreground">
            {isOpen ? (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5" />
                Còn <CountdownText target={new Date(program.endAt).getTime()} />
              </span>
            ) : (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Ticket className="h-3.5 w-3.5" />
                Còn {formatNumber(remaining)} số
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <Badge variant="soft" className="hidden sm:inline-flex">
                {formatNumber(remaining)} số trống
              </Badge>
            ) : null}
            <Button asChild size="sm" variant={isOpen ? "default" : "outline"}>
              <Link to={`/chuong-trinh/${program.id}`}>
                {isOpen ? "Chọn số" : "Xem chi tiết"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
