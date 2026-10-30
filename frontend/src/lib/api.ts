const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api").replace(/\/$/, "");

export type ApiAuthUser = {
  userId: number | string;
  username?: string;
  email: string;
  fullName?: string;
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
  createProgram: (input: Record<string, unknown>) =>
    request<import("@/data/types").Program>("/admin/programs", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  reviewProgram: (id: string, status: "upcoming" | "active" | "ended" | "rejected" | "cancelled" | "draft", rejectionReason?: string) =>
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
  payOrder: (orderId: string) =>
    request<{ order: ApiOrder }>(`/orders/${orderId}/pay`, { method: "POST" }),
  cancelOrder: (orderId: string) =>
    request<{ order: ApiOrder }>(`/orders/${orderId}/cancel`, { method: "POST" }),
  myOrders: () => request<ApiOrder[]>("/me/orders"),
  register: (input: { name: string; username: string; email: string; password: string; confirmPassword: string }) =>
    request<{ user: ApiAuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createOrganizer: (input: { fullName: string; username: string; email: string; password: string; confirmPassword: string }) =>
    request<{ user: ApiAuthUser }>("/admin/organizers", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
