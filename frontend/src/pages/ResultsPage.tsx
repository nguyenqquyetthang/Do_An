import { Link } from "react-router-dom";
import { Fingerprint, ShieldCheck, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashChip } from "@/components/shared/HashChip";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";

const ResultsPage = () => {
  const { programs } = useLottery();
  const finished = programs
    .filter((program) => program.status === "published" || program.status === "closed")
    .sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime());

  const published = finished.filter((program) => program.status === "published");

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Kết quả quay số</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Mỗi kết quả đều kèm commitment, public seed và thuật toán để bất kỳ ai cũng có thể tái kiểm chứng.
          </p>
        </div>
        <Badge variant="verified">
          <ShieldCheck className="h-3 w-3" />
          {published.length} chương trình đã công bố
        </Badge>
      </div>

      <div className="mt-8 space-y-5">
        {finished.map((program) => (
          <article
            key={program.id}
            className="rounded-xl border border-border bg-card p-6 shadow-e1 transition-all duration-200 ease-standard hover:border-gold/30 hover:shadow-e2"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono-nums text-[12px] text-muted-foreground">{program.code}</span>
                  <ProgramStatusBadge status={program.status} />
                  <span className="text-[12px] text-muted-foreground">
                    Quay lúc {formatDateTime(program.drawnAt ?? program.endAt)}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.015em]">{program.prizeName}</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {program.status === "published" ? (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/ket-qua/${program.id}`}>
                        <Trophy className="h-3.5 w-3.5" />
                        Xem kết quả
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="verified">
                      <Link to={`/xac-minh/${program.id}`}>
                        <Fingerprint className="h-3.5 w-3.5" />
                        Xác minh
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Badge variant="warning">Đã khoá bán — chờ tạo kết quả</Badge>
                )}
              </div>
            </div>

            {program.winners && program.winners.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {program.winners.slice(0, 4).map((winner) => (
                  <div
                    key={`${winner.termId}-${winner.number}`}
                    className="rounded-lg border border-border bg-secondary/30 px-4 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      {winner.termLabel}
                    </p>
                    <p className="font-mono-nums mt-1 text-2xl font-bold text-gold">
                      {formatTicketNumber(winner.number, program.numberLength)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <HashChip label="Commitment" value={program.commitHash} />
              <HashChip
                label="Public seed"
                value={program.publicSeed ?? "Chưa công bố"}
                tone={program.publicSeed ? "verified" : "default"}
              />
              <Button asChild variant="subtle" disabled={!program.publicSeed}>
                <Link to={program.publicSeed ? `/xac-minh/${program.id}` : "/ket-qua"}>
                  {program.publicSeed ? "Tái kiểm chứng" : "Chờ public seed"}
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
