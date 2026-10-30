import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  Fingerprint,
  Hash,
  Info,
  ListOrdered,
  ShieldCheck,
  Ticket,
  Timer,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CountdownText } from "@/components/shared/CountdownText";
import { HashChip } from "@/components/shared/HashChip";
import { PrizeArt } from "@/components/shared/PrizeArt";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { useLottery } from "@/store/lottery";
import { formatDateTime, formatNumber, formatPoints, formatTicketNumber } from "@/lib/format";
import NotFound from "./NotFound";

const ProgramDetailPage = () => {
  const { programId = "" } = useParams();
  const { getProgram, programStats } = useLottery();
  const program = getProgram(programId);

  if (!program) return <NotFound />;

  const stats = programStats(program.id);
  const remaining = Math.max(0, program.totalNumbers - stats.sold);
  const isOpen = program.status === "active";

  return (
    <div className="container py-8">
      <Link
        to="/chuong-trinh"
        className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Danh sách chương trình
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-nums rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground">
              Chương trình {program.code}
            </span>
            <ProgramStatusBadge status={program.status} />
            <span className="text-[12px] text-muted-foreground">Ban tổ chức: {program.organizer}</span>
          </div>

          <h1 className="mt-4 text-[30px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[38px]">
            {program.prizeName}
          </h1>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
            {program.description}
          </p>

          <PrizeArt program={program} size="lg" className="mt-6" />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Giá trị giải thưởng", value: formatPoints(program.prizeValue), icon: Trophy, tone: "text-gold" },
              { label: "Giá mỗi số", value: formatPoints(program.ticketPrice), icon: CircleDollarSign, tone: "text-foreground" },
              { label: "Tổng số dự thưởng", value: `${formatNumber(program.totalNumbers)} số`, icon: Hash, tone: "text-foreground" },
              { label: "Số còn trống", value: `${formatNumber(remaining)} số`, icon: Ticket, tone: "text-verified-text" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-card p-4 shadow-e1">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <p className={`font-mono-nums mt-2 text-lg font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="text-lg font-bold tracking-[-0.01em]">Cơ cấu giải thưởng</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[12px] uppercase tracking-[0.08em]">Giải</TableHead>
                    <TableHead className="text-[12px] uppercase tracking-[0.08em]">Số lượng</TableHead>
                    <TableHead className="text-[12px] uppercase tracking-[0.08em]">Giá trị / giải</TableHead>
                    <TableHead className="text-right text-[12px] uppercase tracking-[0.08em]">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {program.prizeTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.label}</TableCell>
                      <TableCell className="font-mono-nums">{term.quantity}</TableCell>
                      <TableCell className="font-mono-nums">{formatPoints(term.value)}</TableCell>
                      <TableCell className="font-mono-nums text-right font-semibold text-gold">
                        {formatPoints(term.value * term.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
                <ListOrdered className="h-4 w-4 text-gold" />
                Thể lệ tham gia
              </h2>
              <ul className="mt-4 space-y-3">
                {program.rules.map((rule) => (
                  <li key={rule} className="flex gap-3 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
                <Fingerprint className="h-4 w-4 text-gold" />
                Cách quay số
              </h2>
              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{program.drawMethod}</p>
              <div className="mt-4 space-y-3">
                <HashChip label="Commitment (công bố trước khi mở bán)" value={program.commitHash} />
                <HashChip
                  label="Public seed"
                  value={program.publicSeed ?? "Chưa công bố — sẽ công bố sau khi khoá bán"}
                  tone={program.publicSeed ? "verified" : "default"}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {program.status === "published" ? (
                  <>
                    <Button asChild variant="verified" size="sm">
                      <Link to={`/xac-minh/${program.id}`}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Xác minh kết quả
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/ket-qua/${program.id}`}>Xem kết quả</Link>
                    </Button>
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                    Kết quả sẽ được công bố sau khi khoá bán.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-gold/25 bg-gradient-panel p-6 shadow-e2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Tiến độ bán vé
              </span>
              <span className="font-mono-nums text-[13px] font-semibold text-gold">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="mt-3" />
            <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
              <span className="font-mono-nums">
                Đã đặt {formatNumber(stats.sold)} / {formatNumber(program.totalNumbers)}
              </span>
              <span className="font-mono-nums">Còn {formatNumber(remaining)}</span>
            </div>

            <Separator className="my-5" />

            <dl className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Mở bán
                </dt>
                <dd className="font-mono-nums">{formatDateTime(program.startAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Khoá bán
                </dt>
                <dd className="font-mono-nums">{formatDateTime(program.endAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  {isOpen ? "Còn lại" : "Trạng thái"}
                </dt>
                <dd className="font-mono-nums">
                  {isOpen ? (
                    <CountdownText target={new Date(program.endAt).getTime()} />
                  ) : (
                    <ProgramStatusBadge status={program.status} />
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-md border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Giá mỗi số</span>
                <span className="font-mono-nums font-bold text-gold">
                  {formatPoints(program.ticketPrice)}
                </span>
              </div>
              <Badge variant="outline" className="mt-3">
                Tối đa 10 số / đơn
              </Badge>
            </div>

            {isOpen ? (
              <Button asChild size="lg" className="mt-5 w-full">
                <Link to={`/chuong-trinh/${program.id}/chon-so`}>
                  <Ticket className="h-4 w-4" />
                  Chọn số dự thưởng
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="mt-5 w-full" disabled>
                {program.status === "closed" ? "Đã khoá bán" : "Chưa mở bán"}
              </Button>
            )}
          </div>

          {program.winners && program.winners.length > 0 ? (
            <div className="mt-4 rounded-xl border border-verified/25 bg-card p-5 shadow-e1">
              <Badge variant="verified">Kết quả đã công bố</Badge>
              <ul className="mt-4 space-y-2.5">
                {program.winners.slice(0, 4).map((winner) => (
                  <li key={`${winner.termId}-${winner.number}`} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-muted-foreground">{winner.termLabel}</span>
                    <span className="font-mono-nums text-[15px] font-bold text-gold">
                      {formatTicketNumber(winner.number, program.numberLength)}
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link to={`/ket-qua/${program.id}`}>Xem toàn bộ kết quả</Link>
              </Button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default ProgramDetailPage;
