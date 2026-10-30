import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Dices,
  Lock,
  Search,
  ShieldAlert,
  Ticket,
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
import { CountdownText } from "@/components/shared/CountdownText";
import { NumberGrid, SelectionSummary, TicketLegend } from "@/components/shared/NumberGrid";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { formatNumber, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { TicketCellState } from "@/data/types";
import NotFound from "./NotFound";

const BLOCK_SIZE = 100;
const MAX_SELECTION = 10;

const PickNumbersPage = () => {
  const { programId = "" } = useParams();
  const navigate = useNavigate();
  const { getProgram, cellStateOf, createOrder, currentUser, programStats } = useLottery();

  const [selected, setSelected] = useState<number[]>([]);
  const [blockIndex, setBlockIndex] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [conflicts, setConflicts] = useState<number[]>([]);

  const program = getProgram(programId);

  const blockCount = program ? Math.ceil(program.totalNumbers / BLOCK_SIZE) : 0;
  const rangeStart = blockIndex * BLOCK_SIZE + 1;
  const rangeEnd = program ? Math.min(program.totalNumbers, rangeStart + BLOCK_SIZE - 1) : 0;
  const blockNumbers = useMemo(
    () => Array.from({ length: Math.max(0, rangeEnd - rangeStart + 1) }, (_, index) => rangeStart + index),
    [rangeStart, rangeEnd],
  );

  const blockCounts = useMemo(() => {
    if (!program) return { available: 0, sold: 0, other: 0, unavailable: 0 };
    const counts = { available: 0, sold: 0, other: 0, unavailable: 0 };
    for (const value of blockNumbers) {
      const state = cellStateOf(program.id, value);
      if (state === "available") counts.available += 1;
      else if (state === "sold" || state === "mine") counts.sold += 1;
      else if (state === "other") counts.other += 1;
      else counts.unavailable += 1;
    }
    return counts;
  }, [blockNumbers, cellStateOf, program]);

  if (!program) return <NotFound />;

  const stats = programStats(program.id);
  const isOpen = program.status === "active";
  const total = selected.length * program.ticketPrice;

  const toggle = (value: number) => {
    setSelected((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      if (prev.length >= MAX_SELECTION) {
        toast.warning(`Mỗi đơn tối đa ${MAX_SELECTION} số dự thưởng.`);
        return prev;
      }
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  const handleBlocked = (value: number, state: TicketCellState) => {
    const messages: Record<TicketCellState, string> = {
      sold: `Số ${formatTicketNumber(value)} đã được bán.`,
      other: `Số ${formatTicketNumber(value)} đang được người dùng khác giữ.`,
      unavailable: `Số ${formatTicketNumber(value)} không khả dụng.`,
      mine: `Số ${formatTicketNumber(value)} đã thuộc về bạn.`,
      available: "",
    };
    toast.info(messages[state]);
  };

  const search = () => {
    const parsed = Number.parseInt(keyword, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > program.totalNumbers) {
      toast.error(`Số cần tìm phải nằm trong khoảng 1 – ${formatNumber(program.totalNumbers)}.`);
      return;
    }
    setBlockIndex(Math.floor((parsed - 1) / BLOCK_SIZE));
    toast.success(
      `Số ${formatTicketNumber(parsed)} thuộc dải ${formatTicketNumber(
        Math.floor((parsed - 1) / BLOCK_SIZE) * BLOCK_SIZE + 1,
      )} – ${formatTicketNumber(
        Math.min(program.totalNumbers, (Math.floor((parsed - 1) / BLOCK_SIZE) + 1) * BLOCK_SIZE),
      )}.`,
    );
  };

  const pickRandom = () => {
    const available = blockNumbers.filter(
      (value) => cellStateOf(program.id, value) === "available" && !selected.includes(value),
    );
    if (available.length === 0) {
      toast.error("Dải số này không còn ô trống, hãy chuyển dải khác.");
      return;
    }
    const picked = new Set(selected);
    while (picked.size < MAX_SELECTION) {
      picked.add(available[Math.floor(Math.random() * available.length)]);
      if (available.every((value) => picked.has(value))) break;
    }
    setSelected([...picked].sort((a, b) => a - b));
  };

  const submit = async () => {
    if (!currentUser) {
      navigate(`/dang-nhap?next=/chuong-trinh/${program.id}/chon-so`);
      return;
    }
    if (selected.length === 0) {
      toast.warning("Chọn ít nhất một số dự thưởng để tiếp tục.");
      return;
    }
    const result = await createOrder(program.id, selected);
    if ("taken" in result) {
      setConflicts(result.taken);
      setSelected((prev) => prev.filter((value) => !result.taken.includes(value)));
      if (result.error) toast.error(result.error);
      return;
    }
    toast.success(`Đã giữ ${selected.length} số trong 10 phút.`);
    navigate(`/don/${result.order.id}/xac-nhan`);
  };

  return (
    <div className="container py-8 pb-28 lg:pb-8">
      <Link
        to={`/chuong-trinh/${program.id}`}
        className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Chi tiết chương trình
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-nums text-[12px] text-muted-foreground">{program.code}</span>
            <ProgramStatusBadge status={program.status} />
            <span className="font-mono-nums text-[12px] text-muted-foreground">
              {formatPoints(program.ticketPrice)} / số
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">
            Bàn chọn số — {program.prizeName}
          </h1>
        </div>
        {isOpen ? (
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-right shadow-e1">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Còn lại</p>
            <p className="font-mono-nums mt-0.5 text-lg font-bold">
              <CountdownText target={new Date(program.endAt).getTime()} />
            </p>
          </div>
        ) : null}
      </div>

      {!isOpen ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <p className="text-[14px] font-semibold">Chương trình không ở trạng thái mở bán</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Bạn vẫn có thể xem bàn chọn số và trạng thái từng ô, nhưng không thể giữ số.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_0.85fr]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-e1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") search();
                  }}
                  placeholder={`Nhập số cần tìm (1 – ${formatNumber(program.totalNumbers)})`}
                  className="pl-9"
                />
              </div>
              <Button variant="subtle" onClick={search}>
                Tìm số
              </Button>
              <Button variant="outline" onClick={pickRandom} disabled={!isOpen}>
                <Dices className="h-4 w-4" />
                Chọn ngẫu nhiên
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlockIndex((index) => Math.max(0, index - 1))}
                  disabled={blockIndex === 0}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Dải trước
                </Button>
                <span className="font-mono-nums px-2 text-[13px] font-semibold">
                  {formatTicketNumber(rangeStart)} – {formatTicketNumber(rangeEnd)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlockIndex((index) => Math.min(blockCount - 1, index + 1))}
                  disabled={blockIndex >= blockCount - 1}
                >
                  Dải sau
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                <span className="font-mono-nums">
                  {formatNumber(blockCounts.available)} trống · {formatNumber(blockCounts.sold)} đã bán ·{" "}
                  {formatNumber(blockCounts.other)} đang giữ
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2">
              {Array.from({ length: blockCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setBlockIndex(index)}
                  className={`font-mono-nums shrink-0 rounded-sm border px-2.5 py-1 text-[11px] transition-colors duration-150 ease-standard ${
                    index === blockIndex
                      ? "border-gold/60 bg-primary/15 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-e1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold">Chọn số dự thưởng</h2>
              <span className="font-mono-nums text-[12px] text-muted-foreground">
                {formatNumber(stats.sold)} / {formatNumber(program.totalNumbers)} số đã bán
              </span>
            </div>
            <NumberGrid
              numbers={blockNumbers}
              numberLength={program.numberLength}
              stateOf={(value) => cellStateOf(program.id, value)}
              selected={selected}
              onToggle={isOpen ? toggle : undefined}
              onBlocked={handleBlocked}
            />
            <TicketLegend className="mt-5 border-t border-border pt-4" />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-gold/25 bg-gradient-panel p-5 shadow-e2">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Đơn đang chọn</h2>
              <Badge variant="soft">{selected.length}/{MAX_SELECTION} số</Badge>
            </div>

            <div className="mt-4">
              <SelectionSummary selected={selected} onRemove={toggle} />
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Đơn giá</dt>
                <dd className="font-mono-nums">{formatPoints(program.ticketPrice)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Số lượng</dt>
                <dd className="font-mono-nums">{selected.length}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <dt className="font-semibold">Tổng cộng</dt>
                <dd className="font-mono-nums text-lg font-bold text-gold">{formatPoints(total)}</dd>
              </div>
            </dl>

            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={submit}
              disabled={!isOpen || selected.length === 0}
            >
              <Ticket className="h-4 w-4" />
              {currentUser ? "Tiếp tục" : "Đăng nhập để tiếp tục"}
            </Button>

            <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Số được giữ 10 phút bằng khoá giao dịch. Nếu một người khác giữ số trước, số đó sẽ bị loại khỏi
              đơn của bạn.
            </p>

            {!currentUser ? (
              <div className="mt-4 rounded-md border border-border bg-background/60 p-3 text-[12px] text-muted-foreground">
                Bạn chưa đăng nhập.{" "}
                <Link
                  to={`/dang-nhap?next=/chuong-trinh/${program.id}/chon-so`}
                  className="font-semibold text-gold hover:underline"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : null}
          </div>

        </aside>
      </div>

      {/* Sticky thanh tổng cho mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              Đã chọn {selected.length} số
            </p>
            <p className="font-mono-nums text-lg font-bold text-gold">{formatPoints(total)}</p>
          </div>
          <Button onClick={submit} disabled={!isOpen || selected.length === 0}>
            Tiếp tục
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={conflicts.length > 0} onOpenChange={() => setConflicts([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Số đã bị người khác giữ trước</DialogTitle>
            <DialogDescription>
              Hệ thống chỉ cho phép một người giữ mỗi số. Các số sau đã bị giữ trong lúc bạn chọn và đã bị
              loại khỏi đơn:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {conflicts.map((value) => (
              <span
                key={value}
                className="font-mono-nums rounded-cell border border-ticket-other-border bg-ticket-other-bg px-3 py-1.5 text-[13px] font-semibold text-ticket-other-fg"
              >
                {formatTicketNumber(value)}
              </span>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setConflicts([])}>Chọn số khác</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default PickNumbersPage;
