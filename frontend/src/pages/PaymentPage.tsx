import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  QrCode,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { formatDateTime, formatPoints, formatTicketNumber } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import { api, type PaymentQrData } from "@/lib/api";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

const methods = [
  {
    id: "qr_simulation",
    label: "Quét mã VietQR (Mô phỏng)",
    description: "Thanh toán qua mã QR ngân hàng hoặc mô phỏng thanh toán tức thì.",
    icon: QrCode,
    isDefault: true,
  },
  {
    id: "Ví tài khoản",
    label: "Ví tài khoản",
    description: "Xác nhận thanh toán từ số dư ví tài khoản.",
    icon: Wallet,
  },
  {
    id: "Mã thanh toán",
    label: "Mã thanh toán nhanh",
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
  const [qrData, setQrData] = useState<PaymentQrData | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    payment_code?: string;
    transaction_reference?: string;
    amount?: number | string;
    paid_at?: string;
    replayed?: boolean;
  } | null>(null);

  // Sinh Idempotency Key duy nhất cho phiên thanh toán này của đơn hàng
  const [idempotencyKey] = useState(() => `idem_${orderId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setLoadingQr(true);
    api.getPaymentQr(orderId)
      .then((data) => {
        if (active) setQrData(data);
      })
      .catch((err) => {
        console.error("Không thể tải thông tin QR thanh toán:", err);
      })
      .finally(() => {
        if (active) setLoadingQr(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`Đã sao chép ${label}`),
      () => toast.error("Không thể sao chép"),
    );
  };

  const handlePay = async () => {
    if (processing) return;
    setProcessing(true);
    const result = await payOrder(order.id, method, idempotencyKey);
    setProcessing(false);

    if (!result.ok) {
      toast.error(result.error ?? "Thanh toán không thành công.");
      return;
    }

    setPaid(true);
    if (result.payment) {
      setPaymentResult({
        payment_code: result.payment.payment_code,
        transaction_reference: result.payment.transaction_reference,
        amount: result.payment.amount,
        paid_at: result.payment.paid_at,
        replayed: result.replayed,
      });
    }

    if (result.replayed) {
      toast.info("Đơn hàng này đã được xác nhận thanh toán trước đó (Idempotent Safe).");
    } else {
      toast.success("Thanh toán thành công và đã ghi nhận log giao dịch an toàn.");
    }
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
            Mã đơn hàng <span className="font-mono-nums font-semibold text-foreground">{order.id}</span>
          </p>

          {/* Chi tiết log giao dịch & Idempotency */}
          <div className="mx-auto mt-6 max-w-lg rounded-lg border border-border bg-secondary/30 p-4 text-left text-[13px]">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-muted-foreground">Mã giao dịch (Txn Ref)</span>
              <span className="font-mono-nums font-semibold text-foreground">
                {paymentResult?.transaction_reference ?? "TXN-QR-SIMULATED"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border py-2.5">
              <span className="text-muted-foreground">Mã thanh toán</span>
              <span className="font-mono-nums text-foreground">
                {paymentResult?.payment_code ?? "PAY-CONFIRMED"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border py-2.5">
              <span className="text-muted-foreground">Số tiền thanh toán</span>
              <span className="font-mono-nums font-bold text-gold">
                {formatPoints(order.total)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border py-2.5">
              <span className="text-muted-foreground">Thời gian ghi nhận</span>
              <span className="font-mono-nums text-foreground">
                {formatDateTime(paymentResult?.paid_at ?? order.paidAt ?? new Date().toISOString())}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-muted-foreground">Idempotency Status</span>
              <span className="inline-flex items-center gap-1 rounded bg-verified/15 px-2 py-0.5 text-[11px] font-semibold text-verified-text">
                <ShieldCheck className="h-3 w-3" />
                {paymentResult?.replayed ? "Replayed (Tránh thanh toán 2 lần)" : "Giao dịch lần đầu hợp lệ"}
              </span>
            </div>
          </div>

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
            <ShieldCheck className="h-3.5 w-3.5 text-verified-text" />
            Giao dịch đã được lưu vào hệ thống Audit Log chống gian lận & race condition.
          </p>
        </div>
      </div>
    );
  }

  const transferContent = qrData?.transferContent || `LUCKYDRAW ${order.id}`;
  const bankName = qrData?.bankName || "MBBank - Ngân hàng TMCP Quân Đội";
  const accountNumber = qrData?.accountNumber || "999988886666";
  const accountName = qrData?.accountName || "LUCKYDRAW LOTTERY PORTAL";

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">Thanh toán đơn hàng</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Hoàn tất thanh toán để nhận số dự thưởng hợp lệ cho chương trình.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-[12px] font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" />
          Hỗ trợ QR & Chống trùng lặp (Idempotent)
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          {/* Chọn phương thức thanh toán */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="text-[15px] font-semibold">Chọn phương thức thanh toán</h2>
            <div className="mt-4 space-y-3">
              {methods.map((item) => {
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-all duration-150 ease-standard",
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
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[14px] font-semibold">
                        {item.label}
                        {item.isDefault && (
                          <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                            Khuyên dùng
                          </span>
                        )}
                      </span>
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
          </div>

          {/* KHUNG THANH TOÁN QR MÔ PHỎNG */}
          {method === "qr_simulation" && (
            <div className="rounded-xl border border-gold/30 bg-card p-6 shadow-e2">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Mã VietQR thanh toán</h3>
                  <p className="text-[12px] text-muted-foreground">Quét mã bằng ứng dụng ngân hàng hoặc ví điện tử</p>
                </div>
                <span className="rounded-full bg-verified/15 px-3 py-1 text-[11px] font-semibold text-verified-text">
                  Sandbox Simulation
                </span>
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-[180px_1fr]">
                {/* Ảnh QR */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-white p-3 shadow-sm">
                  {loadingQr ? (
                    <div className="flex h-40 w-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-gold" />
                      <span className="text-[11px]">Đang tạo QR...</span>
                    </div>
                  ) : (
                    <img
                      src={
                        qrData?.qrCodeUrl ||
                        `https://img.vietqr.io/image/MB-999988886666-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`
                      }
                      alt="VietQR Code"
                      className="h-40 w-40 object-contain"
                      loading="lazy"
                    />
                  )}
                  <span className="mt-2 text-[10px] font-semibold tracking-wide text-zinc-600">
                    VIETQR · NAPAS 247
                  </span>
                </div>

                {/* Thông tin chuyển khoản */}
                <div className="space-y-2.5 text-[13px]">
                  <div className="rounded-md border border-border/80 bg-secondary/30 p-2.5">
                    <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">Ngân hàng thụ hưởng</span>
                    <span className="font-semibold text-foreground">{bankName}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border/80 bg-secondary/30 px-3 py-2">
                    <div>
                      <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">Số tài khoản</span>
                      <span className="font-mono-nums font-bold text-foreground">{accountNumber}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-[11px]"
                      onClick={() => copyToClipboard(accountNumber, "số tài khoản")}
                    >
                      <Copy className="h-3 w-3" />
                      Sao chép
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border/80 bg-secondary/30 px-3 py-2">
                    <div>
                      <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">Số tiền</span>
                      <span className="font-mono-nums font-bold text-gold">{formatPoints(order.total)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-[11px]"
                      onClick={() => copyToClipboard(String(order.total), "số tiền")}
                    >
                      <Copy className="h-3 w-3" />
                      Sao chép
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-gold/40 bg-primary/10 px-3 py-2">
                    <div>
                      <span className="block text-[11px] text-gold uppercase tracking-wider font-semibold">Nội dung chuyển khoản</span>
                      <span className="font-mono-nums font-bold text-foreground">{transferContent}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 border-gold/50 px-2 text-[11px] text-gold hover:bg-gold/10"
                      onClick={() => copyToClipboard(transferContent, "nội dung chuyển khoản")}
                    >
                      <Copy className="h-3 w-3" />
                      Sao chép
                    </Button>
                  </div>
                </div>
              </div>

              {/* Thông báo mô phỏng */}
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-secondary/20 p-3 text-[12px] text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p>
                  Đây là cổng thanh toán mô phỏng (Sandbox). Khi bấm nút bên dưới, hệ thống sẽ tự động xác thực chữ ký
                  giao dịch, chuyển vé sang trạng thái đã bán và ghi log kiểm toán an toàn.
                </p>
              </div>

              {/* Nút thanh toán QR mô phỏng */}
              <Button
                size="lg"
                className="mt-5 w-full gap-2 bg-gradient-gold text-primary-foreground font-bold hover:opacity-95 shadow-glow-gold"
                onClick={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xác nhận giao dịch QR…
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Mô phỏng quét mã & Thanh toán ngay
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Nút thanh toán thông thường cho các phương thức khác */}
          {method !== "qr_simulation" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
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
                  "Xác nhận thanh toán"
                )}
              </Button>
            </div>
          )}

          {/* Thông tin Idempotency */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/15 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-verified-text" />
              Khóa an toàn Idempotency:
            </span>
            <span className="font-mono-nums text-[10px] text-foreground">{idempotencyKey}</span>
          </div>
        </div>

        {/* Tóm tắt đơn hàng bên phải */}
        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-e1">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Đơn hàng</p>
          <p className="font-mono-nums mt-1 text-[16px] font-semibold">{order.id}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{program?.name}</p>

          <Separator className="my-5" />

          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
            Vé đã chọn ({order.numbers.length})
          </p>
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
            Sau thời điểm này nếu chưa thanh toán, vé sẽ được trả về trạng thái tự do.
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
