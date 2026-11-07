import { useEffect, useState } from "react";
import { ClipboardCheck, Download, Gift, History, Phone, Trophy } from "lucide-react";
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

  const load = () => {
    void Promise.all([api.operatorStats(), api.operatorWinners(), api.operatorDrawHistory()])
      .then(([nextStats, nextWinners, nextHistory]) => { setStats(nextStats); setWinners(nextWinners); setHistory(nextHistory); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải dữ liệu quay thưởng."));
  };
  useEffect(load, []);

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
  </div>;
};

export default OperatorDashboardPage;
