import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Receipt, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CountdownText } from "@/components/shared/CountdownText";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { formatDateTime, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { OrderStatus } from "@/data/types";

type Filter = "all" | OrderStatus;

const tabs: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "paid", label: "Thành công" },
  { value: "held", label: "Đang giữ số" },
  { value: "expired", label: "Hết hạn" },
  { value: "cancelled", label: "Đã huỷ" },
];

const MyOrdersPage = () => {
  const { currentUser, ordersOf, getProgram } = useLottery();
  const [filter, setFilter] = useState<Filter>("all");

  if (!currentUser) {
    return (
      <RequireLogin
        title="Đăng nhập để xem lịch sử đơn hàng"
        description="Lịch sử đơn hàng ghi lại toàn bộ giao dịch giữ số và thanh toán của bạn."
      />
    );
  }

  const orders = ordersOf(currentUser.id)
    .filter((order) => filter === "all" || order.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Lịch sử đơn hàng</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Đơn đã thanh toán không thể chỉnh sửa, phục vụ mục tiêu kiểm toán dữ liệu giao dịch.
          </p>
        </div>
        <Badge variant="outline">
          <Receipt className="h-3 w-3" />
          {ordersOf(currentUser.id).length} đơn
        </Badge>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-e1">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList className="h-auto flex-wrap gap-1 rounded-md bg-secondary/60 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-sm px-3.5 py-1.5 text-[13px] data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-input/60 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold">Không có đơn hàng nào</p>
          <Button asChild className="mt-5" variant="outline">
            <Link to="/chuong-trinh">Xem chương trình đang mở</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-e1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Mã đơn</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Chương trình</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Số dự thưởng</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Tổng</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Trạng thái</TableHead>
                <TableHead className="text-right text-[12px] uppercase tracking-[0.08em]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const program = getProgram(order.programId);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono-nums whitespace-nowrap text-[13px]">
                      {order.id}
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] font-medium">{program?.name}</span>
                      <span className="mt-1 block font-mono-nums text-[11px] text-muted-foreground">
                        {program?.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {order.numbers.slice(0, 4).map((value) => (
                          <span
                            key={value}
                            className="font-mono-nums rounded-sm border border-border bg-secondary/50 px-2 py-0.5 text-[12px]"
                          >
                            {formatTicketNumber(value, program?.numberLength ?? 4)}
                          </span>
                        ))}
                        {order.numbers.length > 4 ? (
                          <span className="text-[12px] text-muted-foreground">
                            +{order.numbers.length - 4}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono-nums whitespace-nowrap text-[13px]">
                      {formatPoints(order.total)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                      {order.status === "held" ? (
                        <span className="font-mono-nums mt-1 block text-[11px] text-muted-foreground">
                          Còn <CountdownText target={order.holdUntil} />
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === "held" ? (
                        <Button asChild size="sm">
                          <Link to={`/don/${order.id}/xac-nhan`}>
                            Thanh toán
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : order.status === "paid" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/ve-cua-toi">Xem vé</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/chuong-trinh/${order.programId}/chon-so`}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Chọn lại
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
