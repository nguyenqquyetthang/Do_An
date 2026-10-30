import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Lock, PlayCircle, PlusCircle, Send, Wand2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { formatDateTime, formatNumber, formatPoints } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { ProgramStatus } from "@/data/types";

const AdminProgramsPage = () => {
  const { programs, programStats, setProgramStatus, submitProgram, currentUser } = useLottery();
  const [filter, setFilter] = useState<"all" | ProgramStatus>("all");

  const visible = programs.filter((program) => filter === "all" || program.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Quản lý chương trình"
          title={currentUser?.role === "ADMIN" ? "Duyệt chương trình" : "Chương trình của tôi"}
          description={currentUser?.role === "ADMIN"
            ? "Xem xét hồ sơ, duyệt chuyển sang sắp diễn ra hoặc từ chối kèm lý do."
            : "Tạo bản nháp, gửi duyệt, theo dõi trạng thái và doanh số chương trình."}
        />
        <Button asChild>
          <Link to="/quan-tri/chuong-trinh/tao-moi">
            <PlusCircle className="h-4 w-4" />
            Tạo chương trình
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-e1">
        <Select value={filter} onValueChange={(value) => setFilter(value as "all" | ProgramStatus)}>
          <SelectTrigger className="w-full border-input bg-card sm:w-64">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
            <SelectItem value="pending_review">Chờ duyệt</SelectItem>
            <SelectItem value="rejected">Bị từ chối</SelectItem>
            <SelectItem value="upcoming">Sắp mở</SelectItem>
            <SelectItem value="active">Đang diễn ra</SelectItem>
            <SelectItem value="ended">Đã kết thúc</SelectItem>
            <SelectItem value="closed">Đã khoá bán</SelectItem>
            <SelectItem value="published">Đã công bố</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline">{visible.length} chương trình</Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-e1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Mã</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Tên chương trình</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Thời gian</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Vé đã bán</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Giá / số</TableHead>
              <TableHead className="text-[12px] uppercase tracking-[0.08em]">Trạng thái</TableHead>
              <TableHead className="text-right text-[12px] uppercase tracking-[0.08em]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((program) => {
              const stats = programStats(program.id);
              return (
                <TableRow key={program.id}>
                  <TableCell className="font-mono-nums text-[13px]">{program.code}</TableCell>
                  <TableCell>
                    <span className="text-[13px] font-medium">{program.prizeName}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{program.name}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                    {formatDateTime(program.startAt)}
                    <span className="mt-1 block">{formatDateTime(program.endAt)}</span>
                  </TableCell>
                  <TableCell className="font-mono-nums text-[13px]">
                    {formatNumber(stats.sold)} / {formatNumber(program.totalNumbers)}
                  </TableCell>
                  <TableCell className="font-mono-nums text-[13px]">
                    {formatPoints(program.ticketPrice)}
                  </TableCell>
                  <TableCell>
                    <ProgramStatusBadge status={program.status} />
                    {program.status === "rejected" && (
                      <span className="mt-1 block max-w-48 text-[11px] text-destructive">
                        {program.rejectionReason || "Chưa có lý do được ghi nhận."}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {currentUser?.role === "ORGANIZER" && (program.status === "draft" || program.status === "rejected") && (
                        <Button
                          size="sm"
                          onClick={() => void submitProgram(program.id)
                            .then(() => toast.success(`${program.code} đã gửi Admin duyệt.`))
                            .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể gửi duyệt."))}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Gửi duyệt
                        </Button>
                      )}
                      {currentUser?.role === "ADMIN" && program.status === "pending_review" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            void setProgramStatus(program.id, "upcoming")
                              .then(() => toast.success(`${program.code} đã được duyệt và chuyển sang sắp mở.`))
                              .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể duyệt."));
                          }}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Duyệt
                        </Button>
                      )}
                      {currentUser?.role === "ADMIN" && program.status === "pending_review" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            const reason = window.prompt("Nhập lý do từ chối chương trình:");
                            if (!reason?.trim()) return;
                            void setProgramStatus(program.id, "rejected", reason.trim())
                              .then(() => toast.success(`${program.code} đã bị từ chối.`))
                              .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể từ chối."));
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Từ chối
                        </Button>
                      )}
                      {program.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProgramStatus(program.id, "closed");
                            toast.success(`${program.code} đã khoá bán.`);
                          }}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Khoá bán
                        </Button>
                      )}
                      {(program.status === "ended" || program.status === "closed" || program.status === "published") && (
                        <Button asChild size="sm" variant="subtle">
                          <Link to={`/quan-tri/quay-so?program=${program.id}`}>
                            <Wand2 className="h-3.5 w-3.5" />
                            Bàn quay số
                          </Link>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/chuong-trinh/${program.id}`}>
                          Xem
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
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

export default AdminProgramsPage;
