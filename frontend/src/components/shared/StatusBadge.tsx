import { Badge } from "@/components/ui/badge";
import type { OrderStatus, ProgramStatus } from "@/data/types";

const programLabels: Record<ProgramStatus, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  rejected: "Bị từ chối",
  upcoming: "Sắp mở",
  active: "Đang diễn ra",
  ended: "Đã kết thúc",
  closed: "Đã khoá bán",
  published: "Đã công bố",
  suspended: "Tạm dừng",
};

const programVariants: Record<ProgramStatus, "soft" | "outline" | "verified" | "warning" | "danger"> = {
  draft: "outline",
  pending_review: "warning",
  rejected: "outline",
  upcoming: "warning",
  active: "soft",
  ended: "outline",
  closed: "outline",
  published: "verified",
  suspended: "danger",
};

export function ProgramStatusBadge({ status, className }: { status: ProgramStatus; className?: string }) {
  return (
    <Badge variant={programVariants[status]} className={className}>
      {programLabels[status]}
    </Badge>
  );
}

const orderLabels: Record<OrderStatus, string> = {
  held: "Đang giữ số",
  paid: "Thanh toán thành công",
  expired: "Hết hạn giữ số",
  cancelled: "Đã huỷ",
};

const orderVariants: Record<OrderStatus, "soft" | "verified" | "danger" | "outline"> = {
  held: "soft",
  paid: "verified",
  expired: "danger",
  cancelled: "outline",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant={orderVariants[status]} className={className}>
      {orderLabels[status]}
    </Badge>
  );
}
