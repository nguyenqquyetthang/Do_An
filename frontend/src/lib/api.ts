const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api").replace(/\/$/, "");

export type ApiAuthUser = {
  userId: number | string;
  username?: string;
  email: string;
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  role: string;
  balance?: number | string;
};

export type ApiTicket = {
  ticket_id: number;
  ticket_number: string;
  price: string | number;
  status: "available" | "held" | "sold" | "void" | "unavailable";
  held_until: string | null;
};

export type PaymentQrData = {
  orderId: number;
  orderCode: string;
  orderStatus: string;
  amount: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrCodeUrl: string;
  expiresAt: string | null;
  isSimulated: boolean;
};

export type PaymentResponse = {
  order: ApiOrder;
  payment: {
    payment_id: number;
    payment_code: string;
    payment_method: string;
    amount: string | number;
    status: string;
    transaction_reference: string;
    paid_at: string;
    idempotency_key?: string | null;
    qr_code_url?: string;
  };
  replayed?: boolean;
  message?: string;
};

export type ApiOrder = {
  order_id: number;
  order_code: string;
  status: string;
  total_amount: string | number;
  created_at: string;
  updated_at?: string;
  expires_at?: string | null;
  tickets: Array<{
    ticketId: number;
    ticketNumber: string;
    programId: number;
    programName: string;
  }>;
};

