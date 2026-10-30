import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, CheckCircle2, Fingerprint, KeyRound, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HashChip } from "@/components/shared/HashChip";
import { useLottery } from "@/store/lottery";
import { buildRandomness } from "@/lib/draw";
import { formatDateTime, formatTicketNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

const VerifyPage = () => {
  const { programId = "" } = useParams();
  const { getProgram, previewDraw } = useLottery();
  const program = getProgram(programId);
  const [seed, setSeed] = useState(program?.publicSeed ?? "");
  const [verdict, setVerdict] = useState<boolean | null>(null);

  const derived = useMemo(
    () => (program && seed.trim().length > 0 ? previewDraw(program.id, seed.trim()) : []),
    [program, seed, previewDraw],
  );

  if (!program) return <NotFound />;

  const published = program.winners ?? [];
  const derivedKey = derived.map((item) => `${item.termId}:${item.number}`).join(",");
  const publishedKey = published.map((item) => `${item.termId}:${item.number}`).join(",");
  const matches = derived.length > 0 && derivedKey === publishedKey;
  const randomness = seed.trim() ? buildRandomness(program.commitHash, seed.trim()) : "";

  return (
    <div className="container py-10">
      <Link
        to={`/ket-qua/${program.id}`}
        className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về trang kết quả
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="verified" className="mb-3">
            <ShieldCheck className="h-3 w-3" />
            Trang xác minh công khai
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Xác minh kết quả {program.code}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Nhập public seed để tái tạo kết quả. Nếu số trúng tái tạo được trùng với kết quả đã công bố,
            chương trình đã quay đúng và có thể kiểm chứng độc lập.
          </p>
        </div>
        <div className="font-mono-nums rounded-lg border border-border bg-card px-4 py-3 text-right shadow-e1">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Quay lúc</p>
          <p className="mt-0.5 text-[13px] font-semibold">
            {formatDateTime(program.drawnAt ?? program.publishedAt)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="text-[15px] font-semibold">Dữ liệu công khai</h2>
            <div className="mt-4 space-y-3">
              <HashChip label="Commitment (công bố trước khi mở bán)" value={program.commitHash} />
              <div>
                <Label htmlFor="seed" className="mb-2 block text-[13px] text-muted-foreground">
                  Public seed (công bố sau khi khoá bán)
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seed"
                    value={seed}
                    onChange={(event) => {
                      setSeed(event.target.value);
                      setVerdict(null);
                    }}
                    placeholder="Ví dụ: LD-2026-1006-EVO-9c41b7"
                    className="pl-9 font-mono-nums"
                  />
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Thử sửa seed để thấy kết quả tái tạo không còn khớp với kết quả đã công bố.
                </p>
              </div>
              {randomness ? (
                <HashChip label="Randomness = SHA-256(commitment ‖ seed)" value={randomness} tone="verified" />
              ) : null}
            </div>

            <div className="mt-5 rounded-md border border-border bg-secondary/30 px-5 py-4">
              <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
                <Calculator className="h-3.5 w-3.5" />
                Thuật toán
              </p>
              <p className="font-mono-nums mt-2 text-[12px] leading-relaxed">
                digest = SHA-256(commitment ‖ "|" ‖ seed ‖ "|" ‖ termId ‖ "|" ‖ index)
                <br />
                số = (int(digest[0..13], 16) mod {program.totalNumbers}) + 1
              </p>
            </div>

            <Button
              size="lg"
              variant="verified"
              className="mt-5 w-full"
              onClick={() => setVerdict(matches)}
              disabled={derived.length === 0}
            >
              <Fingerprint className="h-4 w-4" />
              Xác minh
            </Button>
          </div>

          {verdict !== null ? (
            <div
              className={cn(
                "animate-rise rounded-xl border p-6",
                verdict
                  ? "border-verified/40 bg-verified/10 shadow-glow-verified"
                  : "border-destructive/40 bg-destructive/10",
              )}
            >
              <div className="flex items-start gap-3">
                {verdict ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 text-verified-text" />
                ) : (
                  <XCircle className="mt-0.5 h-6 w-6 text-destructive-text" />
                )}
                <div>
                  <p className="text-[15px] font-bold">
                    {verdict ? "KẾT QUẢ HỢP LỆ" : "KẾT QUẢ KHÔNG KHỚP"}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {verdict
                      ? "Commitment và public seed khớp với kết quả đã công bố. Kết quả có thể tái kiểm chứng bởi bất kỳ ai."
                      : "Số tái tạo từ seed bạn nhập không trùng với kết quả đã công bố. Hãy kiểm tra lại public seed."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Kết quả tái tạo</h2>
            {derived.length > 0 ? (
              <Badge variant={matches ? "verified" : "danger"}>
                {matches ? "Trùng khớp" : "Không trùng khớp"}
              </Badge>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {derived.map((item, index) => {
              const publishedNumber = published.find(
                (winner) => winner.termId === item.termId && winner.number === item.number,
              );
              return (
                <div
                  key={`${item.termId}-${item.number}-${index}`}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
                    publishedNumber ? "border-verified/40 bg-verified/10" : "border-destructive/40 bg-destructive/10",
                  )}
                >
                  <span className="text-[13px] font-medium">{item.termLabel}</span>
                  <span className="font-mono-nums text-xl font-bold tracking-[0.02em]">
                    {formatTicketNumber(item.number, program.numberLength)}
                  </span>
                </div>
              );
            })}
            {derived.length === 0 ? (
              <p className="rounded-lg border border-dashed border-input/60 px-4 py-10 text-center text-[13px] text-muted-foreground">
                Nhập public seed để bắt đầu tái tạo kết quả.
              </p>
            ) : null}
          </div>

          {published.length > 0 ? (
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
                Kết quả đã công bố
              </p>
              <div className="mt-3 space-y-2">
                {published.map((winner) => (
                  <div
                    key={`${winner.termId}-${winner.number}`}
                    className="flex items-center justify-between gap-4 text-[13px]"
                  >
                    <span className="text-muted-foreground">{winner.termLabel}</span>
                    <span className="font-mono-nums font-semibold">
                      {formatTicketNumber(winner.number, program.numberLength)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
