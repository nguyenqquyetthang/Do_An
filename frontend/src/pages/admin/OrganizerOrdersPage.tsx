import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatCard } from "@/components/shared/StatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDateTime, formatPoints } from "@/lib/format";

type OrganizerOrder = {
  order_id: number;
  order_code: string;
  status: string;
  total_amount: string | number;
  created_at: string;
  program_name: string;
  ticket_count: number;
};

const OrganizerOrdersPage = () => {
  const [orders, setOrders] = useState<OrganizerOrder[]>([]);
  useEffect(() => {
    void api.organizerOrders().then(setOrders).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Không thể tải đơn hàng.");
    });
  }, []);

  const paid = orders.filter((order) => order.status === "confirmed");
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Nhà tổ chức" title="Đơn hàng chương trình" description="Theo dõi vé đã bán, doanh thu và trạng thái đơn hàng thuộc các chương trình của bạn." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Tổng đơn" value={orders.length} icon={Receipt} />
        <StatCard label="Doanh thu đã thanh toán" value={paid.reduce((sum, order) => sum + Number(order.total_amount), 0)} icon={Receipt} hint="Dữ liệu từ backend" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-e1">
        <Table>
          <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Chương trình</TableHead><TableHead>Số vé</TableHead><TableHead>Tổng tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.order_id}>
                <TableCell className="font-mono-nums">{order.order_code}</TableCell>
                <TableCell>{order.program_name}</TableCell>
                <TableCell>{order.ticket_count}</TableCell>
                <TableCell>{formatPoints(Number(order.total_amount))}</TableCell>
                <TableCell><Badge variant={order.status === "confirmed" ? "verified" : "outline"}>{order.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(order.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrganizerOrdersPage;
