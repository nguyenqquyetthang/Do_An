import { useMemo, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarRange,
  Check,
  CircleDollarSign,
  Clock3,
  Gift,
  LayoutDashboard,
  ListOrdered,
  LogIn,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  UserRound,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProgramCard } from './components/ui/ProgramCard';
import { StatCard } from './components/ui/StatCard';
import { TicketGrid } from './components/ui/TicketGrid';
import {
  adminPrograms,
  auditLogs,
  orderHistory,
  pieData,
  programs,
  statData,
  tickets,
  winners,
  type TicketStatus,
} from './data/mockData';

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' điểm';
}

function HomePage() {
  const activeProgram = programs[0];
  const remaining = activeProgram.totalTickets - activeProgram.soldTickets;
  const percent = (activeProgram.soldTickets / activeProgram.totalTickets) * 100;

  return (
    <div className="space-y-8">
      <section className="card-glass hero-panel overflow-hidden rounded-[28px] border">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="max-w-xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Chương trình đang diễn ra
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">Mã may mắn trong tay, giải thưởng lớn đang chờ.</h1>
            <p className="text-lg text-slate-300">Chương trình với hệ thống chọn số trực tiếp, minh bạch, truy xuất được và an toàn theo tiêu chuẩn công bằng.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/programs" className="primary-btn inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold">
                Xem chương trình <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/results" className="secondary-btn inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold">
                Xem kết quả
              </Link>
            </div>
          </div>

          <div className="w-full max-w-xl rounded-3xl bg-slate-900/60 p-4 ring-1 ring-slate-700">
            <img src={activeProgram.image} alt={activeProgram.title} className="h-72 w-full rounded-2xl object-cover" />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-white">{activeProgram.title}</h2>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  {activeProgram.status}
                </span>
              </div>
              <p className="text-slate-300">{activeProgram.prize}</p>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Giá trị giải thưởng</span>
                <span className="font-semibold text-cyan-300">{formatMoney(activeProgram.prizeValue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Giá mỗi số</span>
                <span className="font-semibold text-white">{formatMoney(activeProgram.ticketPrice)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Đã chọn</span>
                  <span>{activeProgram.soldTickets.toLocaleString()} / {activeProgram.totalTickets.toLocaleString()} số</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Còn lại</div>
                  <div className="mt-1 text-xl font-bold text-white">{remaining.toLocaleString()} số</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Thời gian còn</div>
                  <div className="mt-1 text-lg font-bold text-cyan-300">02 ngày 13 giờ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Chương trình đang mở', value: '12', icon: Ticket },
          { label: 'Program sắp mở', value: '05', icon: CalendarRange },
          { label: 'Chương trình kết thúc', value: '08', icon: Trophy },
        ].map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Danh sách chương trình quay số</h2>
          <Link to="/programs" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Xem tất cả</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgramsPage() {
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Lọc chương trình</p>
            <h1 className="mt-2 text-3xl font-black text-white">Danh sách chương trình quay số</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {['Đang diễn ra', 'Sắp diễn ra', 'Đã kết thúc'].map((status) => (
              <button key={status} className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500">
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {programs.map((program) => (
          <Link key={program.id} to={`/programs/${program.id}`} className="card-glass overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-2xl">
            <img src={program.image} alt={program.title} className="h-44 w-full object-cover" />
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{program.title}</h3>
                <span className="status-pill bg-emerald-500/10 text-emerald-300">{program.status}</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>Giải thưởng: {program.prize}</div>
                <div>1 số: {formatMoney(program.ticketPrice)}</div>
                <div>Còn: {(program.totalTickets - program.soldTickets).toLocaleString()} số</div>
              </div>
              <button className="primary-btn w-full rounded-xl px-4 py-3 font-semibold">
                {program.status === 'Đã kết thúc' ? 'Xem kết quả' : 'Chọn số'}
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProgramDetailPage() {
  const program = programs[0];

  return (
    <div className="space-y-6">
      <div className="card-glass overflow-hidden rounded-3xl">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="p-6 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              {program.status}
            </div>
            <h1 className="text-3xl font-black text-white">{program.title}</h1>
            <p className="mt-4 text-slate-300">{program.description}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Giá trị giải thưởng', value: formatMoney(program.prizeValue) },
                { label: 'Giá mỗi số', value: formatMoney(program.ticketPrice) },
                { label: 'Tổng số vé', value: `${program.totalTickets.toLocaleString()} vé` },
                { label: 'Đã bán', value: `${program.soldTickets.toLocaleString()} vé` },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                  <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/choose" className="primary-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold">
                Chọn số dự thưởng <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-700 bg-slate-900/80 p-6 lg:border-l lg:border-t-0">
            <img src={program.image} alt={program.title} className="h-64 w-full rounded-2xl object-cover" />
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Thời gian mở</span>
                <span>{format(new Date(program.startDate), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Thời gian đóng</span>
                <span>{format(new Date(program.endDate), 'dd/MM/yyyy')}</span>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                Các số còn trống sẽ được giữ trong 10 phút sau khi người dùng đặt hàng.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-3xl p-6">
          <h3 className="text-xl font-bold text-white">Cơ cấu giải thưởng</h3>
          <div className="mt-4 space-y-3 text-slate-300">
            {['Giải đặc biệt: 05821', 'Giải nhất: 01235', 'Giải nhì: 00125, 08321', 'Giải phụ: 10 phần quà khác'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3">{item}</div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <h3 className="text-xl font-bold text-white">Thể lệ & cách quay số</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Tất cả vé được cấp số định danh riêng và được lưu theo mã đơn hàng.</li>
            <li>• Hệ thống kiểm tra trạng thái giữ số và tránh xung đột đồng thời.</li>
            <li>• Sử dụng seed công khai và commitment để xác minh tính minh bạch.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ChooseTicketsPage() {
  const [selected, setSelected] = useState<string[]>(['0007', '0025', '0158']);

  const ticketMap = useMemo(() => {
    return tickets.reduce<Record<string, TicketStatus>>((acc, item) => {
      acc[item.number] = item.status;
      return acc;
    }, {});
  }, []);

  const handleSelect = (number: string) => {
    if (ticketMap[number] === 'Unavailable' || ticketMap[number] === 'Sold') return;
    setSelected((prev) => {
      const exists = prev.includes(number);
      const next = exists ? prev.filter((item) => item !== number) : [...prev, number];
      return next.slice(0, 10);
    });
  };

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Chương trình #001</p>
            <h1 className="mt-2 text-3xl font-black text-white">Số dự thưởng</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-emerald-300"><span className="h-3 w-3 rounded-full bg-emerald-400" />Còn trống</span>
            <span className="inline-flex items-center gap-2 text-cyan-300"><span className="h-3 w-3 rounded-full bg-cyan-400" />Đang giữ</span>
            <span className="inline-flex items-center gap-2 text-rose-300"><span className="h-3 w-3 rounded-full bg-rose-400" />Đã bán</span>
          </div>
        </div>
      </div>

      <div className="card-glass rounded-3xl p-6">
        <TicketGrid
          selected={selected}
          onSelect={handleSelect}
          ticketMap={ticketMap}
          tickets={tickets}
        />

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Số đã chọn</div>
            <div className="mt-2 text-lg font-semibold text-white">{selected.join(', ') || 'Chưa chọn'}</div>
          </div>

          <div className="text-right">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Tổng</div>
            <div className="mt-2 text-2xl font-black text-cyan-300">{formatMoney(selected.length * 1000)}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Link to="/checkout" className="primary-btn rounded-xl px-6 py-3 font-bold text-white">
            Tiếp tục
          </Link>
        </div>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const selected = ['0007', '0025', '0158'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-glass rounded-3xl p-8">
        <h1 className="text-3xl font-black text-white">Xác nhận đơn hàng</h1>
        <div className="mt-6 space-y-4 text-slate-200">
          <div className="flex justify-between"><span>Chương trình</span><span className="font-semibold">Chương trình #001</span></div>
          <div className="flex justify-between"><span>Số</span><span className="font-semibold">{selected.join(', ')}</span></div>
          <div className="flex justify-between"><span>Số lượng</span><span className="font-semibold">3</span></div>
          <div className="flex justify-between"><span>Đơn giá</span><span className="font-semibold">1.000 điểm</span></div>
          <div className="flex justify-between"><span>Tổng</span><span className="text-2xl font-black text-cyan-300">3.000 điểm</span></div>
          <div className="flex justify-between"><span>Thời gian giữ số</span><span className="font-semibold">10 phút</span></div>
        </div>

        <div className="mt-8 flex justify-between">
          <Link to="/choose" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:border-slate-500">Quay lại</Link>
          <Link to="/payment" className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">Xác nhận</Link>
        </div>
      </div>
    </div>
  );
}

function PaymentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-glass rounded-3xl p-8">
        <h1 className="text-3xl font-black text-white">Thanh toán mô phỏng</h1>
        <div className="mt-6 space-y-4 text-slate-200">
          <div className="flex justify-between"><span>Đơn hàng</span><span className="font-semibold">#ORD000123</span></div>
          <div className="flex justify-between"><span>Số dư hiện tại</span><span className="font-semibold">20.000 điểm</span></div>
          <div className="flex justify-between"><span>Giá trị đơn hàng</span><span className="font-semibold">3.000 điểm</span></div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-3"><input type="radio" checked readOnly /> <span>Ví mô phỏng</span></label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-3"><input type="radio" readOnly /> <span>Mã thanh toán mô phỏng</span></label>
        </div>

        <div className="mt-8 flex justify-end">
          <Link to="/success" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400">Thanh toán</Link>
        </div>
      </div>
    </div>
  );
}

function PaymentSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-glass rounded-3xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black text-white">THANH TOÁN THÀNH CÔNG</h1>
        <div className="mt-4 text-slate-300">Mã đơn hàng: ORD000123</div>
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
          Các số dự thưởng: 0007, 0025, 0158
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/tickets" className="primary-btn rounded-xl px-6 py-3 font-bold">Xem vé</Link>
        </div>
      </div>
    </div>
  );
}

function MyTicketsPage() {
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <h1 className="text-3xl font-black text-white">Vé của tôi</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          { program: 'Chương trình #001', ticket: '0007', status: 'Đang chờ quay', order: 'ORD000123' },
          { program: 'Chương trình #002', ticket: '0134', status: 'Đã xác nhận', order: 'ORD000127' },
        ].map((item) => (
          <div key={item.ticket} className="card-glass rounded-3xl p-5">
            <div className="space-y-4">
              <div className="text-xl font-bold text-white">{item.program}</div>
              <div className="flex justify-between text-sm text-slate-300"><span>Số</span><span>{item.ticket}</span></div>
              <div className="flex justify-between text-sm text-slate-300"><span>Trạng thái</span><span>{item.status}</span></div>
              <div className="flex justify-between text-sm text-slate-300"><span>Mã đơn hàng</span><span>{item.order}</span></div>
              <button className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white">Xem chi tiết</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card-glass rounded-3xl p-8">
        <h1 className="text-3xl font-black text-white">Kết quả quay số</h1>
        <div className="mt-4 text-lg text-slate-300">Chương trình #001</div>
        <div className="mt-5 text-sm text-slate-400">Thời gian quay: 03/10/2026 - 20:00</div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[['Giải đặc biệt', '05821'], ['Giải nhất', '01235'], ['Giải nhì', '00125 / 08321']].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-center">
              <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{label}</div>
              <div className="mt-3 text-3xl font-black text-cyan-300">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/verify" className="success-btn rounded-xl px-6 py-3 font-bold text-slate-950">Xác minh kết quả</Link>
        </div>
      </div>
    </div>
  );
}

function VerifyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-glass rounded-3xl p-8">
        <h1 className="text-3xl font-black text-white">Xác minh kết quả</h1>
        <div className="mt-6 space-y-4 text-slate-200">
          <div className="flex justify-between"><span>Commitment</span><span className="font-semibold">8f92a7...abc</span></div>
          <div className="flex justify-between"><span>Public Seed</span><span className="font-semibold">20261003</span></div>
          <div className="flex justify-between"><span>Randomness</span><span className="font-semibold">a82f91...xyz</span></div>
          <div className="flex justify-between"><span>Thuật toán</span><span className="font-semibold">SHA-256</span></div>
          <div className="flex justify-between"><span>Kết quả</span><span className="font-semibold text-cyan-300">05821</span></div>
        </div>
        <div className="mt-8 flex justify-center">
          <button className="primary-btn rounded-xl px-6 py-3 font-bold text-white">XÁC MINH</button>
        </div>
      </div>
    </div>
  );
}

function WinnerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-glass rounded-3xl p-8">
        <h1 className="text-3xl font-black text-white">Người trúng thưởng</h1>
        {winners.map((winner) => (
          <div key={winner.id} className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-lg font-bold text-white">{winner.program}</div>
            <div className="mt-4 space-y-2 text-slate-300">
              <div><span className="text-slate-400">Giải thưởng:</span> {winner.prize}</div>
              <div><span className="text-slate-400">Số:</span> {winner.ticket}</div>
              <div><span className="text-slate-400">Người trúng:</span> {winner.user}</div>
              <div><span className="text-slate-400">Trạng thái:</span> {winner.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="card-glass section-header rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-cyan-300" />
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {[
          { label: 'Chương trình', value: '12', icon: Gift },
          { label: 'Đơn hàng', value: '1.250', icon: ListOrdered },
          { label: 'Người dùng', value: '3.842', icon: UserRound },
          { label: 'Doanh thu', value: '125.000.000 điểm', icon: CircleDollarSign },
        ].map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="card-glass rounded-3xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Tổng quan</h2>
            <span className="text-sm text-slate-400">Theo tháng</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statData}>
                <defs>
                  <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="visits" stroke="#22d3ee" fill="url(#visits)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Chương trình</h2>
            <span className="text-sm text-slate-400">Tỷ lệ</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={4}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#22c55e', '#60a5fa', '#f97316'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-glass rounded-3xl p-6">
        <h2 className="text-xl font-bold text-white">Chương trình đang hoạt động</h2>
        <div className="mt-6 space-y-4">
          {[
            { code: '#001', sold: '7.250/10.000', status: 'Đang diễn ra' },
            { code: '#002', sold: '3.200/5.000', status: 'Đang diễn ra' },
            { code: '#003', sold: '5.000/5.000', status: 'Đã đóng' },
          ].map((item) => (
            <div key={item.code} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-200">
              <div className="font-semibold text-white">{item.code}</div>
              <div>{item.sold}</div>
              <div className="text-cyan-300">{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramManagement() {
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <h1 className="text-3xl font-black text-white">Quản lý chương trình</h1>
      </div>

      <div className="card-glass rounded-3xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-3 pr-6">Mã</th>
                <th className="py-3 pr-6">Tên chương trình</th>
                <th className="py-3 pr-6">Thời gian</th>
                <th className="py-3 pr-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {adminPrograms.map((program) => (
                <tr key={program.code} className="border-b border-slate-800">
                  <td className="py-3 pr-6">{program.code}</td>
                  <td className="py-3 pr-6">{program.name}</td>
                  <td className="py-3 pr-6">{program.time}</td>
                  <td className="py-3 pr-6 text-cyan-300">{program.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-glass rounded-3xl p-6">
        <h2 className="text-xl font-bold text-white">Tạo chương trình</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            'Tên chương trình',
            'Mô tả',
            'Giải thưởng',
            'Giá trị giải thưởng',
            'Tổng số vé',
            'Giá mỗi số',
            'Thời gian bắt đầu',
            'Thời gian kết thúc',
          ].map((label) => (
            <div key={label} className="space-y-2">
              <label className="block text-sm text-slate-300">{label}</label>
              <input className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-400" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200">Lưu nháp</button>
          <button className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">Công bố</button>
        </div>
      </div>
    </div>
  );
}

function TicketManagement() {
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <h1 className="text-3xl font-black text-white">Quản lý số dự thưởng</h1>
      </div>
      <div className="card-glass rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-3 pr-6">Số</th>
                <th className="py-3 pr-6">Người dùng</th>
                <th className="py-3 pr-6">Trạng thái</th>
                <th className="py-3 pr-6">Đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 8).map((ticket) => (
                <tr key={ticket.number} className="border-b border-slate-800">
                  <td className="py-3 pr-6">{ticket.number}</td>
                  <td className="py-3 pr-6">{ticket.status === 'Available' ? '--' : ticket.status === 'Held' ? 'Trần B' : 'Nguyễn A'}</td>
                  <td className="py-3 pr-6">{ticket.status}</td>
                  <td className="py-3 pr-6">{ticket.status === 'Available' ? '--' : 'ORD001'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderManagement() {
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <h1 className="text-3xl font-black text-white">Quản lý đơn hàng</h1>
      </div>

      <div className="card-glass rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-3 pr-6">Mã đơn</th>
                <th className="py-3 pr-6">Người dùng</th>
                <th className="py-3 pr-6">Chương trình</th>
                <th className="py-3 pr-6">Số lượng</th>
                <th className="py-3 pr-6">Tổng</th>
                <th className="py-3 pr-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((item) => (
                <tr key={item.id} className="border-b border-slate-800">
                  <td className="py-3 pr-6">{item.id}</td>
                  <td className="py-3 pr-6">Nguyễn Văn A</td>
                  <td className="py-3 pr-6">{item.program}</td>
                  <td className="py-3 pr-6">{item.quantity}</td>
                  <td className="py-3 pr-6">{item.total.toLocaleString()} điểm</td>
                  <td className="py-3 pr-6 text-emerald-300">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DrawingManagement() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <h1 className="text-3xl font-black text-white">Quản lý quay số</h1>
        <div className="mt-4 text-slate-300">Chương trình #001</div>
        <div className="mt-2 text-sm text-slate-400">Trạng thái: CLOSED</div>
      </div>

      <div className="card-glass rounded-3xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Public Seed</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" value="20261003" readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Commit</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" value="8f92a7..." readOnly />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button className="primary-btn rounded-xl px-6 py-3 font-bold text-white">Tạo kết quả</button>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Giải đặc biệt', '05821'],
              ['Giải nhất', '01235'],
              ['Giải nhì', '00125'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-black text-cyan-300">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="success-btn rounded-xl px-6 py-3 font-bold text-slate-950">Công bố</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-6">
        <h1 className="text-3xl font-black text-white">Audit Log</h1>
      </div>
      <div className="card-glass rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-3 pr-6">Thời gian</th>
                <th className="py-3 pr-6">User</th>
                <th className="py-3 pr-6">Action</th>
                <th className="py-3 pr-6">Entity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={`${log.time}-${log.user}-${log.action}`} className="border-b border-slate-800">
                  <td className="py-3 pr-6">{log.time}</td>
                  <td className="py-3 pr-6">{log.user}</td>
                  <td className="py-3 pr-6 text-cyan-300">{log.action}</td>
                  <td className="py-3 pr-6">{log.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="card-glass rounded-3xl p-8">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-2xl font-black text-slate-950">
            L
          </div>
        </div>
        <h1 className="text-3xl font-black text-white text-center">Đăng nhập</h1>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Email</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white" placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Mật khẩu</label>
            <input type="password" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white" placeholder="••••••••" />
          </div>
          <button className="primary-btn w-full rounded-xl px-4 py-3 font-bold">Đăng nhập</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailPage />} />
        <Route path="/choose" element={<ChooseTicketsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/success" element={<PaymentSuccessPage />} />
        <Route path="/tickets" element={<MyTicketsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/winner" element={<WinnerPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/programs" element={<ProgramManagement />} />
        <Route path="/admin/tickets" element={<TicketManagement />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/draw" element={<DrawingManagement />} />
        <Route path="/admin/audit" element={<AuditLogPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
