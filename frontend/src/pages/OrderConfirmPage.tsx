import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, TimerOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CountdownRing } from "@/components/shared/CountdownRing";
import { HOLD_DURATION_MS, useLottery } from "@/store/lottery";
import { formatDateTime, formatNumber, formatPoints, formatTicketNumber } from "@/lib/format";
import { RequireLogin } from "@/components/shared/RequireLogin";
import NotFound from "./NotFound";

const OrderConfirmPage = () => {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { orderById, getProgram, currentUser, cancelOrder } = useLottery();

  const order = orderById(orderId);

  if (!currentUser) {
    return (
      <RequireLogin
        title="Cần đăng nhập để xem đơn hàng"
        description="Đơn giữ số gắn với tài khoản của bạn, hãy đăng nhập để xác nhận và thanh toán."
      />
    );
  }

  if (!order || order.userId !== currentUser.id) return <NotFound />;

  const program = getProgram(order.programId);
  const expired = order.status === "expired" || order.holdUntil <= Date.now();
  const holdTarget = Math.min(order.holdUntil, Date.now() + HOLD_DURATION_MS);

  return (
    <div className="container max-w-4xl py-10">
      <Link
        to={`/chuong-trinh/${order.programId}/chon-so`}
        className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại bàn chọn số
      </Link>

      <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Xác nhận đơn hàng</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Mã đơn <span className="font-mono-nums text-foreground">{order.id}</span> · tạo lúc{" "}
        {formatDateTime(order.createdAt)}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Chương trình</p>
              <p className="mt-1 text-[16px] font-semibold">{program?.name}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{program?.prizeName}</p>
            </div>
            <Badge variant={order.status === "paid" ? "verified" : "soft"}>
              {order.status === "paid" ? "Đã thanh toán" : "Đang giữ số"}
            </Badge>
          </div>

          <Separator className="my-6" />

          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Số dự thưởng</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {order.numbers.map((value) => (
              <span
                key={value}
                className="font-mono-nums rounded-cell border border-gold/40 bg-primary/12 px-3 py-2 text-[15px] font-bold text-gold"
              >
                {formatTicketNumber(value, program?.numberLength ?? 4)}
              </span>
            ))}
          </div>

          <Separator className="my-6" />

          <dl className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Số lượng</dt>
              <dd className="font-mono-nums">{formatNumber(order.numbers.length)} số</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Đơn giá</dt>
              <dd className="font-mono-nums">{formatPoints(order.unitPrice)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-[15px] font-semibold">Tổng cộng</dt>
              <dd className="font-mono-nums text-xl font-bold text-gold">{formatPoints(order.total)}</dd>
            </div>
          </dl>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gold/25 bg-gradient-panel p-6 text-center shadow-e2">
            {expired ? (
              <>
                <TimerOff className="mx-auto h-10 w-10 text-destructive-text" />
                <p className="mt-3 text-[15px] font-semibold">Hết thời gian giữ số</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Các số đã được trả về trạng thái còn trống cho người dùng khác.
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link to={`/chuong-trinh/${order.programId}/chon-so`}>Chọn lại số khác</Link>
                </Button>
              </>
            ) : (
              <>
                <CountdownRing
                  target={holdTarget}
                  total={HOLD_DURATION_MS}
                  label="Giữ số còn"
                  size={136}
                  className="mx-auto"
                />
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Hết hạn giữ số lúc {formatDateTime(new Date(order.holdUntil).toISOString())}
                </p>
                <Button
                  size="lg"
                  className="mt-4 w-full"
                  onClick={() => navigate(`/don/${order.id}/thanh-toan`)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Xác nhận và thanh toán
                </Button>
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    void cancelOrder(order.id).then(() => navigate(`/chuong-trinh/${order.programId}/chon-so`));
                  }}
                >
                  Huỷ đơn và chọn lại
                </Button>
              </>
            )}
          </div>

          <p className="rounded-md border border-border bg-card px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
            Số chỉ chuyển sang trạng thái “đã bán” sau khi thanh toán thành công. Trước đó số ở trạng thái
            “đang giữ” và sẽ tự động trả về nếu hết 10 phút.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default OrderConfirmPage;
