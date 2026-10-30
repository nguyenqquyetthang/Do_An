import { Link } from "react-router-dom";
import { ArrowRight, Clock, Sparkles, Ticket, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CountdownRing } from "@/components/shared/CountdownRing";
import { HashChip } from "@/components/shared/HashChip";
import { PrizeArt } from "@/components/shared/PrizeArt";
import { useLottery } from "@/store/lottery";
import { formatNumber, formatPoints } from "@/lib/format";
import type { Program } from "@/data/types";

export function FeaturedSpotlight({ program }: { program?: Program }) {
  const { programStats } = useLottery();

  if (!program) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-e2">
        <div>
          <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Chưa có chương trình đang mở</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Các chương trình sẽ xuất hiện tại đây sau khi được Admin phê duyệt.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/chuong-trinh">Xem danh sách chương trình</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = programStats(program.id);
  const remaining = Math.max(0, program.totalNumbers - stats.sold);
  const startAt = new Date(program.startAt).getTime();
  const endAt = new Date(program.endAt).getTime();

  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/25 bg-gradient-panel p-5 shadow-e2 sm:p-6">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <Badge variant="soft">
          <Sparkles className="h-3 w-3" />
          Giải thưởng nổi bật
        </Badge>
        <span className="font-mono-nums text-[12px] text-muted-foreground">{program.code}</span>
      </div>

      <div className="relative mt-4 grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
        <PrizeArt program={program} size="md" className="h-full min-h-[176px]" />

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold leading-tight tracking-[-0.015em]">{program.prizeName}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Giá trị giải thưởng{" "}
              <span className="font-mono-nums font-semibold text-gold">{formatPoints(program.prizeValue)}</span>
            </p>
          </div>

          <CountdownRing
            target={endAt}
            total={Math.max(1, endAt - startAt)}
            label="Còn lại"
            size={124}
            className="items-start"
          />

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-md border border-border bg-background/60 px-3 py-2">
              <p className="text-muted-foreground">Giá mỗi số</p>
              <p className="font-mono-nums mt-0.5 text-sm font-semibold">
                {formatPoints(program.ticketPrice)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-background/60 px-3 py-2">
              <p className="text-muted-foreground">Số còn trống</p>
              <p className="font-mono-nums mt-0.5 text-sm font-semibold">{formatNumber(remaining)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="font-mono-nums">
            Đã đặt {formatNumber(stats.sold)} / {formatNumber(program.totalNumbers)} số
          </span>
          <span className="flex items-center gap-1.5 font-mono-nums">
            <TrendingUp className="h-3.5 w-3.5" />
            {stats.progress}%
          </span>
        </div>
        <Progress value={stats.progress} />
      </div>

      <div className="relative mt-5 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link to={`/chuong-trinh/${program.id}/chon-so`}>
            <Ticket className="h-4 w-4" />
            Chọn số dự thưởng
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to={`/chuong-trinh/${program.id}`}>
            Xem chương trình
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <HashChip label="Commitment đã công bố" value={program.commitHash} className="flex-1" />
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Quay sau khi khoá bán
        </span>
      </div>
    </div>
  );
}
