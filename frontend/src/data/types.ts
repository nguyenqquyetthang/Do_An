export type Role = "USER" | "ORGANIZER" | "DRAW_OPERATOR" | "ADMIN";

export type ProgramStatus =
  | "draft"
  | "pending_review"
  | "rejected"
  | "upcoming"
  | "active"
  | "ended"
  | "closed"
  | "published"
  | "suspended";

export type TicketStateServer = "available" | "held" | "sold" | "unavailable";

export type OrderStatus = "held" | "paid" | "expired" | "cancelled";

export type PrizeCategory = "tech" | "vehicle" | "cash" | "travel" | "home" | "other";

export interface PrizeTerm {
  id: string;
  label: string;
  quantity: number;
  value: number;
}

export interface PublishedWinner {
  termId: string;
  termLabel: string;
  number: number;
  ownerName: string;
  status: "pending" | "confirmed" | "paid";
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  prizeName: string;
  prizeValue: number;
  prizeTerms: PrizeTerm[];
  ticketPrice: number;
  totalNumbers: number;
  numberLength: number;
  startAt: string;
  endAt: string;
  drawnAt?: string;
  publishedAt?: string;
  status: ProgramStatus;
  rejectionReason?: string;
  category: PrizeCategory;
  drawMethod: string;
  rules: string[];
  organizer: string;
  organizerId: string;
  commitHash: string;
  serverSecret: string;
  publicSeed?: string;
  winners?: PublishedWinner[];
  mediaName?: string;
  mediaKind?: "image" | "video";
  mediaSize?: number;
}

export interface Order {
  id: string;
  orderCode?: string;
  programId: string;
  userId: string;
  userName: string;
  numbers: number[];
  unitPrice: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  holdUntil: number;
  method?: string;
  paymentCode?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: Role | "SYSTEM";
  action: string;
  entity: string;
  detail: string;
  prevHash: string;
  hash: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  password: string;
  role: Role;
  balance: number;
  joinedAt: string;
}

export interface Ledger {
  /** Số đã bán (đã thanh toán) */
  sold: Map<number, { orderId: string; userId: string; userName: string }>;
  /** Số đang bị giữ bởi một đơn chưa thanh toán */
  held: Map<number, { orderId: string; userId: string; userName: string; until: number }>;
  /** Số không khả dụng do ban tổ chức khoá */
  unavailable: Set<number>;
}

export type Ledgers = Record<string, Ledger>;

export type TicketCellState = "available" | "mine" | "other" | "sold" | "unavailable";
