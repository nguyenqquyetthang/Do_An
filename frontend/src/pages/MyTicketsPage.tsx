import { Link } from "react-router-dom";
import { CalendarDays, Coins, ExternalLink, Hash, Ticket, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountdownText } from "@/components/shared/CountdownText";
import { ProgramStatusBadge } from "@/components/shared/StatusBadge";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { formatDateTime, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { Order, Program } from "@/data/types";

interface TicketState {
  label: string;
  variant: "soft" | "verified" | "outline" | "warning" | "danger";
}

const ticketStateOf = (program: Program | undefined, order: Order): TicketState => {
  if (!program) return { label: "Không xác định", variant: "outline" };
  if (program.status === "published") {
    const hits = (program.winners ?? []).filter((winner) => order.numbers.includes(winner.number));
    if (hits.length > 0) {
      return { label: `Trúng ${hits[0].termLabel}`, variant: "verified" };
    }
    return { label: "Không trúng giải", variant: "outline" };
  }
  if (program.status === "closed") return { label: "Đã khoá bán — chờ quay", variant: "warning" };
  return { label: "Đang chờ quay", variant: "soft" };
};

const MyTicketsPage = () => {
  const { currentUser, ordersOf, getProgram } = useLottery();

  if (!currentUser) {
    return (
      <RequireLogin
        title="Đăng nhập để xem vé của bạn"
        description="Toàn bộ số dự thưởng đã mua, mã đơn hàng và kết quả quay số hiển thị tại đây."
      />
    );
  }

  const orders = ordersOf(currentUser.id).filter((order) => order.status === "paid");
  const grouped = orders.reduce<Record<string, Order[]>>((acc, order) => {
    acc[order.programId] = [...(acc[order.programId] ?? []), order];
    return acc;
  }, {});

  const totalTickets = orders.reduce((sum, order) => sum + order.numbers.length, 0);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const wins = orders.reduce((sum, order) => {
    const program = getProgram(order.programId);
    if (!program?.winners) return sum;
    return sum + program.winners.filter((winner) => order.numbers.includes(winner.number)).length;
  }, 0);

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Vé của tôi</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {totalTickets} số dự thưởng · {formatPoints(totalSpent)} đã thanh toán
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="soft">
            <Ticket className="h-3 w-3" />
            {orders.length} đơn
          </Badge>
          <Badge variant={wins > 0 ? "verified" : "outline"}>
            <Trophy className="h-3 w-3" />
            {wins} giải trúng
          </Badge>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-input/60 px-6 py-16 text-center">
          <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-[15px] font-semibold">Bạn chưa có vé nào</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Chọn số dự thưởng ở một chương trình đang mở để bắt đầu.
          </p>
          <Button asChild className="mt-6">
            <Link to="/chuong-trinh">Xem chương trình đang mở</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {Object.entries(grouped).map(([programId, programOrders]) => {
            const program = getProgram(programId);
            return (
              <section key={programId}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-nums text-[12px] text-muted-foreground">
                      {program?.code}
                    </span>
                    <h2 className="text-[16px] font-semibold">{program?.name}</h2>
                    {program ? <ProgramStatusBadge status={program.status} /> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {program?.status === "published" ? (
                      <Button asChild size="sm" variant="verified">
                        <Link to={`/ket-qua/${programId}`}>
                          <Trophy className="h-3.5 w-3.5" />
                          Xem kết quả
                        </Link>
                      </Button>
                    ) : program?.status === "active" ? (
                      <span className="font-mono-nums text-[12px] text-muted-foreground">
                        Kết thúc sau <CountdownText target={new Date(program.endAt).getTime()} />
                      </span>
                    ) : null}
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/chuong-trinh/${programId}`}>
                        Chi tiết
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {programOrders.map((order) => {
                    const state = ticketStateOf(program, order);
                    return (
                      <article
                        key={order.id}
                        className="rounded-lg border border-border bg-card p-5 shadow-e1 transition-all duration-200 ease-standard hover:border-gold/35 hover:shadow-e2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono-nums text-[12px] text-muted-foreground">{order.id}</span>
                          <Badge variant={state.variant}>{state.label}</Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {order.numbers.map((value) => (
                            <span
                              key={value}
                              className="font-mono-nums rounded-cell border border-gold/40 bg-primary/12 px-2.5 py-1.5 text-[14px] font-bold text-gold"
                            >
                              {formatTicketNumber(value, program?.numberLength ?? 4)}
                            </span>
                          ))}
                        </div>

                        <dl className="mt-4 space-y-2 text-[12px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Mua lúc {formatDateTime(order.paidAt ?? order.createdAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5" />
                            {order.numbers.length} số · {formatPoints(order.unitPrice)} / số
                          </div>
                          <div className="flex items-center gap-2">
                            <Coins className="h-3.5 w-3.5" />
                            <span className="font-mono-nums text-foreground">{formatPoints(order.total)}</span>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
