import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardList,
  Coins,
  FileClock,
  PlusCircle,
  Ticket,
  TrendingUp,
  Users,
  Wand2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { formatCompactPoints, formatDateTime, formatNumber, formatPoints, shortTime } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import { api } from "@/lib/api";
import OperatorDashboardPage from "./OperatorDashboardPage";

const AdminDashboardPage = () => {
  const { programs, orders, users, ledgers, audit, programStats, currentUser } = useLottery();
  const [serverStats, setServerStats] = useState<Awaited<ReturnType<typeof api.organizerStats>> | null>(null);

  useEffect(() => {
    if (currentUser?.role === "ORGANIZER" || currentUser?.role === "ADMIN") {
      api.organizerStats().then(setServerStats).catch(() => setServerStats(null));
    }
  }, [currentUser?.role]);

  if (currentUser?.role === "DRAW_OPERATOR") return <OperatorDashboardPage />;

  const soldTotal = serverStats?.programs.reduce((sum, item) => sum + item.sold_tickets, 0) ?? Object.values(ledgers).reduce((sum, ledger) => sum + ledger.sold.size, 0);
  const revenue = serverStats?.programs.reduce((sum, item) => sum + Number(item.revenue), 0) ?? programs.reduce(
    (sum, program) => sum + (ledgers[program.id]?.sold.size ?? 0) * program.ticketPrice,
    0,
  );
  const capacity = serverStats?.programs.reduce((sum, item) => sum + item.total_tickets, 0) ?? programs.reduce((sum, program) => sum + program.totalNumbers, 0);
  const fillRate = capacity === 0 ? 0 : (soldTotal / capacity) * 100;

  const chartData = serverStats?.programs.map((program) => ({
    name: program.program_code,
    revenue: Number(program.revenue),
    sold: program.sold_tickets,
    remaining: program.remaining_tickets,
  })) ?? programs.map((program) => ({
    name: program.code,
    revenue: (ledgers[program.id]?.sold.size ?? 0) * program.ticketPrice,
    sold: ledgers[program.id]?.sold.size ?? 0,
    remaining: Math.max(0, program.totalNumbers - (ledgers[program.id]?.sold.size ?? 0)),
  }));
  const dailyData = serverStats?.daily.map((item) => ({ day: item.day, sold: item.sold_tickets })) ?? [];

  const activePrograms = programs.filter(
    (program) => program.status === "active" || program.status === "closed",
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="soft" className="mb-3">
            {formatDateTime(new Date().toISOString())}
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[32px]">
            {currentUser?.role === "ADMIN" ? "Bảng điều khiển quản trị" : "Bảng điều khiển nhà tổ chức"}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Tổng quan hoạt động của toàn bộ chương trình quay số do bạn tổ chức.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/quan-tri/chuong-trinh/tao-moi">
              <PlusCircle className="h-4 w-4" />
              Tạo chương trình
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/quan-tri/quay-so">
              <Wand2 className="h-4 w-4" />
              Bàn quay số
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Chương trình" value={programs.length} icon={ClipboardList} hint="Gồm cả bản nháp" />
        <StatCard label="Đơn hàng" value={serverStats?.programs.reduce((sum, item) => sum + item.successful_orders + item.failed_orders, 0) ?? orders.length} icon={Coins} hint="Thành công và thất bại" />
        <StatCard
          label="Người dùng"
          value={users.length}
          icon={Users}
          hint="Người mua vé và nhà tổ chức"
        />
        <StatCard label="Số dự thưởng đã bán" value={soldTotal} icon={Ticket} hint="Đã thanh toán thành công" />
        <StatCard
          label="Doanh thu"
          value={revenue / 1_000_000}
          suffix="tr điểm"
          decimals={1}
          icon={BadgeCheck}
          hint="Tính theo số vé đã bán"
        />
        <StatCard
          label="Tỉ lệ lấp đầy"
          value={fillRate}
          suffix="%"
          decimals={1}
          icon={TrendingUp}
          hint="Trên tổng dải số phát hành"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <SectionHeading title="Doanh thu theo chương trình" eyebrow="Đơn vị: triệu điểm" />
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatCompactPoints(value)}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary) / 0.4)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatPoints(Number(value ?? 0)), "Doanh thu"]}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <SectionHeading title="Vé bán theo ngày" eyebrow="Đơn đã thanh toán" />
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="sold" name="Vé bán" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <FileClock className="h-4 w-4 text-gold" />
              Hoạt động gần đây
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/quan-tri/nhat-ky">
                Audit log
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <ul className="mt-5 space-y-3">
            {[...audit]
              .reverse()
              .slice(0, 6)
              .map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 rounded-md border border-border bg-secondary/25 p-3">
                  <span className="font-mono-nums mt-0.5 rounded-sm bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {shortTime(entry.at)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{entry.action}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {entry.actor} · {entry.entity}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-e1">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <SectionHeading title="Chương trình đang hoạt động" eyebrow="Theo dõi tiến độ bán vé" />
          <Button asChild variant="outline" size="sm">
            <Link to="/quan-tri/chuong-trinh">Quản lý chương trình</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Mã</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Chương trình</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Tiến độ</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Doanh thu</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Trạng thái</TableHead>
              <TableHead className="text-right text-[12px] uppercase tracking-[0.08em]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activePrograms.map((program) => {
              const stats = programStats(program.id);
              return (
                <TableRow key={program.id}>
                  <TableCell className="font-mono-nums text-[13px]">{program.code}</TableCell>
                  <TableCell>
                    <span className="text-[13px] font-medium">{program.prizeName}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      Khoá bán {formatDateTime(program.endAt)}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <Progress value={stats.progress} className="w-28" />
                      <span className="font-mono-nums text-[12px] text-muted-foreground">
                        {formatNumber(stats.sold)}/{formatNumber(program.totalNumbers)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono-nums text-[13px]">
                    {formatPoints(stats.sold * program.ticketPrice)}
                  </TableCell>
                  <TableCell>
                    <ProgramStatusBadge status={program.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/chuong-trinh/${program.id}`}>Xem</Link>
                      </Button>
                      <Button asChild size="sm" variant="subtle">
                        <Link to="/quan-tri/quay-so">Quay số</Link>
                      </Button>
                    </div>
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

export default AdminDashboardPage;
