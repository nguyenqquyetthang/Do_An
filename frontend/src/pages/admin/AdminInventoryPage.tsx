import { useMemo, useState } from "react";
import { BadgeCheck, Ban, ChevronLeft, ChevronRight, Lock, MousePointerClick, Search, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatCard } from "@/components/shared/StatCard";
import { formatDateTime, formatNumber, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { TicketCellState } from "@/data/types";

const PAGE_SIZE = 20;

const stateLabels: Record<TicketCellState, string> = {
  available: "Còn trống",
  mine: "Của tôi",
  other: "Đang giữ",
  sold: "Đã bán",
  unavailable: "Không khả dụng",
};

const stateVariants: Record<TicketCellState, "outline" | "soft" | "held" | "verified" | "danger"> = {
  available: "outline",
  mine: "soft",
  other: "held",
  sold: "verified",
  unavailable: "danger",
};

const AdminInventoryPage = () => {
  const { programs, getLedger, cellStateOf, cellOwnerOf, programStats } = useLottery();
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [stateFilter, setStateFilter] = useState<"all" | TicketCellState>("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);

  const program = programs.find((item) => item.id === programId) ?? programs[0];
  const ledger = getLedger(program?.id ?? "");
  const stats = programStats(program?.id ?? "");

  const result = useMemo(() => {
    if (!program) return { rows: [], hasMore: false };
    const total = program.totalNumbers;
    const build = (number: number) => {
      const state = cellStateOf(program.id, number);
      const soldEntry = ledger.sold.get(number);
      const heldEntry = ledger.held.get(number);
      return {
        number,
        state,
        owner: soldEntry?.userName ?? heldEntry?.userName ?? cellOwnerOf(program.id, number),
        orderId: soldEntry?.orderId ?? heldEntry?.orderId,
        until: heldEntry?.until,
      };
    };

    const parsed = Number.parseInt(keyword, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= total && keyword.trim() !== "") {
      return { rows: [build(parsed)], hasMore: false };
    }

    const matches: ReturnType<typeof build>[] = [];
    for (let number = 1; number <= total; number += 1) {
      const row = build(number);
      if (stateFilter !== "all" && row.state !== stateFilter) continue;
      matches.push(row);
      if (matches.length >= (page + 1) * PAGE_SIZE) break;
    }

    return {
      rows: matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
      hasMore: matches.length > (page + 1) * PAGE_SIZE || matches.length === (page + 1) * PAGE_SIZE,
    };
  }, [program, ledger, cellStateOf, cellOwnerOf, stateFilter, keyword, page]);

  if (!program) {
    return (
      <div className="rounded-xl border border-dashed border-input/60 px-6 py-16 text-center">
        <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-4 text-[15px] font-semibold">Chưa có chương trình nào</p>
        <p className="mt-2 text-[13px] text-muted-foreground">Tạo chương trình trước để quản lý kho vé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Quản lý số dự thưởng"
        title="Kho vé"
        description="Tìm theo số, theo trạng thái và theo đơn hàng để đối soát dữ liệu vé."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Đã bán" value={stats.sold} icon={BadgeCheck} hint="Đã thanh toán" />
        <StatCard label="Đang giữ" value={stats.held} icon={Lock} hint="Chờ thanh toán" />
        <StatCard label="Còn trống" value={stats.available} icon={MousePointerClick} />
        <StatCard label="Không khả dụng" value={stats.unavailable} icon={Ban} hint="Bị ban tổ chức khoá" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-e1">
        <Select
          value={program.id}
          onValueChange={(value) => {
            setProgramId(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full border-input bg-card sm:w-72">
            <SelectValue placeholder="Chọn chương trình" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.code} · {item.prizeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={stateFilter}
          onValueChange={(value) => {
            setStateFilter(value as "all" | TicketCellState);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full border-input bg-card sm:w-52">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="available">Còn trống</SelectItem>
            <SelectItem value="held">Đang giữ</SelectItem>
            <SelectItem value="sold">Đã bán</SelectItem>
            <SelectItem value="unavailable">Không khả dụng</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value.replace(/\D/g, "").slice(0, 5));
              setPage(0);
            }}
            placeholder={`Tìm số cụ thể (1 – ${formatNumber(program.totalNumbers)})`}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-e1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Số</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Trạng thái</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Người dùng</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Đơn hàng</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Giữ đến</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={row.number}>
                <TableCell className="font-mono-nums text-[14px] font-semibold">
                  {formatTicketNumber(row.number, program.numberLength)}
                </TableCell>
                <TableCell>
                  <Badge variant={stateVariants[row.state]}>{stateLabels[row.state]}</Badge>
                </TableCell>
                <TableCell className="text-[13px]">{row.owner ?? "—"}</TableCell>
                <TableCell className="font-mono-nums text-[12px] text-muted-foreground">
                  {row.orderId ?? "—"}
                </TableCell>
                <TableCell className="font-mono-nums text-[12px] text-muted-foreground">
                  {row.until ? formatDateTime(new Date(row.until).toISOString()) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-[13px] text-muted-foreground">
                  Không có dữ liệu vé phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <span className="font-mono-nums text-[12px] text-muted-foreground">
            Trang {page + 1} · {formatNumber(program.totalNumbers)} số
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => value + 1)}
              disabled={!result.hasMore || Boolean(keyword)}
            >
              Sau
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventoryPage;
