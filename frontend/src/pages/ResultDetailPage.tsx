import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Fingerprint, ShieldCheck, Trophy, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashChip } from "@/components/shared/HashChip";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { buildRandomness } from "@/lib/draw";
import { formatDateTime, formatTicketNumber, maskName } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import NotFound from "./NotFound";

const ResultDetailPage = () => {
  const { programId = "" } = useParams();
  const { getProgram } = useLottery();
  const program = getProgram(programId);

  if (!program) return <NotFound />;

  const published = program.status === "published" && program.publicSeed && program.winners;
  const grouped = (program.winners ?? []).reduce<Record<string, typeof program.winners>>((acc, winner) => {
    acc[winner.termLabel] = [...(acc[winner.termLabel] ?? []), winner];
    return acc;
  }, {});

  return (
    <div className="container py-10">
      <Link
        to="/ket-qua"
        className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tất cả kết quả
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-nums text-[12px] text-muted-foreground">{program.code}</span>
            <ProgramStatusBadge status={program.status} />
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Kết quả — {program.prizeName}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Thời gian quay: {formatDateTime(program.drawnAt ?? program.endAt)} · Công bố:{" "}
            {formatDateTime(program.publishedAt ?? program.drawnAt)}
          </p>
        </div>
        {published ? (
          <Button asChild variant="verified" size="lg">
            <Link to={`/xac-minh/${program.id}`}>
              <Fingerprint className="h-4 w-4" />
              Xác minh kết quả
            </Link>
          </Button>
        ) : null}
      </div>

      {!published ? (
        <div className="mt-8 rounded-xl border border-warning/40 bg-warning/10 px-6 py-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-warning" />
          <p className="mt-4 text-[15px] font-semibold">Kết quả chưa được công bố</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Ban tổ chức cần khoá bán, nhập public seed và công bố kết quả trên bàn quay số.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(grouped).map(([label, winners]) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-xl border border-gold/25 bg-gradient-panel p-6 shadow-e2"
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
                  aria-hidden
                />
                <Badge variant="soft" className="relative">
                  {label}
                </Badge>
                <div className="relative mt-4 space-y-4">
                  {(winners ?? []).map((winner) => (
                    <div key={`${winner.termId}-${winner.number}`}>
                      <p className="font-mono-nums animate-reveal text-[44px] font-extrabold leading-none tracking-[-0.02em] text-gradient-gold">
                        {formatTicketNumber(winner.number, program.numberLength)}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5" />
                        {maskName(winner.ownerName)}
                        <Badge variant={winner.status === "confirmed" ? "verified" : "outline"}>
                          {winner.status === "confirmed"
                            ? "Đã xác nhận"
                            : winner.status === "paid"
                              ? "Đã nhận thưởng"
                              : "Chờ xác nhận"}
                        </Badge>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-verified/25 bg-card p-6 shadow-e1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
                <ShieldCheck className="h-4 w-4 text-verified-text" />
                Hồ sơ minh bạch của chương trình
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link to={`/xac-minh/${program.id}`}>Tự tái kiểm chứng</Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <HashChip label="Commitment" value={program.commitHash} />
              <HashChip label="Public seed" value={program.publicSeed ?? ""} tone="verified" />
              <HashChip
                label="Randomness = SHA-256(commitment | seed)"
                value={buildRandomness(program.commitHash, program.publicSeed ?? "")}
                tone="verified"
              />
            </div>

            <div className="mt-5 rounded-md border border-border bg-secondary/30 px-5 py-4">
              <p className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground">Thuật toán</p>
              <p className="font-mono-nums mt-2 text-[13px] leading-relaxed text-foreground">
                randomness = SHA-256(commitment ‖ publicSeed)
                <br />
                số_trúng[i] = (int(randomness[i], 16) mod {program.totalNumbers}) + 1
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
                Trong đó randomness[i] là 13 ký tự hex đầu của SHA-256 của chuỗi
                “commitment|seed|giải|thứ tự”. Cùng commitment và seed luôn cho cùng kết quả.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ResultDetailPage;
