import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, CheckCircle2, Loader2, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { formatDateTime, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

const methods = [
  { id: "Ví tài khoản", label: "Ví tài khoản", description: "Xác nhận thanh toán từ tài khoản đang đăng nhập.", icon: Wallet },
  {
    id: "Mã thanh toán",
    label: "Mã thanh toán",
    description: "Tạo mã giao dịch và ghi nhận thanh toán cho đơn hàng.",
    icon: Receipt,
  },
];

const PaymentPage = () => {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { orderById, getProgram, currentUser, payOrder } = useLottery();

  const order = orderById(orderId);
  const [method, setMethod] = useState(methods[0].id);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  if (!currentUser) {
    return (
      <RequireLogin
        title="Cần đăng nhập để thanh toán"
        description="Bạn cần đăng nhập để xác nhận thanh toán cho đơn hàng."
      />
    );
  }

  if (!order || order.userId !== currentUser.id) return <NotFound />;

  const program = getProgram(order.programId);
  const success = paid || order.status === "paid";

  const handlePay = async () => {
    setProcessing(true);
    const result = await payOrder(order.id, method);
    setProcessing(false);
    if (!result.ok) {
      toast.error(result.error ?? "Thanh toán không thành công.");
      return;
    }
    setPaid(true);
    toast.success("Thanh toán thành công.");
  };

  if (success) {
    return (
      <div className="container max-w-3xl py-14">
        <div className="animate-rise rounded-xl border border-verified/30 bg-card p-8 text-center shadow-glow-verified">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-verified text-success-foreground">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">Thanh toán thành công</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Mã đơn hàng <span className="font-mono-nums text-foreground">{order.id}</span> · {method} ·{" "}
            {formatDateTime(order.paidAt ?? new Date().toISOString())}
          </p>

          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Số dự thưởng của bạn</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {order.numbers.map((value) => (
                <span
                  key={value}
                  className="font-mono-nums animate-reveal rounded-cell border border-gold/50 bg-primary/15 px-3.5 py-2 text-lg font-bold text-gold"
                >
                  {formatTicketNumber(value, program?.numberLength ?? 4)}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/ve-cua-toi")}>
              <BadgeCheck className="h-4 w-4" />
              Xem vé của tôi
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(`/chuong-trinh/${order.programId}`)}>
              Về chương trình
            </Button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Giao dịch đã được ghi vào audit log và không thể chỉnh sửa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Thanh toán đơn hàng</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Chọn phương thức thanh toán để hoàn tất đơn hàng và chuyển vé sang trạng thái đã bán.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <h2 className="text-[15px] font-semibold">Phương thức thanh toán</h2>
          <div className="mt-4 space-y-3">
            {methods.map((item) => {
              const active = method === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-4 py-4 text-left transition-all duration-150 ease-standard",
                    active
                      ? "border-gold/60 bg-primary/10 shadow-glow-gold"
                      : "border-border bg-secondary/30 hover:border-input",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 items-center justify-center rounded-md",
                      active ? "bg-primary/20 text-gold" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-[12px] text-muted-foreground">{item.description}</span>
                  </span>
                  <span
                    className={cn(
                      "ml-auto mt-1.5 h-4 w-4 shrink-0 rounded-full border",
                      active ? "border-primary bg-primary" : "border-input",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Separator className="my-6" />

          <dl className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Số dư hiện tại</dt>
              <dd className="font-mono-nums">{formatPoints(currentUser.balance)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Giá trị đơn hàng</dt>
              <dd className="font-mono-nums">{formatPoints(order.total)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-semibold">Số dư sau thanh toán</dt>
              <dd className="font-mono-nums font-semibold">
                {formatPoints(Math.max(0, currentUser.balance - order.total))}
              </dd>
            </div>
          </dl>

          <Button size="lg" className="mt-6 w-full" onClick={handlePay} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý giao dịch…
              </>
            ) : (
              "Thanh toán"
            )}
          </Button>
        </div>

        <aside className="rounded-xl border border-border bg-card p-6 shadow-e1">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Đơn hàng</p>
          <p className="font-mono-nums mt-1 text-[16px] font-semibold">{order.id}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{program?.name}</p>

          <Separator className="my-5" />

          <div className="flex flex-wrap gap-2">
            {order.numbers.map((value) => (
              <span
                key={value}
                className="font-mono-nums rounded-cell border border-border bg-secondary/50 px-2.5 py-1.5 text-[13px] font-semibold"
              >
                {formatTicketNumber(value, program?.numberLength ?? 4)}
              </span>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Tổng cộng</span>
            <span className="font-mono-nums text-xl font-bold text-gold">{formatPoints(order.total)}</span>
          </div>

          <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
            Đơn giữ số đến{" "}
            <span className="font-mono-nums text-foreground">{formatDateTime(new Date(order.holdUntil).toISOString())}</span>.
            Sau thời điểm này các số sẽ được trả về trạng thái còn trống.
          </p>
          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to={`/don/${order.id}/xac-nhan`}>Quay lại bước xác nhận</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default PaymentPage;
