import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { appendAudit } from "@/lib/audit";
import { buildCommitment, deriveWinners, type DrawnNumber } from "@/lib/draw";
import { api } from "@/lib/api";
import type { ApiAuthUser, ApiOrder, ApiTicket } from "@/lib/api";
import type {
  DemoUser,
  Ledger,
  Order,
  PrizeCategory,
  PrizeTerm,
  Program,
  TicketCellState,
} from "@/data/types";

interface AppState {
  users: DemoUser[];
  programs: Program[];
  ledgers: Record<string, Ledger>;
  orders: Order[];
  audit: import("@/data/types").AuditEntry[];
}

export const HOLD_DURATION_MS = 10 * 60 * 1000;

export const formatOrderId = (seq: number) => `ORD${String(seq).padStart(6, "0")}`;

export interface NewProgramInput {
  name: string;
  description: string;
  prizeName: string;
  ticketPrice: number;
  totalNumbers: number;
  startAt: string;
  endAt: string;
  category: PrizeCategory;
  prizeTerms: PrizeTerm[];
  secret: string;
  mediaName?: string;
  mediaKind?: "image" | "video";
  mediaSize?: number;
  mediaUrl?: string;
  publish: boolean;
}

interface LotteryContextValue extends AppState {
  currentUser: DemoUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (input: { fullName: string; email: string; phone?: string; address?: string; province?: string; district?: string; ward?: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  getProgram: (id: string) => Program | undefined;
  getLedger: (id: string) => Ledger;
  programStats: (id: string) => { sold: number; held: number; unavailable: number; available: number; progress: number };
  cellStateOf: (programId: string, ticketNumber: number) => TicketCellState;
  cellOwnerOf: (programId: string, ticketNumber: number) => string | undefined;
  createOrder: (programId: string, numbers: number[]) => Promise<{ ok: true; order: Order } | { ok: false; taken: number[]; error?: string }>;
  payOrder: (orderId: string, method?: string, idempotencyKey?: string) => Promise<{ ok: boolean; error?: string; payment?: any; replayed?: boolean }>;
  cancelOrder: (orderId: string) => Promise<void>;
  orderById: (orderId: string) => Order | undefined;
  ordersOf: (userId: string) => Order[];
  createProgram: (input: NewProgramInput) => Promise<Program>;
  setProgramStatus: (programId: string, status: Program["status"], rejectionReason?: string) => Promise<void>;
  submitProgram: (programId: string) => Promise<void>;
  publishResults: (programId: string, seed: string) => Program | undefined;
  previewDraw: (programId: string, seed: string) => DrawnNumber[];
  verifyResults: (programId: string, seed: string) => { valid: boolean; derived: DrawnNumber[] };
  resetDemo: () => void;
}

const emptyLedger = (): Ledger => ({ sold: new Map(), held: new Map(), unavailable: new Set() });
const emptyState: AppState = { users: [], programs: [], ledgers: {}, orders: [], audit: [] };

function normalizeUser(user: ApiAuthUser): DemoUser {
  const role = user.role.toUpperCase();
  return {
    id: String(user.userId),
    name: user.fullName?.trim() || user.username?.trim() || user.email,
    email: user.email,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
    province: user.province ?? undefined,
    district: user.district ?? undefined,
    ward: user.ward ?? undefined,
    password: "",
    role: role === "ADMIN" || role === "ORGANIZER" || role === "DRAW_OPERATOR" ? role : "USER",
    balance: Number(user.balance ?? 0),
    joinedAt: new Date().toISOString(),
  };
}

function normalizeProgram(program: Program): Program {
  const raw = program as unknown as Record<string, unknown>;
  if (!("program_id" in raw)) return program;

  const prizes = Array.isArray(raw.prizes) ? raw.prizes as Array<Record<string, unknown>> : [];
  const rawWinners = Array.isArray(raw.winners) ? raw.winners as Array<Record<string, unknown>> : [];
  const firstPrize = prizes[0];
  const storedStatus = String(raw.status ?? "draft");
  const startAt = String(raw.start_time ?? new Date().toISOString());
  const endAt = String(raw.end_time ?? startAt);
  const now = Date.now();

  let computedStatus = storedStatus;
  if (["upcoming", "published"].includes(storedStatus)) {
    if (new Date(startAt).getTime() <= now && (!raw.end_time || new Date(endAt).getTime() > now)) {
      computedStatus = "active";
    } else if (raw.end_time && new Date(endAt).getTime() <= now) {
      computedStatus = "ended";
    } else {
      computedStatus = "upcoming";
    }
  } else if (storedStatus === "active") {
    if (raw.end_time && new Date(endAt).getTime() <= now) {
      computedStatus = "ended";
    }
  }

  const mappedStatus: Program["status"] =
<<<<<<< HEAD
    computedStatus === "active" || computedStatus === "drawing" ? "active"
      : computedStatus === "upcoming" || computedStatus === "published" ? "upcoming"
      : computedStatus === "ended" || computedStatus === "completed" || computedStatus === "closed" || computedStatus === "cancelled" ? "ended"
      : computedStatus === "draft" || computedStatus === "pending_review" || computedStatus === "rejected"
        ? computedStatus
        : "draft";
=======
    status === "published" ? "upcoming"
      : status === "drawing" ? "active"
      : status === "completed" ? "published"
      : status === "closed" || status === "cancelled" ? "ended"
      : status === "draft" || status === "pending_review" || status === "rejected"
        ? status
        : status === "active" || status === "upcoming" || status === "ended" ? status : "draft";
>>>>>>> 0b3d672 (07/11/2026)

  return {
    id: String(raw.program_id),
    code: String(raw.program_code ?? raw.program_id),
    name: String(raw.program_name ?? "Chương trình quay số"),
    description: String(raw.description ?? ""),
    prizeName: String(firstPrize?.prize_name ?? "Giải thưởng"),
    prizeValue: Number(raw.prize_value ?? firstPrize?.estimated_value ?? 0),
    prizeTerms: prizes.length > 0
      ? prizes.map((prize, index) => ({
          id: String(prize.prize_id ?? index + 1),
          label: String(prize.prize_name ?? `Giải ${index + 1}`),
          quantity: Number(prize.quantity ?? 1),
          value: Number(prize.estimated_value ?? 0),
        }))
      : [{ id: "main", label: "Giải thưởng", quantity: 1, value: Number(raw.prize_value ?? 0) }],
    ticketPrice: Number(raw.ticket_price ?? 0),
    totalNumbers: Number(raw.total_tickets ?? 0),
    numberLength: String(raw.total_tickets ?? 0).length,
    startAt,
    endAt,
    drawnAt: raw.draw_time ? String(raw.draw_time) : undefined,
    publishedAt: raw.published_at ? String(raw.published_at) : rawWinners.length > 0 ? String(raw.draw_completed_at ?? raw.draw_time ?? new Date().toISOString()) : undefined,
    status: mappedStatus,
    rejectionReason: raw.rejection_reason ? String(raw.rejection_reason) : undefined,
    category: "other",
    drawMethod: "SHA-256",
    rules: typeof raw.rules === "string" ? raw.rules.split(/\r?\n/).filter(Boolean) : [],
    organizer: "LuckyDraw",
    organizerId: String(raw.created_by ?? ""),
    commitHash: String(raw.draw_commitment ?? raw.commitment ?? raw.program_code ?? raw.program_id),
    serverSecret: "",
    publicSeed: raw.public_seed ? String(raw.public_seed) : undefined,
    winners: rawWinners.map((winner) => ({
      termId: String(winner.termId ?? ""),
      termLabel: String(winner.termLabel ?? "Giải thưởng"),
      number: Number(winner.number),
      ownerName: String(winner.ownerName ?? "Không xác định"),
      status: winner.status === "awarded" ? "paid" as const : winner.status === "verified" ? "confirmed" as const : "pending" as const,
    })),
  };
}

function normalizeOrder(order: any, currentUser: DemoUser): Order {
  const rawTickets = Array.isArray(order?.tickets) ? order.tickets : [];
  const numbers = rawTickets
    .map((ticket: any) => {
      const numStr = ticket?.ticketNumber ?? ticket?.ticket_number ?? ticket;
      return typeof numStr === "number" ? numStr : Number.parseInt(String(numStr), 10);
    })
    .filter((number: number) => Number.isFinite(number));

  const firstTicket = rawTickets[0];
  const programId = String(
    firstTicket?.programId ??
    firstTicket?.program_id ??
    order?.programId ??
    order?.program_id ??
    ""
  );

  const total = Number(order?.total_amount ?? order?.total ?? 0);
  const status: Order["status"] =
    order?.status === "confirmed" || order?.status === "paid"
      ? "paid"
      : order?.status === "pending" || order?.status === "held"
        ? "held"
        : "expired";
  const createdAt = order?.created_at ?? order?.createdAt ?? new Date().toISOString();
  const holdUntil = order?.expires_at
    ? new Date(order.expires_at).getTime()
    : order?.holdUntil
      ? Number(order.holdUntil)
      : Date.now() + HOLD_DURATION_MS;

  return {
<<<<<<< HEAD
    id: String(order?.order_id ?? order?.id ?? ""),
    programId,
=======
    id: String(order.order_id),
    orderCode: order.order_code,
    programId: String(firstTicket?.programId ?? ""),
>>>>>>> 0b3d672 (07/11/2026)
    userId: currentUser.id,
    userName: currentUser.name,
    numbers,
    unitPrice: numbers.length ? total / numbers.length : 0,
    total,
    status,
    createdAt,
    paidAt: status === "paid" ? order?.updated_at ?? createdAt : undefined,
    holdUntil,
  };
}

function ledgerFromTickets(tickets: ApiTicket[], userId: string): Ledger {
  const ledger = emptyLedger();
  for (const ticket of tickets) {
    const number = Number.parseInt(ticket.ticket_number, 10);
    if (!Number.isFinite(number)) continue;
    if (ticket.status === "sold") ledger.sold.set(number, { orderId: "", userId: "", userName: "" });
    if (ticket.status === "void" || ticket.status === "unavailable") ledger.unavailable.add(number);
    if (ticket.status === "held" && ticket.held_until) {
      ledger.held.set(number, {
        orderId: "",
        userId: "",
        userName: "Người dùng khác",
        until: new Date(ticket.held_until).getTime(),
      });
    }
  }
  return ledger;
}

const LotteryContext = createContext<LotteryContextValue | null>(null);

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!window.localStorage.getItem("luckydraw:token")) return;
    api.me()
      .then(({ user }) => {
        const normalizedUser = normalizeUser(user);
        setState((previous) => ({
          ...previous,
          users: [...previous.users.filter((item) => item.id !== normalizedUser.id), normalizedUser],
        }));
        setCurrentUserId(normalizedUser.id);
        return api.myOrders().then((orders) => {
          setState((previous) => ({
            ...previous,
            orders: orders.map((order) => normalizeOrder(order, normalizedUser)),
          }));
        });
      })
      .catch(() => {
        window.localStorage.removeItem("luckydraw:token");
        setCurrentUserId(null);
      });
  }, []);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === currentUserId) ?? null,
    [state.users, currentUserId],
  );

  useEffect(() => {
    let active = true;
<<<<<<< HEAD
    let fetchSeq = 0;

    const loadData = async () => {
      const currentSeq = ++fetchSeq;
      try {
        const programs = await (
          currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ORGANIZER")
            ? api.getAdminPrograms()
            : api.getPrograms()
        );
        // Tránh race condition: nếu có request mới hơn hoặc component đã unmount thì bỏ qua
        if (!active || currentSeq !== fetchSeq) return;

=======
    (currentUser?.role === "DRAW_OPERATOR"
      ? api.operatorPrograms()
      : currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ORGANIZER")
        ? api.getAdminPrograms()
        : api.getPrograms())
      .then(async (programs) => {
        if (!active) return;
>>>>>>> 0b3d672 (07/11/2026)
        const normalizedPrograms = programs.map(normalizeProgram);
        const ticketEntries = await Promise.all(
          normalizedPrograms.map(async (program) => [program.id, await api.tickets(program.id)] as const),
        );
        if (!active || currentSeq !== fetchSeq) return;

        setState((previous) => ({
          ...previous,
          programs: normalizedPrograms,
          ledgers: Object.fromEntries(
            ticketEntries.map(([id, tickets]) => [id, ledgerFromTickets(tickets, currentUser?.id ?? "")]),
          ),
        }));
      } catch (error: unknown) {
        console.error("Không thể tải dữ liệu từ backend.", error);
      }
    };

    void loadData();

    // Định kỳ 10 giây đồng bộ lại dữ liệu với server (đảm bảo race condition được triệt tiêu bằng fetchSeq)
    const interval = window.setInterval(loadData, 10000);

    return () => {
      active = false;
      fetchSeq++;
      window.clearInterval(interval);
    };
  }, [currentUser]);

  /** Định kỳ 1 giây: tự động chuyển trạng thái chương trình khi đến giờ mở bán/kết thúc và giải phóng vé giữ quá hạn */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        const expiredOrders = prev.orders.filter(
          (order) => order.status === "held" && order.holdUntil <= now,
        );
        const staleLedgerHolds = Object.values(prev.ledgers).some((ledger) =>
          [...ledger.held.values()].some((hold) => hold.until <= now),
        );

        // Kiểm tra xem có chương trình nào đến giờ mở bán (upcoming -> active) hoặc kết thúc (active -> ended) không
        const hasProgramStatusChange = prev.programs.some((program) => {
          if (program.status === "upcoming" && new Date(program.startAt).getTime() <= now) return true;
          if (program.status === "active" && new Date(program.endAt).getTime() <= now) return true;
          return false;
        });

        if (expiredOrders.length === 0 && !staleLedgerHolds && !hasProgramStatusChange) return prev;

        const ledgers: AppState["ledgers"] = {};
        for (const [programId, ledger] of Object.entries(prev.ledgers)) {
          const held = new Map(
            [...ledger.held.entries()].filter(([, hold]) => hold.until > now),
          );
          ledgers[programId] = { ...ledger, held };
        }

        const programs = prev.programs.map((program) => {
          if (program.status === "upcoming" && new Date(program.startAt).getTime() <= now) {
            const hasEnded = new Date(program.endAt).getTime() <= now;
            return { ...program, status: (hasEnded ? "ended" : "active") as Program["status"] };
          }
          if (program.status === "active" && new Date(program.endAt).getTime() <= now) {
            return { ...program, status: "ended" as Program["status"] };
          }
          return program;
        });

        return {
          ...prev,
          programs,
          ledgers,
          orders: prev.orders.map((order) =>
            order.status === "held" && order.holdUntil <= now ? { ...order, status: "expired" } : order,
          ),
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const getLedger = useCallback(
    (id: string) => state.ledgers[id] ?? emptyLedger(),
    [state.ledgers],
  );

  const getProgram = useCallback(
    (id: string) => state.programs.find((program) => program.id === id),
    [state.programs],
  );

  const programStats = useCallback(
    (id: string) => {
      const program = state.programs.find((item) => item.id === id);
      const ledger = state.ledgers[id];
      const total = program?.totalNumbers ?? 0;
      const sold = ledger?.sold.size ?? 0;
      const held = ledger?.held.size ?? 0;
      const unavailable = ledger?.unavailable.size ?? 0;
      return {
        sold,
        held,
        unavailable,
        available: Math.max(0, total - sold - held - unavailable),
        progress: total === 0 ? 0 : Math.round(((sold + held) / total) * 1000) / 10,
      };
    },
    [state.programs, state.ledgers],
  );

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { token, user } = await api.login(email, password);
      const normalizedUser = normalizeUser(user);
      window.localStorage.setItem("luckydraw:token", token);
      setState((previous) => ({
        ...previous,
        users: [...previous.users.filter((item) => item.id !== normalizedUser.id), normalizedUser],
      }));
      setCurrentUserId(normalizedUser.id);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Đăng nhập không thành công." };
    }
  }, []);

  const updateProfile = useCallback(async (input: { fullName: string; email: string; phone?: string; address?: string; province?: string; district?: string; ward?: string }) => {
    try {
      const { user } = await api.updateProfile(input);
      const normalizedUser = normalizeUser(user);
      setState((previous) => ({
        ...previous,
        users: [...previous.users.filter((item) => item.id !== normalizedUser.id), normalizedUser],
      }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Không thể cập nhật thông tin." };
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("luckydraw:token");
    setCurrentUserId(null);
  }, []);

  const cellStateOf = useCallback(
    (programId: string, ticketNumber: number): TicketCellState => {
      const ledger = state.ledgers[programId];
      if (!ledger) return "available";
      const sold = ledger.sold.get(ticketNumber);
      if (sold) return sold.userId === currentUserId ? "mine" : "sold";
      const held = ledger.held.get(ticketNumber);
      if (held && held.until > Date.now()) {
        return held.userId === currentUserId ? "mine" : "other";
      }
      if (ledger.unavailable.has(ticketNumber)) return "unavailable";
      return "available";
    },
    [state.ledgers, currentUserId],
  );

  const cellOwnerOf = useCallback(
    (programId: string, ticketNumber: number) => {
      const ledger = state.ledgers[programId];
      return ledger?.sold.get(ticketNumber)?.userName ?? ledger?.held.get(ticketNumber)?.userName;
    },
    [state.ledgers],
  );

  const createOrder = useCallback<LotteryContextValue["createOrder"]>(async (programId, numbers) => {
    const user = state.users.find((item) => item.id === currentUserId);
    const program = state.programs.find((item) => item.id === programId);
    if (!user || !program) return { ok: false, taken: [], error: "Bạn cần đăng nhập để giữ vé." };
    try {
      const formattedNumbers = numbers.map((number) => String(number).padStart(program.numberLength, "0"));
      await api.holdTickets(programId, formattedNumbers);
      const result = await api.createOrder(Number(programId), formattedNumbers);
      const orderData = {
        ...result.order,
        programId,
        tickets: Array.isArray(result.order?.tickets) && result.order.tickets.length > 0
          ? result.order.tickets
          : Array.isArray(result.tickets) && result.tickets.length > 0
            ? result.tickets.map((t: any) => ({
                ticketId: t.ticket_id ?? t.ticketId,
                ticketNumber: t.ticket_number ?? t.ticketNumber,
                programId: Number(programId),
              }))
            : numbers.map((num) => ({
                ticketId: num,
                ticketNumber: String(num).padStart(program.numberLength, "0"),
                programId: Number(programId),
              })),
      };
      const order = normalizeOrder(orderData, user);
      setState((previous) => ({
        ...previous,
        ledgers: {
          ...previous.ledgers,
          [programId]: {
            ...(previous.ledgers[programId] ?? emptyLedger()),
            held: new Map([
              ...((previous.ledgers[programId] ?? emptyLedger()).held.entries()),
              ...numbers.map((number) => [number, {
                orderId: order.id,
                userId: user.id,
                userName: user.name,
                until: order.holdUntil,
              }] as const),
            ]),
          },
        },
        orders: [order, ...previous.orders.filter((item) => item.id !== order.id)],
      }));
      return { ok: true, order };
    } catch (error) {
      return { ok: false, taken: [], error: error instanceof Error ? error.message : "Không thể giữ vé." };
    }
  }, [state.programs, state.users, currentUserId]);

  const payOrder = useCallback<LotteryContextValue["payOrder"]>(async (orderId, method = "qr_simulation", idempotencyKey) => {
    try {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false, error: "Không tìm thấy đơn hàng." };
      const key = idempotencyKey || `idem_${orderId}_${order.createdAt || Date.now()}`;
      const result = await api.payOrder(orderId, { paymentMethod: method, idempotencyKey: key });
      setState((previous) => ({
        ...previous,
        ledgers: {
          ...previous.ledgers,
          [order?.programId ?? ""]: order ? {
            ...(previous.ledgers[order.programId] ?? emptyLedger()),
            held: new Map([...((previous.ledgers[order.programId] ?? emptyLedger()).held.entries())].filter(([number]) => !order.numbers.includes(number))),
            sold: new Map([
              ...((previous.ledgers[order.programId] ?? emptyLedger()).sold.entries()),
              ...order.numbers.map((number) => [number, { orderId, userId: currentUserId ?? "", userName: currentUser?.name ?? "" }] as const),
            ]),
          } : (previous.ledgers[order?.programId ?? ""] ?? emptyLedger()),
        },
        orders: previous.orders.map((item) => item.id === orderId ? {
          ...item,
          status: "paid",
          paidAt: result.order.updated_at ?? result.payment?.paid_at ?? new Date().toISOString(),
        } : item),
      }));
      return { ok: true, payment: result.payment, replayed: result.replayed };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Thanh toán không thành công." };
    }
  }, [currentUser, currentUserId, state.orders]);

  const cancelOrder = useCallback<LotteryContextValue["cancelOrder"]>(async (orderId) => {
    await api.cancelOrder(orderId);
    setState((previous) => ({
      ...previous,
      ledgers: Object.fromEntries(Object.entries(previous.ledgers).map(([programId, ledger]) => [
        programId,
        {
          ...ledger,
          held: new Map([...ledger.held.entries()].filter(([, hold]) => hold.orderId !== orderId)),
        },
      ])),
      orders: previous.orders.map((order) => order.id === orderId ? { ...order, status: "cancelled" } : order),
    }));
  }, []);

  const orderById = useCallback(
    (orderId: string) => state.orders.find((order) => order.id === orderId),
    [state.orders],
  );

  const ordersOf = useCallback(
    (userId: string) => state.orders.filter((order) => order.userId === userId),
    [state.orders],
  );

  const createProgram = useCallback<LotteryContextValue["createProgram"]>(
    async (input) => {
      const isAdmin = currentUser?.role === "ADMIN";
      const initialStatus = !input.publish
        ? "draft"
        : isAdmin
          ? (new Date(input.startAt).getTime() <= Date.now() ? "active" : "upcoming")
          : "pending_review";

      const created = await api.createProgram({
        programCode: `P-${Date.now()}`,
        programName: input.name,
        description: input.description,
        rules: input.prizeTerms.map((term) => `${term.label}: ${term.quantity} giải`).join("\n"),
        ticketPrice: input.ticketPrice,
        totalTickets: input.totalNumbers,
        startTime: input.startAt,
        endTime: input.endAt,
        drawTime: input.endAt,
        status: initialStatus,
        prizeName: input.prizeName,
        prizeValue: input.prizeTerms.reduce((sum, term) => sum + term.value * term.quantity, 0),
          ...(input.mediaKind === "image" ? { imageUrl: input.mediaUrl } : { videoUrl: input.mediaUrl }),
      });
      const program = normalizeProgram(created);
      setState((prev) => ({
        ...prev,
        programs: [...prev.programs.filter((item) => item.id !== program.id), program],
      }));
      return program;
    },
    [currentUser?.role],
  );

  const setProgramStatus = useCallback<LotteryContextValue["setProgramStatus"]>(async (programId, status, rejectionReason) => {
    const backendStatus = status === "closed" ? "ended" : status === "pending_review" || status === "published" ? "draft" : status;
    await api.reviewProgram(programId, backendStatus, rejectionReason);
    setState((prev) => ({
      ...prev,
      programs: prev.programs.map((item) => (item.id === programId ? { ...item, status } : item)),
    }));
  }, []);

  const submitProgram = useCallback(async (programId: string) => {
    const updated = await api.submitProgram(programId);
    const program = normalizeProgram(updated);
    setState((prev) => ({
      ...prev,
      programs: prev.programs.map((item) => item.id === program.id ? program : item),
    }));
  }, []);

  const previewDraw = useCallback<LotteryContextValue["previewDraw"]>(
    (programId, seed) => {
      const program = state.programs.find((item) => item.id === programId);
      if (!program) return [];
      return deriveWinners({
        commitment: program.commitHash,
        seed,
        totalNumbers: program.totalNumbers,
        terms: program.prizeTerms.map((term) => ({ id: term.id, label: term.label, quantity: term.quantity })),
      });
    },
    [state.programs],
  );

  const publishResults = useCallback<LotteryContextValue["publishResults"]>(
    (programId, seed) => {
      const program = state.programs.find((item) => item.id === programId);
      if (!program) return undefined;
      const ledger = state.ledgers[programId];
      const now = new Date().toISOString();

      const winners = deriveWinners({
        commitment: program.commitHash,
        seed,
        totalNumbers: program.totalNumbers,
        terms: program.prizeTerms.map((term) => ({ id: term.id, label: term.label, quantity: term.quantity })),
      }).map((item) => ({
        ...item,
        ownerName: ledger?.sold.get(item.number)?.userName ?? "Không có người nhận",
        status: "pending" as const,
      }));

      const published: Program = {
        ...program,
        status: "published",
        publicSeed: seed,
        drawnAt: now,
        publishedAt: now,
        winners,
      };

      setState((prev) => ({
        ...prev,
        programs: prev.programs.map((item) => (item.id === programId ? published : item)),
        audit: appendAudit(
          appendAudit(prev.audit, {
            at: now,
            actor: prev.users.find((user) => user.id === program.organizerId)?.name ?? program.organizer,
            actorRole: "ORGANIZER",
            action: "DRAW_RESULT",
            entity: `Program ${program.code}`,
            detail: `Public seed: ${seed} · ${winners.length} số trúng`,
          }),
          {
            at: now,
            actor: prev.users.find((user) => user.id === program.organizerId)?.name ?? program.organizer,
            actorRole: "ORGANIZER",
            action: "PUBLISH_RESULT",
            entity: `Program ${program.code}`,
            detail: `Công bố ${winners.length} số trúng thưởng`,
          },
        ),
      }));

      return published;
    },
    [state.programs, state.ledgers],
  );

  const verifyResults = useCallback<LotteryContextValue["verifyResults"]>(
    (programId, seed) => {
      const program = state.programs.find((item) => item.id === programId);
      if (!program) return { valid: false, derived: [] };
      const derived = deriveWinners({
        commitment: program.commitHash,
        seed,
        totalNumbers: program.totalNumbers,
        terms: program.prizeTerms.map((term) => ({ id: term.id, label: term.label, quantity: term.quantity })),
      });
      const publishedNumbers = (program.winners ?? []).map((winner) => winner.number).join(",");
      return { valid: publishedNumbers === derived.map((item) => item.number).join(","), derived };
    },
    [state.programs],
  );

  const resetDemo = useCallback(() => {
    setState(emptyState);
    setCurrentUserId(null);
  }, []);

  const value: LotteryContextValue = {
    ...state,
    currentUser,
    login,
    logout,
    updateProfile,
    getProgram,
    getLedger,
    programStats,
    cellStateOf,
    cellOwnerOf,
    createOrder,
    payOrder,
    cancelOrder,
    orderById,
    ordersOf,
    createProgram,
    setProgramStatus,
    submitProgram,
    publishResults,
    previewDraw,
    verifyResults,
    resetDemo,
  };

  return <LotteryContext.Provider value={value}>{children}</LotteryContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLottery() {
  const context = useContext(LotteryContext);
  if (!context) throw new Error("useLottery phải được dùng bên trong LotteryProvider");
  return context;
}
