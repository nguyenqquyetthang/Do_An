import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Dice5,
  Fingerprint,
  Lock,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HashChip } from "@/components/shared/HashChip";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buildRandomness, type DrawnNumber } from "@/lib/draw";
import { formatDateTime, formatNumber, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const randomSeed = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `LD-${new Date().getFullYear()}-${hex.slice(0, 4).toUpperCase()}-${hex.slice(4, 12)}`;
};

const AdminDrawConsolePage = () => {
  const [searchParams] = useSearchParams();
  const { programs, ledgers, previewDraw, publishResults, getProgram, currentUser } = useLottery();

  const drawablePrograms = programs.filter(
    (program) => program.status === "closed" || program.status === "published",
  );

  const initial = searchParams.get("program") ?? drawablePrograms[0]?.id ?? "";
  const [programId, setProgramId] = useState(initial);
  const [seed, setSeed] = useState("");
  const [preview, setPreview] = useState<DrawnNumber[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const program = getProgram(programId);

  useEffect(() => {
    setSeed(program?.publicSeed ?? "");
    setPreview([]);
  }, [programId, program?.publicSeed]);

  const eligible = ledgers[programId]?.sold.size ?? 0;
  const randomness = useMemo(
    () => (program && seed.trim() ? buildRandomness(program.commitHash, seed.trim()) : ""),
    [program, seed],
  );

  const generate = () => {
    if (!program) return;
    if (seed.trim().length < 8) {
      toast.error("Public seed cần tối thiểu 8 ký tự để đảm bảo entropy.");
      return;
    }
    setPreview(previewDraw(program.id, seed.trim()));
    toast.success("Đã tạo kết quả tạm thời. Chưa có gì được công bố.");
  };

  const confirmPublish = async () => {
    if (!program) return;
    if (currentUser?.role === "DRAW_OPERATOR") {
      try {
        await api.drawProgram(program.id, seed.trim());
        setConfirmOpen(false);
        toast.success(`Đã lưu và khóa kết quả quay thưởng cho ${program.code}.`);
        window.location.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể thực hiện quay thưởng.");
      }
      return;
    }
    const published = publishResults(program.id, seed.trim());
    setConfirmOpen(false);
    if (published) {
      toast.success(`Đã công bố ${published.winners?.length ?? 0} số trúng thưởng cho ${program.code}.`);
      setPreview([]);
    }
  };

  if (!drawablePrograms.length) {
    return (
      <div className="rounded-xl border border-dashed border-input/60 px-6 py-16 text-center">
        <Wand2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-4 text-[15px] font-semibold">Chưa có chương trình nào sẵn sàng quay</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Khoá bán một chương trình đang mở để đưa vào bàn quay số.
        </p>
      </div>
    );
  }

  const published = program?.status === "published";
  const winners = program?.winners ?? [];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Quay số & công bố"
        title="Bàn quay số"
        description="Tạo kết quả tất định từ commitment và public seed, xem trước rồi mới công bố."
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-e1">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <Label className="mb-2 block text-[13px] text-muted-foreground">Chương trình</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger className="border-input bg-secondary/40">
                <SelectValue placeholder="Chọn chương trình đã khoá bán" />
              </SelectTrigger>
              <SelectContent>
                {drawablePrograms.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} · {item.prizeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="rounded-md border border-border bg-secondary/40 px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Số vé hợp lệ</p>
              <p className="font-mono-nums mt-0.5 text-lg font-bold">{formatNumber(eligible)}</p>
            </div>
            <div className="rounded-md border border-border bg-secondary/40 px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Trạng thái</p>
              <p className="mt-1">
                <Badge variant={published ? "verified" : "warning"}>
                  {published ? "Đã công bố" : "Sẵn sàng quay"}
                </Badge>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-xl border border-gold/25 bg-gradient-panel p-6 shadow-e2">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-gold" />
            <h2 className="text-[15px] font-semibold">Thông tin minh bạch</h2>
          </div>

          <div className="mt-4 space-y-3">
            <HashChip label="Commitment (đã công bố khi tạo chương trình)" value={program?.commitHash ?? ""} />
            {randomness ? (
              <HashChip label="Randomness = SHA-256(commitment ‖ seed)" value={randomness} tone="verified" />
            ) : null}
          </div>

          <div className="mt-5">
            <Label htmlFor="seed" className="mb-2 block text-[13px] text-muted-foreground">
              Public seed
            </Label>
            <div className="flex gap-2">
              <Input
                id="seed"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="Nhập hoặc tạo public seed"
                className="font-mono-nums"
                disabled={published}
              />
              <Button
                variant="outline"
                onClick={() => setSeed(randomSeed())}
                disabled={published}
                aria-label="Tạo seed ngẫu nhiên"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Public seed được công bố công khai. Kết quả là hàm tất định của commitment và seed nên người
              dùng có thể tự tính lại.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={generate} disabled={published || !seed.trim()}>
              <Wand2 className="h-4 w-4" />
              Tạo kết quả
            </Button>
            <Button
              variant="verified"
              className="flex-1"
              onClick={() => setConfirmOpen(true)}
              disabled={published || !seed.trim() || preview.length === 0}
            >
              <Radio className="h-4 w-4" />
              Công bố
            </Button>
          </div>

          {published ? (
            <p className="mt-4 flex items-start gap-2 rounded-md border border-verified/30 bg-verified/10 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 text-verified-text" />
              Kết quả đã công bố là bất biến. Hệ thống chặn mọi thay đổi kết quả và ghi lại thao tác công bố
              trong audit log.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">
              {published ? "Kết quả đã công bố" : "Kết quả xem trước"}
            </h2>
            {preview.length > 0 && !published ? (
              <Badge variant="warning">Chưa công bố — chỉ hiển thị cục bộ</Badge>
            ) : null}
            {published ? (
              <Badge variant="verified">
                <ShieldCheck className="h-3 w-3" />
                {formatDateTime(program?.publishedAt)}
              </Badge>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {(published ? winners : preview).map((item, index) => (
              <div
                key={`${item.termId}-${item.number}-${index}`}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
                  published ? "border-verified/35 bg-verified/10" : "border-gold/30 bg-primary/10",
                )}
              >
                <div>
                  <p className="text-[13px] font-medium">{item.termLabel}</p>
                  {"ownerName" in item ? (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{String(item.ownerName)}</p>
                  ) : (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Dải số {program?.totalNumbers} vé</p>
                  )}
                </div>
                <span
                  className={cn(
                    "font-mono-nums text-2xl font-extrabold tracking-[-0.02em]",
                    published ? "animate-reveal text-gradient-gold" : "text-gold",
                  )}
                >
                  {formatTicketNumber(item.number, program?.numberLength ?? 4)}
                </span>
              </div>
            ))}

            {(published ? winners.length : preview.length) === 0 ? (
              <div className="rounded-lg border border-dashed border-input/60 px-4 py-12 text-center">
                <Dice5 className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Nhập public seed và bấm “Tạo kết quả” để xem trước danh sách trúng thưởng.
                </p>
              </div>
            ) : null}
          </div>

          {preview.length > 0 && !published ? (
            <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 text-gold" />
              Kết quả xem trước chưa được lưu. Chỉ khi bấm “Công bố”, kết quả mới được ghi vào hệ thống và
              xuất hiện trên trang kết quả công khai.
            </p>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-verified-text" />
              Công bố kết quả {program?.code}?
            </DialogTitle>
            <DialogDescription>
              Sau khi công bố, kết quả không thể chỉnh sửa. Public seed sẽ được niêm yết cùng commitment để
              bất kỳ ai cũng có thể tái kiểm chứng.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-secondary/30 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Public seed</p>
            <p className="font-mono-nums mt-1 text-[13px]">{seed}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Số vé hợp lệ
            </p>
            <p className="font-mono-nums mt-1 text-[13px]">{formatNumber(eligible)}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button variant="verified" onClick={confirmPublish}>
              Xác nhận công bố
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDrawConsolePage;
