const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

type ApiError = { error?: string; details?: unknown };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem('luckydraw-token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({} as ApiError)) as ApiError;
    if (response.status === 401) {
      window.localStorage.removeItem('luckydraw-token');
      window.localStorage.removeItem('luckydraw-user');
      window.dispatchEvent(new CustomEvent('luckydraw:unauthorized'));
    }
    throw new Error(body.error ?? `API request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export type ApiUser = {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'ORGANIZER' | 'USER' | 'AUDITOR';
};

export type ApiProgram = {
  program_id: number;
  created_by?: number;
  program_code: string;
  program_name: string;
  description: string | null;
  rules: string | null;
  ticket_price: string | number;
  total_tickets: number;
  reserved_tickets?: number;
  start_time: string | null;
  end_time: string | null;
  draw_time: string | null;
  status: string;
  prizes?: Array<{ prize_id: number; prize_name: string; estimated_value: string | number; quantity: number; image_url?: string | null; video_url?: string | null }>;
};

export type OrganizerTicket = ApiTicket & {
  username: string | null;
  full_name: string | null;
  order_code: string | null;
};

export type OrganizerOrder = {
  order_id: number;
  order_code: string;
  status: string;
  total_amount: string | number;
  created_at: string;
  program_id: number;
  program_name: string;
  ticket_count: number;
};

export type ApiTicket = {
  ticket_id: number;
  ticket_number: string;
  price: string | number;
  status: 'available' | 'held' | 'sold' | 'void';
  held_until: string | null;
};

export type ApiOrder = {
  order_id: number;
  order_code: string;
  status: string;
  total_amount: string | number;
  created_at: string;
  tickets: Array<{ ticketId: number; ticketNumber: string; programId: number; programName: string }>;
};

export type ApiResult = {
  draw_id: number;
  draw_code: string;
  completed_at: string;
  seed_commitment: string;
  revealed_seed: string;
  program_id: number;
  program_name: string;
  results: Array<{ ticketNumber: string; prizeName: string | null; rank: number }>;
};

export type AuthResponse = { user: ApiUser; token: string };

export const api = {
  health: () => request<{ status: string; database: string }>('/health'),
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (input: { username: string; email: string; password: string; confirmPassword: string; fullName: string; role: 'USER' | 'ORGANIZER' }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  programs: () => request<ApiProgram[]>('/programs'),
  program: (programId: string) => request<ApiProgram>(`/programs/${programId}`),
  tickets: (programId: string) => request<ApiTicket[]>(`/programs/${programId}/tickets`),
  holdTickets: (programId: string, ticketNumbers: string[]) => request<{ tickets: ApiTicket[] }>(`/programs/${programId}/hold`, { method: 'POST', body: JSON.stringify({ ticketNumbers }) }),
  createOrder: (programId: number, ticketNumbers: string[]) => request<{ order: ApiOrder; tickets: ApiTicket[] }>('/orders', { method: 'POST', body: JSON.stringify({ programId, ticketNumbers }) }),
  payOrder: (orderId: number) => request<{ order: ApiOrder }>(`/orders/${orderId}/pay`, { method: 'POST' }),
  myOrders: () => request<ApiOrder[]>('/me/orders'),
  results: () => request<ApiResult[]>('/results'),
  uploadMedia: async (file: File) => {
    const token = window.localStorage.getItem('luckydraw-token');
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`${API_BASE_URL}/organizer/media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const body = await response.json() as { url?: string; type?: 'image' | 'video'; error?: string };
    if (!response.ok || !body.url || !body.type) throw new Error(body.error ?? 'Không thể tải file lên.');
    return body;
  },
  organizerPrograms: () => request<ApiProgram[]>('/organizer/programs'),
  organizerTickets: (programId: number) => request<OrganizerTicket[]>(`/organizer/programs/${programId}/tickets`),
  organizerOrders: () => request<OrganizerOrder[]>('/organizer/orders'),
  adminStats: () => request<{ stats: { programs: number; orders: number; users: number; revenue: number }; monthly: Array<{ name: string; orders: number; revenue: number }>; statuses: Array<{ name: string; value: number }>; programs: ApiProgram[] }>('/admin/stats'),
  adminOrders: () => request<ApiOrder[]>('/admin/orders'),
  auditLogs: () => request<Array<{ audit_id: number; created_at: string; username: string; action: string; entity_type: string }>>('/admin/audit'),
  createProgram: (input: Record<string, unknown>) => request<ApiProgram>('/admin/programs', { method: 'POST', body: JSON.stringify(input) }),
  drawProgram: (programId: number) => request<unknown>(`/admin/programs/${programId}/draw`, { method: 'POST' }),
};
