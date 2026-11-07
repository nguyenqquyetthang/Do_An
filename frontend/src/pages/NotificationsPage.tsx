import { Bell, CalendarClock, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { formatDateTime } from "@/lib/format";
import { useLottery } from "@/store/lottery";

const NotificationsPage = () => {
  const { currentUser, programs, ordersOf, getProgram } = useLottery();
  if (!currentUser) return <RequireLogin title="Đăng nhập để xem thông báo" description="Nhận nhắc lịch quay và thông báo trúng thưởng tại đây." />;

  const orders = ordersOf(currentUser.id).filter((order) => order.status === "paid");
  const notifications = orders.flatMap((order) => {
    const program = getProgram(order.programId);
    if (!program) return [];
    const hits = (program.winners ?? []).filter((winner) => order.numbers.includes(winner.number));
    const result = hits.length
      ? [{ id: `${order.id}-win`, icon: Trophy, title: "Chúc mừng bạn đã trúng thưởng", body: `${program.name} · ${hits.map((hit) => hit.termLabel).join(", ")}`, date: program.publishedAt ?? program.drawnAt }]
      : [];
    return [...result, ...(program.drawnAt && new Date(program.drawnAt).getTime() > Date.now() - 7 * 86400000
      ? [{ id: `${order.id}-draw`, icon: CalendarClock, title: "Kết quả quay thưởng đã được công bố", body: program.name, date: program.drawnAt }]
      : [])];
  });
  const upcoming = programs.filter((program) => program.status === "upcoming" && new Date(program.endAt).getTime() - Date.now() < 7 * 86400000);
  const all = [...notifications, ...upcoming.map((program) => ({ id: `upcoming-${program.id}`, icon: CalendarClock, title: "Chương trình sắp quay thưởng", body: `${program.name} · dự kiến ${formatDateTime(program.endAt)}`, date: program.endAt }))];

  return (
    <div className="container max-w-3xl py-10">
      <Badge variant="soft"><Bell className="h-3 w-3" /> Thông báo</Badge>
      <h1 className="mt-4 text-2xl font-extrabold sm:text-[30px]">Thông báo của bạn</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">Nhắc lịch quay, kết quả và các cập nhật trao giải.</p>
      <div className="mt-8 space-y-3">
        {all.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center text-[13px] text-muted-foreground">Chưa có thông báo mới.</div> : all.map((item) => {
          const Icon = item.icon;
          return <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-e1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-gold"><Icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1 text-[13px] text-muted-foreground">{item.body}</p><p className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(item.date)}</p></div>
          </div>;
        })}
      </div>
      <Button asChild variant="outline" className="mt-6"><Link to="/ve-cua-toi">Xem vé của tôi</Link></Button>
    </div>
  );
};

export default NotificationsPage;
