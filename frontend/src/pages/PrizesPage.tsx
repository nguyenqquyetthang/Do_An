import { useEffect, useState } from "react";
import { Gift, Phone, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { formatDateTime, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import { api, type ApiPrizeWin } from "@/lib/api";

const PrizesPage = () => {
  const { currentUser, ordersOf, getProgram } = useLottery();
  const [serverWins, setServerWins] = useState<ApiPrizeWin[]>([]);
  useEffect(() => {
    if (currentUser) api.myPrizes().then(setServerWins).catch(() => setServerWins([]));
  }, [currentUser]);
  if (!currentUser) return <RequireLogin title="Đăng nhập để xem giải thưởng" description="Theo dõi trạng thái xác minh và trao giải của các vé trúng." />;
  const localWins = ordersOf(currentUser.id).filter((order) => order.status === "paid").flatMap((order) => {
    const program = getProgram(order.programId);
    return (program?.winners ?? []).filter((winner) => order.numbers.includes(winner.number)).map((winner) => ({ order, program, winner }));
  });
  const wins = serverWins.length > 0 ? serverWins.map((win) => ({
    order: { id: String(win.winner_id), orderCode: win.order_code, numbers: [Number(win.ticket_number)] },
    program: getProgram(String(win.program_id)),
    winner: { number: Number(win.ticket_number), termLabel: win.prize_name, termId: "", status: win.claim_status === "awarded" ? "paid" as const : win.claim_status === "verified" ? "confirmed" as const : "pending" as const },
  })) : localWins;
  return <div className="container py-10">
    <Badge variant="verified"><Trophy className="h-3 w-3" /> Giải thưởng của tôi</Badge>
    <h1 className="mt-4 text-2xl font-extrabold sm:text-[30px]">Theo dõi nhận giải</h1>
    <p className="mt-2 text-[13px] text-muted-foreground">Mã vé, mã đơn hàng và trạng thái trao giải được cập nhật theo từng chương trình.</p>
    {wins.length === 0 ? <div className="mt-8 rounded-xl border border-dashed p-14 text-center"><Gift className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-4 font-semibold">Chưa có giải thưởng được ghi nhận</p><Button asChild variant="outline" className="mt-5"><Link to="/ket-qua">Xem kết quả quay số</Link></Button></div> : <div className="mt-8 grid gap-4 md:grid-cols-2">{wins.map(({ order, program, winner }) => <article key={`${order.id}-${winner.number}`} className="rounded-xl border border-gold/35 bg-card p-5 shadow-e1"><div className="flex items-center justify-between"><span className="font-mono-nums text-xs text-muted-foreground">{program?.code}</span><Badge variant={winner.status === "paid" ? "verified" : "warning"}>{winner.status === "paid" ? "Đã trao giải" : winner.status === "confirmed" ? "Đã xác minh" : "Chờ xác minh"}</Badge></div><h2 className="mt-3 text-lg font-bold">{winner.termLabel}</h2><p className="mt-1 text-sm text-muted-foreground">{program?.name}</p><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div>Mã vé<strong className="mt-1 block font-mono-nums text-gold">{formatTicketNumber(winner.number, program?.numberLength ?? 4)}</strong></div><div>Mã đơn<strong className="mt-1 block font-mono-nums">{order.orderCode ?? order.id}</strong></div><div>Giá trị<strong className="mt-1 block">{formatPoints(program?.prizeTerms.find((term) => term.id === winner.termId)?.value ?? 0)}</strong></div><div>Quay lúc<strong className="mt-1 block">{formatDateTime(program?.drawnAt)}</strong></div></div><p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Bộ phận trao giải sẽ liên hệ theo thông tin tài khoản.</p></article>)}</div>}
  </div>;
};

export default PrizesPage;
