import { useEffect, useState } from "react";
import { FileClock, Link2, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { shortHash } from "@/lib/draw";
import { verifyAuditChain } from "@/lib/audit";
import { formatDateTime, shortTime } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import { api } from "@/lib/api";

const actionTone = (action: string) =>
  action.includes("PUBLISH")
    ? "verified"
    : action.includes("DRAW")
      ? "soft"
      : action.includes("PAYMENT")
        ? "success"
        : action.includes("HOLD")
          ? "warning"
          : action.includes("CANCEL")
            ? "danger"
            : "outline";

const AdminAuditPage = () => {
  const { audit: localAudit } = useLottery();
  const [dbLogs, setDbLogs] = useState<Array<any>>([]);
  const [action, setAction] = useState("all");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let active = true;
    api.adminAudit()
      .then((records) => {
        if (!active) return;
        setDbLogs(records);
      })
      .catch((err) => {
        console.error("Không thể tải audit log từ database:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Kết hợp audit log từ database và local hash-chain
  const formattedDbLogs = dbLogs.map((log) => {
    const newData = typeof log.new_data === "object" && log.new_data !== null ? log.new_data : {};
    let detail = "";
    if (log.action.includes("PAYMENT")) {
      detail = `Thanh toán: ${newData.payment_code || log.entity_id || ""} - Số tiền: ${newData.amount ? Number(newData.amount).toLocaleString("vi-VN") + "đ" : ""} - PT: ${newData.payment_method || "QR"}`;
      if (newData.idempotency_key) {
        detail += ` (Idempotency: ${newData.idempotency_key})`;
      }
    } else {
      detail = JSON.stringify(newData);
    }

    return {
      id: `db_${log.audit_id}`,
      at: log.created_at,
      actor: log.username || "Hệ thống",
      actorRole: "USER / ADMIN",
      action: log.action,
      entity: `${log.entity_type} ${log.entity_id ?? ""}`.trim(),
      detail,
      hash: "db_verified_" + log.audit_id,
      ip: log.ip_address,
    };
  });

  const combinedAudit = formattedDbLogs.length > 0 ? formattedDbLogs : localAudit;
  const actions = [...new Set(combinedAudit.map((entry) => entry.action))];
  const rows = [...combinedAudit]
    .filter((entry) => action === "all" || entry.action === action)
    .filter((entry) => {
      if (!keyword.trim()) return true;
      const needle = keyword.trim().toLowerCase();
      return (
        entry.actor.toLowerCase().includes(needle) ||
        entry.entity.toLowerCase().includes(needle) ||
        entry.detail.toLowerCase().includes(needle)
      );
    });

  const intact = verifyAuditChain(localAudit);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Kiểm toán"
        title="Audit log"
        description="Bản ghi chỉ được thêm, mỗi bản ghi khoá bản ghi trước bằng SHA-256 nên không thể sửa lén."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng bản ghi" value={audit.length} icon={FileClock} />
        <StatCard label="Loại hành động" value={actions.length} icon={Search} />
        <StatCard
          label="Chuỗi toàn vẹn"
          value={intact ? 1 : 0}
          suffix={intact ? "hợp lệ" : "sai lệch"}
          icon={ShieldCheck}
          hint={intact ? "Hash chain khớp từ bản ghi đầu tiên" : "Phát hiện bản ghi bị thay đổi"}
        />
      </div>

      <div
        className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${
          intact ? "border-verified/35 bg-verified/10" : "border-destructive/40 bg-destructive/10"
        }`}
      >
        <Link2 className={`mt-0.5 h-4 w-4 ${intact ? "text-verified-text" : "text-destructive-text"}`} />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {intact
            ? "Chuỗi hash của audit log hợp lệ: mỗi bản ghi đều khớp với hash của bản ghi liền trước, chứng minh dữ liệu không bị chỉnh sửa sau khi ghi."
            : "Chuỗi hash không khớp — dữ liệu audit có thể đã bị can thiệp."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-e1">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-full border-input bg-card sm:w-60">
            <SelectValue placeholder="Hành động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hành động</SelectItem>
            {actions.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo người dùng, đối tượng hoặc nội dung"
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{rows.length} bản ghi</Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-e1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Thời gian</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Người thực hiện</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Hành động</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Đối tượng</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Chi tiết</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 60).map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">
                  <span className="font-mono-nums text-[13px]">{shortTime(entry.at)}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatDateTime(entry.at)}
                  </span>
                </TableCell>
                <TableCell className="text-[13px]">
                  {entry.actor}
                  <span className="mt-1 block text-[11px] text-muted-foreground">{entry.actorRole}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={actionTone(entry.action) as "verified" | "soft" | "success" | "warning" | "danger" | "outline"}>
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono-nums text-[12px]">{entry.entity}</TableCell>
                <TableCell className="max-w-[280px] truncate text-[12px] text-muted-foreground" title={entry.detail}>
                  {entry.detail}
                </TableCell>
                <TableCell className="font-mono-nums text-[11px] text-muted-foreground" title={entry.hash}>
                  {shortHash(entry.hash, 8, 6)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminAuditPage;
