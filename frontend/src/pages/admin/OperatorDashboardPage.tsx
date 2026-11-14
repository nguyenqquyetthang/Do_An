import { useEffect, useState } from "react";
import { ClipboardCheck, Download, FileCheck2, Gift, History, Phone, Ticket, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { formatDateTime, formatTicketNumber } from "@/lib/format";
import { api } from "@/lib/api";

type Winner = Awaited<ReturnType<typeof api.operatorWinners>>[number];

const statuses = [
  ["pending", "Chưa liên hệ"],
  ["contacted", "Đã liên hệ"],
  ["verified", "Đã xác minh"],
  ["processing", "Đang xử lý"],
  ["awarded", "Đã trao giải"],
  ["failed", "Trao giải thất bại"],
  ["disputed", "Có tranh chấp"],
] as const;

const OperatorDashboardPage = () => {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.operatorStats>> | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof api.operatorDrawHistory>>>([]);
  const [programs, setPrograms] = useState<Awaited<ReturnType<typeof api.operatorPrograms>>>([]);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof api.operatorProgramOverview>> | null>(null);
  const [audit, setAudit] = useState<Awaited<ReturnType<typeof api.operatorAudit>>>([]);
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof api.operatorProgramTickets>>>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const load = () => {
    void Promise.all([api.operatorStats(), api.operatorWinners(), api.operatorDrawHistory(), api.operatorPrograms(), api.operatorAudit()])
      .then(([nextStats, nextWinners, nextHistory, nextPrograms, nextAudit]) => {
        setStats(nextStats);
        setWinners(nextWinners);
        setHistory(nextHistory);
        setPrograms(nextPrograms);
        setAudit(nextAudit);
        if (!selectedProgramId && nextPrograms[0]) setSelectedProgramId(String(nextPrograms[0].program_id));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải dữ liệu quay thưởng."));
  };
  useEffect(load, []);
  useEffect(() => {
    if (!selectedProgramId) return;
    void api.operatorProgramOverview(selectedProgramId)
      .then(setOverview)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải điều kiện chương trình."));
    void api.operatorProgramTickets(selectedProgramId)
      .then(setTickets)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải danh sách vé hợp lệ."));
  }, [selectedProgramId]);

  const update = async (winner: Winner, status: string) => {
    try {
      const evidenceUrl = window.prompt("URL hình ảnh/tài liệu xác nhận (có thể bỏ trống):", winner.evidence_url ?? "") ?? winner.evidence_url ?? "";
      const notes = window.prompt("Ghi chú liên hệ/trao giải:", winner.notes ?? "") ?? winner.notes ?? "";
      await api.updateWinnerStatus(winner.winner_id, { status, evidenceUrl, notes });
      toast.success("Đã cập nhật trạng thái trao giải.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
    }
  };

  const exportRecord = async (programId: number) => {
    try {
      const record = await api.drawRecord(String(programId));
      const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bien-ban-quay-${programId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xuất biên bản.");
    }
  };

  return <div className="space-y-8">
    <div>
      <Badge variant="soft"><ClipboardCheck className="h-3 w-3" /> DRAW_OPERATOR</Badge>
      <h1 className="mt-3 text-2xl font-extrabold sm:text-[32px]">Điều hành quay thưởng</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">Chỉ xem chương trình được phân công, thực hiện quay bất biến và theo dõi trao giải.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Chương trình được phân công" value={stats?.assigned ?? 0} icon={ClipboardCheck} />
      <StatCard label="Đã quay thưởng" value={stats?.drawn ?? 0} icon={Trophy} />
      <StatCard label="Chưa quay" value={stats?.waiting ?? 0} icon={History} />
      <StatCard label="Tổng giải thưởng" value={stats?.prizes ?? 0} icon={Gift} />
      <StatCard label="Đã trao" value={stats?.awarded ?? 0} icon={Trophy} />
      <StatCard label="Đang xử lý" value={(stats?.pending ?? 0) + (stats?.processing ?? 0)} icon={Phone} />
    </div>
    <section className="rounded-xl border border-border bg-card shadow-e1">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold">Chương trình được phân công</h2>
        <p className="mt-1 text-xs text-muted-foreground">Kiểm tra thể lệ, thời gian, giải thưởng và điều kiện trước khi quay.</p>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {programs.length === 0 ? <p className="text-sm text-muted-foreground">Chưa được phân công chương trình nào.</p> : programs.map((program) => (
            <Button key={program.program_id} variant={selectedProgramId === String(program.program_id) ? "default" : "outline"} className="w-full justify-start" onClick={() => setSelectedProgramId(String(program.program_id))}>
              <ClipboardCheck className="h-4 w-4" />{program.program_code} · {program.program_name}
            </Button>
          ))}
        </div>
        {overview ? <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-semibold">{overview.program_name}</h3><p className="text-xs text-muted-foreground">{overview.program_code} · Trạng thái: {overview.status}</p></div>
            <Button size="sm" variant="outline" onClick={() => window.location.assign(`/quan-tri/quay-so?program=${overview.program_id}`)}><Trophy className="h-3.5 w-3.5" />Mở bàn quay</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-secondary/50 p-3 text-sm"><p className="text-xs text-muted-foreground">Vé hợp lệ</p><p className="mt-1 font-semibold">{overview.eligible_ticket_count} / {overview.total_tickets}</p></div>
            <div className="rounded-md bg-secondary/50 p-3 text-sm"><p className="text-xs text-muted-foreground">Đơn chờ thanh toán</p><p className="mt-1 font-semibold">{overview.pending_order_count}</p></div>
            <div className="rounded-md bg-secondary/50 p-3 text-sm"><p className="text-xs text-muted-foreground">Thời gian quay</p><p className="mt-1 font-semibold">{formatDateTime(overview.draw_time ?? undefined)}</p></div>
            <div className="rounded-md bg-secondary/50 p-3 text-sm"><p className="text-xs text-muted-foreground">Số giải</p><p className="mt-1 font-semibold">{overview.prizes.reduce((sum, prize) => sum + prize.quantity, 0)}</p></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["Đã kết thúc chương trình", overview.checks.ended],
              ["Không còn đơn chờ thanh toán", overview.checks.noPendingOrders],
              ["Có vé đã thanh toán hợp lệ", overview.checks.hasEligibleTickets],
              ["Đã cấu hình giải thưởng", overview.checks.hasPrizes],
              ["Chưa thực hiện quay", overview.checks.notDrawn],
            ] as const).map(([label, passed]) => <div key={label} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${passed ? "border-emerald-500/30 text-emerald-600" : "border-amber-500/30 text-amber-600"}`}><FileCheck2 className="h-4 w-4" />{label}: {passed ? "Đạt" : "Chưa đạt"}</div>)}
          </div>
          <p className="text-xs text-muted-foreground">{overview.description || "Chưa có mô tả chương trình."}</p>
          <p className="text-xs text-muted-foreground">Thể lệ: {overview.rules || "Chưa cập nhật thể lệ."}</p>
          <div className="overflow-x-auto rounded-md border border-border">
            <div className="flex items-center gap-2 border-b border-border p-3 text-sm font-medium"><Ticket className="h-4 w-4" />Vé hợp lệ ({tickets.length})</div>
            <table className="w-full text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-3">Mã vé</th><th className="p-3">Đơn hàng</th><th className="p-3">Người tham gia</th><th className="p-3">Đã thanh toán</th></tr></thead><tbody>{tickets.slice(0, 100).map((ticket) => <tr key={ticket.ticket_id} className="border-b border-border last:border-0"><td className="p-3 font-mono">{ticket.ticket_number}</td><td className="p-3">{ticket.order_code}</td><td className="p-3">{ticket.owner_name}</td><td className="p-3">{formatDateTime(ticket.paid_at)}</td></tr>)}</tbody></table>
            {tickets.length > 100 && <p className="p-3 text-xs text-muted-foreground">Đang hiển thị 100 vé đầu tiên trong tổng số {tickets.length} vé.</p>}
          </div>
        </div> : <p className="p-6 text-sm text-muted-foreground">Chọn chương trình để xem bảng kiểm.</p>}
      </div>
    </section>
    <section className="rounded-xl border border-border bg-card shadow-e1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div><h2 className="font-semibold">Người thắng và trao giải</h2><p className="mt-1 text-xs text-muted-foreground">Mọi thay đổi đều được ghi vào audit log.</p></div>
      </div>
      <div className="divide-y divide-border">
        {winners.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có người thắng được ghi nhận.</p> : winners.map((winner) => <div key={winner.winner_id} className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
          <div><p className="font-semibold">{winner.program_code} · {winner.prize_name}</p><p className="mt-1 text-xs text-muted-foreground">{winner.winner_name} · {winner.winner_email} · vé {winner.ticket_number}</p><p className="mt-1 text-xs text-muted-foreground">Đơn {winner.order_code} · trúng lúc {formatDateTime(winner.won_at)}</p></div>
          <div className="text-xs text-muted-foreground"><p>Liên hệ: {formatDateTime(winner.contacted_at ?? undefined)}</p><p>Xác minh: {formatDateTime(winner.verified_at ?? undefined)}</p><p>Trao giải: {formatDateTime(winner.awarded_at ?? undefined)}</p></div>
          <div className="flex flex-wrap items-center justify-end gap-2"><Select value={winner.claim_status} onValueChange={(value) => void update(winner, value)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => void exportRecord(winner.program_id)}><Download className="h-3.5 w-3.5" />Biên bản</Button></div>
        </div>)}
      </div>
    </section>
    <section className="rounded-xl border border-border bg-card shadow-e1">
      <div className="border-b border-border p-5"><h2 className="font-semibold">Lịch sử các lần quay</h2><p className="mt-1 text-xs text-muted-foreground">Biên bản chỉ đọc, không thể sửa kết quả.</p></div>
      <div className="divide-y divide-border">{history.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có lần quay nào.</p> : history.map((draw) => <div key={draw.draw_id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-semibold">{draw.program_code} · {draw.program_name}</p><p className="mt-1 text-xs text-muted-foreground">{draw.draw_code} · {formatDateTime(draw.completed_at)} · {draw.winner_count} giải · {draw.algorithm_version}</p></div><Button size="sm" variant="outline" onClick={() => void exportRecord(draw.program_id)}><Download className="h-3.5 w-3.5" />Xuất biên bản</Button></div>)}</div>
    </section>
    <section className="rounded-xl border border-border bg-card shadow-e1">
      <div className="border-b border-border p-5"><h2 className="font-semibold">Lịch sử hoạt động</h2><p className="mt-1 text-xs text-muted-foreground">Các thao tác quay, cập nhật trao giải và công bố được ghi nhận.</p></div>
      <div className="divide-y divide-border">{audit.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có hoạt động.</p> : audit.map((entry) => <div key={entry.audit_id} className="flex items-center gap-3 p-4 text-sm"><History className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{entry.action} · {entry.entity_type} {entry.entity_id ?? ""}</p><p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)} · {entry.actor_name ?? "Hệ thống"}</p></div></div>)}</div>
    </section>
  </div>;
};

export default OperatorDashboardPage;