export type ApiPrizeWin = {
  winner_id: number;
  claim_status: "pending" | "contacted" | "verified" | "awarded" | "rejected";
  won_at: string;
  claimed_at?: string | null;
  ticket_number: string;
  order_code: string;
  program_id: number;
  program_name: string;
  prize_name: string;
  prize_value: string | number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem("luckydraw:token");
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Không thể kết nối backend. Hãy chạy npm run dev:full và kiểm tra file .env cùng PostgreSQL.",
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getPrograms: () => request<import("@/data/types").Program[]>("/programs"),
  getAdminPrograms: () => request<import("@/data/types").Program[]>("/organizer/programs"),
  organizerStats: () => request<{
    programs: Array<{ program_id: number; program_code: string; program_name: string; total_tickets: number; sold_tickets: number; remaining_tickets: number; successful_orders: number; failed_orders: number; revenue: string | number }>;
    daily: Array<{ day: string; sold_tickets: number }>;
  }>("/organizer/stats"),
  createProgram: (input: Record<string, unknown>) =>
    request<import("@/data/types").Program>("/admin/programs", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  uploadMedia: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const token = window.localStorage.getItem("luckydraw:token");
    const response = await fetch(`${API_BASE_URL}/organizer/media`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Không thể tải tệp lên.");
    return body as { url: string; type: "image" | "video" };
  },
  updateProgram: (id: string, input: Record<string, unknown>) =>
    request<import("@/data/types").Program>(`/organizer/programs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  reviewProgram: (id: string, status: "upcoming" | "active" | "ended" | "rejected" | "cancelled" | "draft" | "suspended", rejectionReason?: string) =>
    request<{ id: string; status: string }>(`/admin/programs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason }),
    }),
  submitProgram: (id: string) =>
    request<import("@/data/types").Program>(`/organizer/programs/${id}/submit`, { method: "POST" }),
  adminUsers: () => request<Array<Record<string, unknown>>>("/admin/users"),
  updateUserStatus: (id: string, status: "active" | "inactive" | "locked") =>
    request<Record<string, unknown>>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  revokeRole: (id: string) => request<Record<string, unknown>>(`/admin/users/${id}/revoke-role`, { method: "PATCH" }),
  adminRerunRequest: (programId: string, reason: string) =>
    request<{ message: string }>(`/admin/programs/${programId}/rerun-request`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  organizerOrders: () => request<Array<{
    order_id: number;
    order_code: string;
    status: string;
    total_amount: string | number;
    created_at: string;
    program_name: string;
    ticket_count: number;
  }>>("/organizer/orders"),
  login: (email: string, password: string) =>
    request<{ token: string; user: ApiAuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: ApiAuthUser }>("/auth/me"),
  changePassword: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<{ message: string }>("/auth/change-password", { method: "POST", body: JSON.stringify(input) }),
  updateProfile: (input: { fullName: string; email: string; phone?: string; address?: string; province?: string; district?: string; ward?: string }) =>
    request<{ user: ApiAuthUser }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  tickets: (programId: string) => request<ApiTicket[]>(`/programs/${programId}/tickets`),
  holdTickets: (programId: string, ticketNumbers: string[]) =>
    request<{ tickets: ApiTicket[] }>(`/programs/${programId}/hold`, {
      method: "POST",
      body: JSON.stringify({ ticketNumbers }),
    }),
  createOrder: (programId: number, ticketNumbers: string[]) =>
    request<{ order: ApiOrder; tickets: ApiTicket[] }>("/orders", {
      method: "POST",
      body: JSON.stringify({ programId, ticketNumbers }),
    }),
  getPaymentQr: (orderId: string) =>
    request<PaymentQrData>(`/orders/${orderId}/payment-qr`),
  payOrder: (orderId: string, options?: { paymentMethod?: string; idempotencyKey?: string }) =>
    request<PaymentResponse>(`/orders/${orderId}/pay`, {
      method: "POST",
      headers: options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : undefined,
      body: JSON.stringify({
        paymentMethod: options?.paymentMethod ?? "qr_simulation",
        idempotencyKey: options?.idempotencyKey,
      }),
    }),
  myPayments: () => request<Array<{
    payment_id: number;
    payment_code: string;
    order_code: string;
    amount: string | number;
    payment_method: string;
    transaction_reference: string;
    status: string;
    paid_at: string;
    program_name?: string;
  }>>("/me/payments"),
  adminAudit: () => request<Array<{
    audit_id: number;
    created_at: string;
    username: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_data?: any;
    new_data?: any;
    ip_address?: string;
    user_agent?: string;
  }>>("/admin/audit"),
  cancelOrder: (orderId: string) =>
    request<{ order: ApiOrder }>(`/orders/${orderId}/cancel`, { method: "POST" }),
  myOrders: () => request<ApiOrder[]>("/me/orders"),
  myPrizes: () => request<ApiPrizeWin[]>("/me/prizes"),
  register: (input: { name: string; username: string; email: string; password: string; confirmPassword: string }) =>
    request<{ user: ApiAuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createOrganizer: (input: { fullName: string; username: string; email: string; password: string; confirmPassword: string; role?: "ORGANIZER" | "DRAW_OPERATOR" }) =>
    request<{ user: ApiAuthUser }>("/admin/organizers", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  adminDrawOperators: () => request<Array<{ user_id: number; username: string; full_name: string; email: string }>>("/admin/draw-operators"),
  assignDrawOperator: (programId: string, operatorUserId: number) =>
    request<Record<string, unknown>>(`/admin/programs/${programId}/operators`, {
      method: "POST",
      body: JSON.stringify({ operatorUserId }),
    }),
  operatorPrograms: () => request<Array<import("@/data/types").Program & {
    program_id: number;
    program_code: string;
    program_name: string;
    status: string;
    draw_time?: string | null;
    draw_status?: string | null;
  }>>("/operator/programs"),
  operatorProgramOverview: (programId: string) => request<{
    program_id: number;
    program_code: string;
    program_name: string;
    description?: string | null;
    rules?: string | null;
    ticket_price: string | number;
    total_tickets: number;
    start_time?: string | null;
    end_time?: string | null;
    draw_time?: string | null;
    status: string;
    prizes: Array<{ prizeId: number; name: string; type: string; quantity: number; estimatedValue: string | number }>;
    eligible_ticket_count: number;
    pending_order_count: number;
    already_drawn: boolean;
    checks: { ended: boolean; noPendingOrders: boolean; hasEligibleTickets: boolean; hasPrizes: boolean; notDrawn: boolean };
  }>(`/operator/programs/${programId}/overview`),
  operatorProgramTickets: (programId: string) => request<Array<{
    ticket_id: number;
    ticket_number: string;
    price: string | number;
    order_code: string;
    owner_name: string;
    paid_at: string;
  }>>(`/operator/programs/${programId}/tickets`),
  operatorStats: () => request<{
    assigned: number;
    drawn: number;
    waiting: number;
    prizes: number;
    awarded: number;
    pending: number;
    processing: number;
  }>("/operator/stats"),
  operatorWinners: () => request<Array<{
    winner_id: number;
    claim_status: string;
    won_at: string;
    contacted_at?: string | null;
    verified_at?: string | null;
    awarded_at?: string | null;
    evidence_url?: string | null;
    notes?: string | null;
    ticket_number: string;
    order_code: string;
    program_id: number;
    program_code: string;
    program_name: string;
    prize_name: string;
    winner_name: string;
    winner_email: string;
    winner_phone?: string | null;
    responsible_name?: string | null;
  }>>("/operator/winners"),
  updateWinnerStatus: (winnerId: number, input: { status: string; evidenceUrl?: string; notes?: string }) =>
    request<Record<string, unknown>>(`/operator/winners/${winnerId}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  drawRecord: (programId: string) => request<Record<string, unknown>>(`/operator/draws/${programId}/record`),
  operatorDrawHistory: () => request<Array<{
    draw_id: number;
    draw_code: string;
    program_id: number;
    program_code: string;
    program_name: string;
    completed_at: string;
    winner_count: number;
    algorithm_version: string;
  }>>("/operator/draws"),
  operatorAudit: () => request<Array<{
    audit_id: number;
    action: string;
    entity_type: string;
    entity_id?: string;
    new_data?: Record<string, unknown>;
    created_at: string;
    actor_name?: string;
  }>>("/operator/audit"),
  drawProgram: (programId: string, seed: string) =>
    request<Record<string, unknown>>(`/admin/programs/${programId}/draw`, {
      method: "POST",
      body: JSON.stringify({ seed }),
    }),
};
