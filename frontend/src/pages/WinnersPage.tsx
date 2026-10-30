import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trophy, UserRound } from "lucide-react";

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
import { formatDate, formatPoints, formatTicketNumber, maskName } from "@/lib/format";
import { useLottery } from "@/store/lottery";

const WinnersPage = () => {
  const { programs } = useLottery();
  const [programFilter, setProgramFilter] = useState("all");

  const publishedPrograms = programs.filter((program) => program.status === "published");
  const rows = publishedPrograms
    .filter((program) => programFilter === "all" || program.id === programFilter)
    .flatMap((program) =>
      (program.winners ?? []).map((winner) => ({
        program,
        winner,
        prizeValue: program.prizeTerms.find((term) => term.id === winner.termId)?.value ?? 0,
      })),
    );

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Người trúng thưởng</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Thông tin cá nhân được che một phần để bảo vệ quyền riêng tư, nhưng số trúng thưởng thì công khai
            và có thể đối chiếu với kết quả đã công bố.
          </p>
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full border-input bg-card sm:w-72">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Chọn chương trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chương trình</SelectItem>
            {publishedPrograms.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.code} · {program.prizeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-input/60 px-6 py-16 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-[15px] font-semibold">Chưa có kết quả nào được công bố</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Khi ban tổ chức công bố kết quả, danh sách người trúng thưởng sẽ hiển thị tại đây.
          </p>
          <Button asChild className="mt-6">
            <Link to="/chuong-trinh">Xem chương trình đang mở</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-e1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Chương trình</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Giải</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Số trúng</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Người trúng</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Giá trị</TableHead>
                <TableHead className="text-[12px] uppercase tracking-[0.08em]">Trạng thái</TableHead>
                <TableHead className="text-right text-[12px] uppercase tracking-[0.08em]">Kết quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ program, winner, prizeValue }) => (
                <TableRow key={`${program.id}-${winner.termId}-${winner.number}`}>
                  <TableCell>
                    <span className="text-[13px] font-medium">{program.prizeName}</span>
                    <span className="mt-1 block font-mono-nums text-[11px] text-muted-foreground">
                      {program.code} · {formatDate(program.drawnAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="soft">{winner.termLabel}</Badge>
                  </TableCell>
                  <TableCell className="font-mono-nums text-lg font-bold text-gold">
                    {formatTicketNumber(winner.number, program.numberLength)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-[13px]">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      {maskName(winner.ownerName)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono-nums text-[13px]">{formatPoints(prizeValue)}</TableCell>
                  <TableCell>
                    <Badge variant={winner.status === "confirmed" ? "verified" : "outline"}>
                      {winner.status === "confirmed"
                        ? "Đã xác nhận"
                        : winner.status === "paid"
                          ? "Đã nhận thưởng"
                          : "Chờ xác nhận"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/xac-minh/${program.id}`}>
                        Xác minh
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WinnersPage;
