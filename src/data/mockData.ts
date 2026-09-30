export type ProgramStatus = 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã kết thúc';
export type TicketStatus = 'Available' | 'Held' | 'Sold' | 'Unavailable';

export type Program = {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  status: ProgramStatus;
  endDate: string;
  startDate: string;
  image: string;
  accent: string;
};

export type Ticket = {
  number: string;
  status: TicketStatus;
};

export const programs: Program[] = [
  {
    id: '001',
    title: 'Chương trình #001',
    description: 'Khuyến mãi cuối năm với giải thưởng xe điện và iPhone 16 Pro Max.',
    prize: 'iPhone / Xe / Tài sản mô phỏng',
    prizeValue: 10000000,
    ticketPrice: 1000,
    totalTickets: 10000,
    soldTickets: 7250,
    status: 'Đang diễn ra',
    endDate: '2026-10-12T20:00:00',
    startDate: '2026-09-29T10:00:00',
    image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80',
    accent: '#22c55e',
  },
  {
    id: '002',
    title: 'Chương trình #002',
    description: 'Hỗ trợ tiêu dùng và vận động quà tặng lớn cho mùa lễ hội.',
    prize: 'Xe máy điện',
    prizeValue: 4000000,
    ticketPrice: 1500,
    totalTickets: 5000,
    soldTickets: 3200,
    status: 'Sắp diễn ra',
    endDate: '2026-10-18T20:00:00',
    startDate: '2026-10-05T10:00:00',
    image: 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=1200&q=80',
    accent: '#60a5fa',
  },
  {
    id: '003',
    title: 'Chương trình #003',
    description: 'Ngày hội may mắn với các phần quà cao cấp cho gia đình.',
    prize: 'Máy bay mô phỏng',
    prizeValue: 8000000,
    ticketPrice: 2000,
    totalTickets: 5000,
    soldTickets: 5000,
    status: 'Đã kết thúc',
    endDate: '2026-09-20T20:00:00',
    startDate: '2026-09-01T10:00:00',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    accent: '#f97316',
  },
];

export const tickets: Ticket[] = Array.from({ length: 30 }, (_, index) => ({
  number: String(index + 1).padStart(4, '0'),
  status: index % 5 === 0 ? 'Sold' : index % 3 === 0 ? 'Held' : 'Available',
}));

export const adminPrograms = [
  { code: '001', name: 'Chương trình A', time: '2026-09-30', status: 'Active' },
  { code: '002', name: 'Chương trình B', time: '2026-10-04', status: 'Upcoming' },
  { code: '003', name: 'Chương trình C', time: '2026-09-20', status: 'Closed' },
];

export const orderHistory = [
  { id: 'ORD001', program: 'CT #001', quantity: 3, total: 3000, status: 'Thành công' },
  { id: 'ORD002', program: 'CT #002', quantity: 5, total: 5000, status: 'Thành công' },
  { id: 'ORD003', program: 'CT #003', quantity: 2, total: 2000, status: 'Hết hạn' },
];

export const statData = [
  { name: 'Jan', visits: 1200, revenue: 200000 },
  { name: 'Feb', visits: 1600, revenue: 250000 },
  { name: 'Mar', visits: 1900, revenue: 310000 },
  { name: 'Apr', visits: 2300, revenue: 360000 },
  { name: 'May', visits: 2100, revenue: 420000 },
  { name: 'Jun', visits: 2800, revenue: 470000 },
];

export const pieData = [
  { name: 'Đang diễn ra', value: 12 },
  { name: 'Sắp diễn ra', value: 6 },
  { name: 'Đã kết thúc', value: 4 },
];

export const auditLogs = [
  { time: '20:01:23', user: 'Admin', action: 'CREATE', entity: 'Program' },
  { time: '20:05:12', user: 'User01', action: 'HOLD', entity: 'Ticket' },
  { time: '20:05:25', user: 'User01', action: 'PAYMENT', entity: 'Order' },
  { time: '20:10:42', user: 'Admin', action: 'DRAW', entity: 'Program' },
  { time: '20:10:45', user: 'Admin', action: 'PUBLISH', entity: 'Result' },
];

export const winners = [
  { id: 1, program: 'Chương trình #001', prize: 'Giải đặc biệt', ticket: '05821', user: 'Nguyễn V*** T***', status: 'Đã xác nhận' },
  { id: 2, program: 'Chương trình #001', prize: 'Giải nhất', ticket: '01235', user: 'Trần B***', status: 'Đang chờ' },
];

export const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Chương trình', to: '/programs' },
  { label: 'Kết quả', to: '/results' },
  { label: 'Đăng nhập', to: '/login' },
];
