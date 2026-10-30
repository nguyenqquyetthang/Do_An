import { useState } from "react";
import { Coins, Info, Receipt, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatCard } from "@/components/shared/StatCard";
import { formatDateTime, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { OrderStatus } from "@/data/types";

const AdminOrdersPage = () => {
  const { orders, programs, getProgram } = useLottery();
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [programId, setProgramId] = useState("all");

  const visible = orders
    .filter((order) => status === "all" || order.status === status)
    .filter((order) => programId === "all" || order.programId === programId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paid = orders.filter((order) => order.status === "paid");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const holdOrders = orders.filter((order) => order.status === "held").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Quản lý đơn hàng"
        title="Đơn hàng toàn hệ thống"
        description="Đơn đã thanh toán chỉ được xem, không cho sửa trực tiếp dữ liệu giao dịch đã hoàn tất."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng đơn hàng" value={orders.length} icon={Receipt} />
        <StatCard
          label="Doanh thu đã thanh toán"
          value={revenue / 1_000_000}
          suffix="tr điểm"
          decimals={1}
          icon={Coins}
        />
        <StatCard label="Đang giữ số" value={holdOrders} icon={TrendingUp} hint="Chờ thanh toán" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-e1">
        <Select value={status} onValueChange={(value) => setStatus(value as "all" | OrderStatus)}>
          <SelectTrigger className="w-full border-input bg-card sm:w-52">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="paid">Thành công</SelectItem>
            <SelectItem value="held">Đang giữ số</SelectItem>
            <SelectItem value="expired">Hết hạn</SelectItem>
            <SelectItem value="cancelled">Đã huỷ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={programId} onValueChange={setProgramId}>
          <SelectTrigger className="w-full border-input bg-card sm:w-72">
            <SelectValue placeholder="Chương trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chương trình</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.code} · {program.prizeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline">{visible.length} đơn</Badge>
        <span className="ml-auto flex items-center gap-2 text-[12px] text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Mọi thay đổi trạng thái đều được ghi vào audit log.
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-e1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Mã đơn</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Người dùng</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Chương trình</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Số dự thưởng</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Tổng</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Trạng thái</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Tạo lúc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.slice(0, 40).map((order) => {
              const program = getProgram(order.programId);
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono-nums whitespace-nowrap text-[13px]">{order.id}</TableCell>
                  <TableCell className="text-[13px]">
                    {order.userName}
                    <span className="mt-1 block font-mono-nums text-[11px] text-muted-foreground">
                      {order.userId}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {program?.prizeName}
                    <span className="mt-1 block font-mono-nums text-[11px] text-muted-foreground">
                      {program?.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {order.numbers.slice(0, 3).map((value) => (
                        <span
                          key={value}
                          className="font-mono-nums rounded-sm border border-border bg-secondary/50 px-2 py-0.5 text-[12px]"
                        >
                          {formatTicketNumber(value, program?.numberLength ?? 4)}
                        </span>
                      ))}
                      {order.numbers.length > 3 ? (
                        <span className="text-[12px] text-muted-foreground">+{order.numbers.length - 3}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono-nums whitespace-nowrap text-[13px]">
                    {formatPoints(order.total)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {order.method ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
