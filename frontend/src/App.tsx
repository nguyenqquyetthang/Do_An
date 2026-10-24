import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarRange, Check, CircleDollarSign, Gift, LayoutDashboard, ListOrdered, LockKeyhole, LogIn, Mail, ShieldCheck, Ticket, Trophy, UserRound } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProgramCard } from './components/ui/ProgramCard';
import { StatCard } from './components/ui/StatCard';
import { TicketGrid } from './components/ui/TicketGrid';
import { API_ORIGIN, api, type ApiOrder, type ApiProgram, type ApiResult, type ApiTicket } from './services/api';

type UserRole = 'user' | 'organizer' | 'admin';
type AuthUser = { name: string; email: string; role: UserRole };
type UiProgram = ApiProgram & { id: string; title: string; ticketPrice: number; soldTickets: number; displayStatus: string; prizeValue: number };

const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} điểm`;
const statusLabel = (status: string) => ({ published: 'Đang diễn ra', draft: 'Bản nháp', closed: 'Đã đóng', completed: 'Đã kết thúc', drawing: 'Đang quay', cancelled: 'Đã huỷ' }[status] ?? status);
const toProgram = (program: ApiProgram): UiProgram => {
  const now = Date.now();
  const displayStatus = program.status === 'published' && program.end_time && new Date(program.end_time).getTime() <= now
    ? 'Đã kết thúc'
    : program.status === 'published' && program.start_time && new Date(program.start_time).getTime() > now
      ? 'Sắp diễn ra'
      : statusLabel(program.status);
  return { ...program, id: String(program.program_id), title: program.program_name, ticketPrice: Number(program.ticket_price), soldTickets: Number(program.reserved_tickets ?? 0), displayStatus, prizeValue: Number(program.prize_value ?? program.prizes?.[0]?.estimated_value ?? 0) };
};
const useApi = <T,>(loader: () => Promise<T>, initial: T) => {
  const [data, setData] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { loader().then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu.')).finally(() => setLoading(false)); }, []);
  return { data, error, loading };
};
const ErrorState = ({ error }: { error: string }) => error ? <div className="card-glass rounded-3xl p-6 text-rose-300">{error}</div> : null;
const Loading = () => <div className="card-glass rounded-3xl p-8 text-center text-slate-300">Đang tải dữ liệu...</div>;

function HomePage() {
  const { data, error, loading } = useApi(api.programs, [] as ApiProgram[]);
  const programs = data.map(toProgram);
  const activePrograms = programs.filter((program) => program.displayStatus === 'Đang diễn ra');
  const upcomingPrograms = programs.filter((program) => program.displayStatus === 'Sắp diễn ra');
  const completedPrograms = programs.filter((program) => ['completed', 'closed'].includes(program.status));
  const featured = activePrograms.reduce<UiProgram | null>((best, program) => !best || program.prizeValue > best.prizeValue ? program : best, null);
  return <div className="landing-page">
    <section className="featured-hero">
      {loading ? <Loading /> : featured ? <div className="featured-copy">
        <span className="hero-kicker">CHƯƠNG TRÌNH NỔI BẬT</span>
        <h1>{featured.title}</h1>
        <p>{featured.description || 'Chọn số dự thưởng minh bạch, an toàn và có thể xác minh.'}</p>
        <div className="featured-stats"><span><strong>{money(featured.prizeValue)}</strong>Giải thưởng</span><span><strong>{featured.total_tickets.toLocaleString()}</strong>Tổng số</span><span><strong>{(featured.total_tickets - featured.soldTickets).toLocaleString()}</strong>Còn lại</span></div>
        <Link to={`/chuong-trinh/${featured.id}`} className="primary-btn hero-cta">Xem chương trình <ArrowRight className="h-5 w-5" /></Link>
      </div> : <div className="featured-empty"><span className="hero-kicker">CHƯƠNG TRÌNH NỔI BẬT</span><h1>Chưa có chương trình đang diễn ra</h1><p>Chương trình nổi bật sẽ xuất hiện tại đây khi được công bố và bắt đầu mở bán.</p><Link to="/chuong-trinh" className="secondary-btn hero-cta">Xem chương trình sắp tới <ArrowRight className="h-5 w-5" /></Link></div>}
    </section>
    <section className="landing-programs">
      <ErrorState error={error} />
      <ProgramSection title="Đang diễn ra" programs={activePrograms} empty="Hiện chưa có chương trình nào đang mở bán." />
      <ProgramSection title="Sắp mở bán" programs={upcomingPrograms} empty="Chưa có chương trình nào được lên lịch mở bán." />
      <ProgramSection title="Đã kết thúc" programs={completedPrograms} empty="Chưa có chương trình đã kết thúc." />
    </section>
  </div>;
}

function ProgramSection({ title, programs, empty }: { title: string; programs: UiProgram[]; empty: string }) {
  return <section className="program-section"><div className="landing-section-heading"><h2>{title}</h2><Link to="/chuong-trinh" className="secondary-btn">Xem tất cả <ArrowRight className="h-4 w-4" /></Link></div>{programs.length ? <div className="grid gap-6 lg:grid-cols-3">{programs.slice(0, 3).map((program) => <ProgramCard key={program.id} program={program} />)}</div> : <div className="empty-programs">{empty}</div>}</section>;
}

function ProgramsPage() {
  const { data, error, loading } = useApi(api.programs, [] as ApiProgram[]);
  const [filter, setFilter] = useState('all');
  const programs = data.map(toProgram).filter((p) => filter === 'all' || p.displayStatus === filter);
  if (loading) return <Loading />;
  return <div className="space-y-6"><div className="card-glass rounded-3xl p-6"><h1 className="text-3xl font-black text-white">Danh sách chương trình quay số</h1><div className="mt-4 flex flex-wrap gap-3">{['all', 'Đang diễn ra', 'Bản nháp', 'Đã kết thúc'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-4 py-2 text-sm ${filter === item ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>{item === 'all' ? 'Tất cả' : item}</button>)}</div></div><ErrorState error={error} /><div className="grid gap-6 lg:grid-cols-3">{programs.map((p) => <ProgramCard key={p.id} program={p} />)}</div></div>;
}

function ProgramDetailPage() {
  const { id } = useParams();
  const { data, error, loading } = useApi(() => api.program(id ?? ''), null as ApiProgram | null);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error || 'Không tìm thấy chương trình.'} />;
  const p = toProgram(data);
  const prize = p.prizes?.[0];
  return <div className="card-glass rounded-3xl p-8"><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{p.displayStatus}</p><h1 className="mt-2 text-3xl font-black text-white">{p.title}</h1>{(prize?.image_url || prize?.video_url) && <div className="mt-6 grid gap-4 md:grid-cols-2">{prize.image_url && <img src={`${API_ORIGIN}${prize.image_url}`} alt={prize.prize_name} className="max-h-80 w-full rounded-2xl object-cover" />}{prize.video_url && <video src={`${API_ORIGIN}${prize.video_url}`} controls className="max-h-80 w-full rounded-2xl bg-slate-950 object-cover" />}</div>}<p className="mt-4 text-slate-300">{p.description || 'Chưa có mô tả.'}</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[['Giá mỗi số', money(p.ticketPrice)], ['Tổng số vé', p.total_tickets.toLocaleString()], ['Đã bán/giữ', p.soldTickets.toLocaleString()], ['Giải thưởng', money(p.prizeValue)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><div className="text-xs uppercase text-slate-400">{label}</div><div className="mt-2 text-lg font-bold text-white">{value}</div></div>)}</div>{p.start_time && <p className="mt-6 text-slate-300">Mở từ {format(new Date(p.start_time), 'dd/MM/yyyy HH:mm')} {p.end_time && `đến ${format(new Date(p.end_time), 'dd/MM/yyyy HH:mm')}`}</p>}<Link to={`/chuong-trinh/${p.id}/chon-so`} className="primary-btn mt-8 inline-flex rounded-xl px-5 py-3 font-semibold">Chọn số dự thưởng</Link></div>;
}

function ChooseTicketsPage() {
  const { id: routeProgramId } = useParams();
  const params = new URLSearchParams(window.location.search);
  const programId = routeProgramId ?? params.get('program') ?? '1';
  const { data: program } = useApi(() => api.program(programId), null as ApiProgram | null);
  const { data: tickets, error, loading } = useApi(() => api.tickets(programId), [] as ApiTicket[]);
  const [selected, setSelected] = useState<string[]>(() => JSON.parse(localStorage.getItem('luckydraw-selected') ?? '[]') as string[]);
  const map = useMemo(() => Object.fromEntries(tickets.map((t) => [t.ticket_number, t.status === 'available' ? 'Available' : t.status === 'held' ? 'Held' : t.status === 'sold' ? 'Sold' : 'Unavailable'])), [tickets]);
  const choose = (number: string) => { if (map[number] !== 'Available') return; setSelected((old) => old.includes(number) ? old.filter((n) => n !== number) : old.length < 10 ? [...old, number] : old); };
  const next = () => { localStorage.setItem('luckydraw-selected', JSON.stringify(selected)); localStorage.setItem('luckydraw-program', String(program?.program_id ?? programId)); };
  if (loading) return <Loading />;
  return <div className="space-y-6"><div className="card-glass rounded-3xl p-6"><h1 className="text-3xl font-black text-white">Số dự thưởng {program ? `- ${program.program_name}` : ''}</h1><p className="mt-2 text-slate-400">Hệ thống hiển thị đúng {tickets.length.toLocaleString()} số được cấu hình cho chương trình.</p><ErrorState error={error} /></div><div className="card-glass rounded-3xl p-6"><TicketGrid selected={selected} onSelect={choose} ticketMap={map as never} tickets={tickets.map((t) => ({ number: t.ticket_number, status: map[t.ticket_number] as never }))} /><div className="mt-8 flex items-center justify-between"><div><div className="text-sm text-slate-400">Số đã chọn</div><div className="font-semibold text-white">{selected.join(', ') || 'Chưa chọn'}</div></div><div className="text-2xl font-black text-cyan-300">{money(selected.reduce((sum, n) => sum + Number(tickets.find((t) => t.ticket_number === n)?.price ?? 0), 0))}</div></div><Link onClick={next} to={selected.length ? '/don/new/xac-nhan' : '#'} className="primary-btn mt-6 inline-flex rounded-xl px-6 py-3 font-bold">Tiếp tục</Link></div></div>;
}

function CheckoutPage() {
  const navigate = useNavigate(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const selected = JSON.parse(localStorage.getItem('luckydraw-selected') ?? '[]') as string[]; const programId = Number(localStorage.getItem('luckydraw-program') ?? 0);
  const { data: program } = useApi(() => api.program(String(programId)), null as ApiProgram | null);
  const confirm = async () => { setBusy(true); setError(''); try { await api.holdTickets(String(programId), selected); const result = await api.createOrder(programId, selected); localStorage.setItem('luckydraw-order', String(result.order.order_id)); navigate(`/don/${result.order.order_code}/thanh-toan`); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tạo đơn hàng.'); } finally { setBusy(false); } };
  return <div className="card-glass mx-auto max-w-3xl rounded-3xl p-8"><h1 className="text-3xl font-black text-white">Xác nhận đơn hàng</h1><div className="mt-6 space-y-4 text-slate-200"><div className="flex justify-between"><span>Chương trình</span><b>{program?.program_name ?? '...'}</b></div><div className="flex justify-between"><span>Số</span><b>{selected.join(', ') || 'Chưa chọn'}</b></div><div className="flex justify-between"><span>Số lượng</span><b>{selected.length}</b></div></div><ErrorState error={error} /><button disabled={!selected.length || busy} onClick={confirm} className="primary-btn mt-8 rounded-xl px-6 py-3 font-bold">{busy ? 'Đang tạo đơn...' : 'Xác nhận và giữ số'}</button></div>;
}

function PaymentPage() {
  const navigate = useNavigate(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const orderId = Number(localStorage.getItem('luckydraw-order'));
  const pay = async () => { setBusy(true); try { await api.payOrder(orderId); navigate('/success'); } catch (e) { setError(e instanceof Error ? e.message : 'Thanh toán thất bại.'); } finally { setBusy(false); } };
  return <div className="card-glass mx-auto max-w-3xl rounded-3xl p-8"><h1 className="text-3xl font-black text-white">Thanh toán mô phỏng</h1><p className="mt-6 text-slate-300">Đơn hàng #{orderId}. Thanh toán sẽ cập nhật vé sang trạng thái đã bán.</p><ErrorState error={error} /><button onClick={pay} disabled={busy || !orderId} className="primary-btn mt-8 rounded-xl px-6 py-3 font-bold">{busy ? 'Đang thanh toán...' : 'Thanh toán'}</button></div>;
}
const SuccessPage = () => <div className="card-glass mx-auto max-w-3xl rounded-3xl p-10 text-center"><Check className="mx-auto h-16 w-16 text-emerald-400" /><h1 className="mt-4 text-3xl font-black text-white">Thanh toán thành công</h1><Link to="/tickets" className="primary-btn mt-8 inline-flex rounded-xl px-6 py-3 font-bold">Xem vé của tôi</Link></div>;

function MyTicketsPage() {
  const { data, error, loading } = useApi(api.myOrders, [] as ApiOrder[]);
  if (loading) return <Loading />;
  return <div className="space-y-6"><h1 className="text-3xl font-black text-white">Vé của tôi</h1><ErrorState error={error} />{data.map((order) => <div key={order.order_id} className="card-glass rounded-3xl p-6"><div className="flex justify-between text-white"><b>{order.order_code}</b><span>{order.status}</span></div><p className="mt-2 text-slate-300">{order.tickets.map((t) => `${t.programName}: ${t.ticketNumber}`).join(', ')}</p><p className="mt-3 font-bold text-cyan-300">{money(Number(order.total_amount))}</p></div>)}</div>;
}

function ResultsPage() {
  const { data, error, loading } = useApi(api.results, [] as ApiResult[]);
  if (loading) return <Loading />;
  return <div className="mx-auto max-w-4xl space-y-6"><h1 className="text-3xl font-black text-white">Kết quả quay số</h1><ErrorState error={error} />{data.map((draw) => <div key={draw.draw_id} className="card-glass rounded-3xl p-8"><h2 className="text-xl font-bold text-white">{draw.program_name}</h2><p className="mt-2 text-slate-400">{format(new Date(draw.completed_at), 'dd/MM/yyyy HH:mm')}</p><div className="mt-6 grid gap-4 md:grid-cols-3">{draw.results.map((result) => <div key={result.ticketNumber} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-center"><div className="text-sm text-slate-400">{result.prizeName ?? `Hạng ${result.rank}`}</div><div className="mt-2 text-3xl font-black text-cyan-300">{result.ticketNumber}</div></div>)}</div><p className="mt-6 break-all text-xs text-slate-500">Commitment: {draw.seed_commitment}</p></div>)}</div>;
}

function AdminDashboard() {
  const { data, error, loading } = useApi(api.adminStats, { stats: { programs: 0, orders: 0, users: 0, revenue: 0 }, monthly: [], statuses: [], programs: [] });
  if (loading) return <Loading />;
  return <div className="space-y-6"><h1 className="text-3xl font-black text-white">Admin Dashboard</h1><ErrorState error={error} /><div className="grid gap-6 lg:grid-cols-4"><StatCard label="Chương trình" value={String(data.stats.programs)} icon={Gift} /><StatCard label="Đơn hàng" value={String(data.stats.orders)} icon={ListOrdered} /><StatCard label="Người dùng" value={String(data.stats.users)} icon={UserRound} /><StatCard label="Doanh thu" value={money(Number(data.stats.revenue))} icon={CircleDollarSign} /></div><div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]"><div className="card-glass rounded-3xl p-6"><h2 className="mb-5 text-xl font-bold text-white">Đơn hàng theo tháng</h2><div className="h-72"><ResponsiveContainer><AreaChart data={data.monthly}><CartesianGrid vertical={false} stroke="#334155" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Area dataKey="orders" stroke="#22d3ee" fill="#164e63" /></AreaChart></ResponsiveContainer></div></div><div className="card-glass rounded-3xl p-6"><h2 className="mb-5 text-xl font-bold text-white">Trạng thái</h2><div className="h-72"><ResponsiveContainer><PieChart><Pie data={data.statuses} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>{data.statuses.map((s, i) => <Cell key={s.name} fill={['#22c55e', '#60a5fa', '#f97316', '#a855f7'][i % 4]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div></div></div>;
}

function ProgramManagement() {
  const { data, error, loading } = useApi(api.organizerPrograms, [] as ApiProgram[]);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ programCode: '', programName: '', description: '', rules: '', prizeName: '', prizeValue: '0', imageUrl: '', videoUrl: '', ticketPrice: '1000', totalTickets: '100', startTime: '', endTime: '', drawTime: '', status: 'draft' });
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [ticketData, setTicketData] = useState<Awaited<ReturnType<typeof api.organizerTickets>>>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof api.organizerOrders>>>([]);
  const [tab, setTab] = useState<'programs' | 'tickets' | 'orders'>('programs');
  const isAdmin = JSON.parse(localStorage.getItem('luckydraw-user') ?? 'null')?.role === 'admin';
  const loadTickets = async (programId: number) => {
    setSelectedProgram(programId);
    setTab('tickets');
    try { setTicketData(await api.organizerTickets(programId)); } catch (x) { setMessage(x instanceof Error ? x.message : 'Không thể tải danh sách vé.'); }
  };
  const loadOrders = async () => {
    setTab('orders');
    try { setOrders(await api.organizerOrders()); } catch (x) { setMessage(x instanceof Error ? x.message : 'Không thể tải đơn hàng.'); }
  };
  const uploadMedia = async (kind: 'image' | 'video', file: File) => {
    const maxSize = kind === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage(`${kind === 'image' ? 'Ảnh' : 'Video'} vượt quá dung lượng cho phép.`);
      return;
    }
    setUploading(kind);
    setMessage('');
    try {
      const result = await api.uploadMedia(file);
      setForm((old) => ({ ...old, [kind === 'image' ? 'imageUrl' : 'videoUrl']: result.url }));
    } catch (x) {
      setMessage(x instanceof Error ? x.message : 'Không thể tải file lên.');
    } finally {
      setUploading(null);
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.createProgram({ ...form, imageUrl: form.imageUrl || undefined, videoUrl: form.videoUrl || undefined, ticketPrice: Number(form.ticketPrice), totalTickets: Number(form.totalTickets), prizeValue: Number(form.prizeValue), startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined, endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined, drawTime: form.drawTime ? new Date(form.drawTime).toISOString() : undefined });
      setMessage('Đã tạo chương trình thành công.');
      setForm({ programCode: '', programName: '', description: '', rules: '', prizeName: '', prizeValue: '0', imageUrl: '', videoUrl: '', ticketPrice: '1000', totalTickets: '100', startTime: '', endTime: '', drawTime: '', status: 'draft' });
    } catch (x) { setMessage(x instanceof Error ? x.message : 'Không thể tạo chương trình.'); }
  };
  const updateStatus = async (programId: number, status: 'draft' | 'published' | 'cancelled') => {
    try {
      await api.updateProgramStatus(programId, status);
      setMessage(status === 'published' ? 'Đã duyệt chương trình.' : 'Đã cập nhật trạng thái chương trình.');
      window.location.reload();
    } catch (x) { setMessage(x instanceof Error ? x.message : 'Không thể cập nhật trạng thái.'); }
  };
  if (loading) return <Loading />;
  return <div className="space-y-6"><div><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{isAdmin ? 'Admin workspace' : 'Organizer workspace'}</p><h1 className="mt-2 text-3xl font-black text-white">Quản lý chương trình</h1><p className="mt-2 text-slate-400">Tạo chương trình, theo dõi vé, đơn hàng và giới thiệu giải thưởng bằng ảnh/video.</p></div><ErrorState error={error} /><div className="flex flex-wrap gap-3"><button onClick={() => setTab('programs')} className={`rounded-xl border px-4 py-2 ${tab === 'programs' ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>Chương trình</button><button onClick={() => selectedProgram && loadTickets(selectedProgram)} className={`rounded-xl border px-4 py-2 ${tab === 'tickets' ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>Quản lý vé</button><button onClick={loadOrders} className={`rounded-xl border px-4 py-2 ${tab === 'orders' ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>Đơn hàng</button></div>{tab === 'programs' && <><div className="card-glass overflow-hidden rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Chương trình của tôi</h2><div className="grid gap-4 md:grid-cols-2">{data.map((p) => <div key={p.program_id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-cyan-300">{p.program_code}</p><h3 className="mt-1 font-bold text-white">{p.program_name}</h3></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{statusLabel(p.status)}</span></div><p className="mt-3 text-sm text-slate-400">Đã giữ/bán: {p.reserved_tickets ?? 0}/{p.total_tickets} vé</p>  <button onClick={() => loadTickets(p.program_id)} className="mt-4 rounded-lg border border-slate-600 px-3 py-2 text-sm text-cyan-300">Xem vé</button>{isAdmin && p.status === 'draft' && <button onClick={() => updateStatus(p.program_id, 'published')} className="ml-2 mt-4 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">Duyệt chương trình</button>}</div>)}</div></div><form onSubmit={submit} className="card-glass grid gap-4 rounded-3xl p-6 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold text-white">Tạo chương trình mới</h2><input required placeholder="Mã chương trình" value={form.programCode} onChange={(e) => setForm({ ...form, programCode: e.target.value })} className="organizer-input" /><input required placeholder="Tên chương trình" value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} className="organizer-input" /><textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="organizer-input md:col-span-2" /><textarea placeholder="Thể lệ chương trình" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="organizer-input md:col-span-2" /><input placeholder="Tên giải thưởng" value={form.prizeName} onChange={(e) => setForm({ ...form, prizeName: e.target.value })} className="organizer-input" /><input type="number" min="0" placeholder="Giá trị giải thưởng" value={form.prizeValue} onChange={(e) => setForm({ ...form, prizeValue: e.target.value })} className="organizer-input" /><div className="media-upload md:col-span-2"><label className="upload-box"><span>Ảnh sản phẩm</span><small>JPG, PNG, WEBP · tối đa 10MB</small><input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadMedia('image', e.target.files[0])} /></label>{form.imageUrl && <img src={`${API_ORIGIN}${form.imageUrl}`} alt="Xem trước sản phẩm" className="media-preview" />}</div><div className="media-upload md:col-span-2"><label className="upload-box"><span>Video sản phẩm</span><small>MP4, WebM, MOV · tối đa 100MB</small><input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && uploadMedia('video', e.target.files[0])} /></label>{form.videoUrl && <video src={`${API_ORIGIN}${form.videoUrl}`} controls className="media-preview" />}</div><input required type="number" min="0" placeholder="Giá mỗi vé" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} className="organizer-input" /><input required type="number" min="1" placeholder="Tổng số vé" value={form.totalTickets} onChange={(e) => setForm({ ...form, totalTickets: e.target.value })} className="organizer-input" /><label className="text-sm text-slate-300">Bắt đầu<input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="organizer-input mt-2" /></label><label className="text-sm text-slate-300">Kết thúc<input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="organizer-input mt-2" /></label><label className="text-sm text-slate-300">Thời gian quay<input type="datetime-local" value={form.drawTime} onChange={(e) => setForm({ ...form, drawTime: e.target.value })} className="organizer-input mt-2" /></label>  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="organizer-input self-end"><option value="draft">Lưu nháp</option>{isAdmin && <option value="published">Công bố ngay</option>}</select><button disabled={uploading !== null} className="primary-btn rounded-xl px-5 py-3 font-bold md:col-span-2 disabled:opacity-50">{uploading ? `Đang tải ${uploading === 'image' ? 'ảnh' : 'video'}...` : 'Lưu chương trình'}</button>{message && <p className="md:col-span-2 text-cyan-300">{message}</p>}</form></>}{tab === 'tickets' && <div className="card-glass overflow-hidden rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Quản lý số dự thưởng</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm text-slate-200"><thead><tr className="border-b border-slate-700"><th className="py-3">Số</th><th>Người dùng</th><th>Trạng thái</th><th>Đơn hàng</th></tr></thead><tbody>{ticketData.map((ticket) => <tr key={ticket.ticket_id} className="border-b border-slate-800"><td className="py-3 font-bold">{ticket.ticket_number}</td><td>{ticket.full_name ?? '--'}</td><td>{ticket.status}</td><td>{ticket.order_code ?? '--'}</td></tr>)}</tbody></table></div></div>}{tab === 'orders' && <div className="card-glass overflow-hidden rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Đơn hàng của chương trình</h2>{orders.map((order) => <div key={order.order_id} className="flex flex-wrap justify-between gap-3 border-b border-slate-800 py-4 text-slate-200"><span>{order.order_code} · {order.program_name} · {order.ticket_count} vé</span><span>{money(Number(order.total_amount))} · {order.status}</span></div>)}</div>}</div>;
}

function AdminUsersPage() {
  const { data, error, loading } = useApi(api.adminUsers, [] as Awaited<ReturnType<typeof api.adminUsers>>);
  const [users, setUsers] = useState(data);
  const [form, setForm] = useState({ username: '', fullName: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  useEffect(() => setUsers(data), [data]);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const created = await api.createOrganizer(form);
      setUsers((current) => [created, ...current]);
      setForm({ username: '', fullName: '', email: '', password: '' });
      setMessage('Đã cấp tài khoản người tạo chương trình.');
    } catch (x) { setMessage(x instanceof Error ? x.message : 'Không thể tạo tài khoản.'); }
  };
  if (loading) return <Loading />;
  return <div className="space-y-6"><div><h1 className="text-3xl font-black text-white">Quản lý người dùng</h1><p className="mt-2 text-slate-400">Cấp tài khoản và theo dõi hoạt động của người tạo chương trình, người mua vé.</p></div><ErrorState error={error} /><form onSubmit={create} className="card-glass grid gap-4 rounded-3xl p-6 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold text-white">Cấp tài khoản người tạo chương trình</h2><input required placeholder="Tên đăng nhập" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="organizer-input" /><input required placeholder="Họ và tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="organizer-input" /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="organizer-input" /><input required minLength={6} type="password" placeholder="Mật khẩu tạm thời" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="organizer-input" /><button className="primary-btn rounded-xl px-5 py-3 font-bold md:col-span-2">Tạo tài khoản</button>{message && <p className="md:col-span-2 text-cyan-300">{message}</p>}</form><div className="card-glass overflow-x-auto rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Danh sách tài khoản</h2><table className="min-w-full text-left text-sm text-slate-200"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="py-3">Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Vé đã mua</th><th>Ngày tạo</th></tr></thead><tbody>{users.map((user) => <tr key={user.userId} className="border-b border-slate-800"><td className="py-3"><strong>{user.fullName}</strong><div className="text-slate-400">{user.email} · @{user.username}</div></td><td>{user.role}</td><td>{user.status}</td><td>{user.totalTickets}</td><td>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</td></tr>)}</tbody></table></div></div>;
}

function OrdersAdmin() { const { data, error, loading } = useApi(api.adminOrders, [] as ApiOrder[]); if (loading) return <Loading />; return <div className="space-y-6"><h1 className="text-3xl font-black text-white">Quản lý đơn hàng</h1><ErrorState error={error} /><div className="card-glass rounded-3xl p-6">{data.map((o) => <div key={o.order_id} className="flex justify-between border-b border-slate-800 py-4 text-slate-200"><span>{o.order_code} - {o.tickets.length} vé</span><span>{money(Number(o.total_amount))} · {o.status}</span></div>)}</div></div>; }
function TicketVaultPage() {
  const { data, error, loading } = useApi(api.adminTickets, [] as Awaited<ReturnType<typeof api.adminTickets>>);
  if (loading) return <Loading />;
  return <div className="space-y-6"><div><h1 className="text-3xl font-black text-white">Kho vé</h1><p className="mt-2 text-slate-400">Theo dõi toàn bộ số dự thưởng, chương trình và người đang giữ vé.</p></div><ErrorState error={error} /><div className="card-glass overflow-x-auto rounded-3xl p-6"><table className="min-w-full text-left text-sm text-slate-200"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="py-3">Số vé</th><th>Chương trình</th><th>Giá</th><th>Người dùng</th><th>Trạng thái</th><th>Đơn hàng</th></tr></thead><tbody>{data.map((ticket) => <tr key={ticket.ticket_id} className="border-b border-slate-800"><td className="py-3 font-bold text-cyan-300">{ticket.ticket_number}</td><td>{ticket.program_name ?? '--'}</td><td>{money(Number(ticket.price))}</td><td>{ticket.full_name ?? '--'}</td><td>{ticket.status}</td><td>{ticket.order_code ?? '--'}</td></tr>)}</tbody></table></div></div>;
}
function AuditPage() { const { data, error, loading } = useApi(api.auditLogs, []); if (loading) return <Loading />; return <div className="space-y-6"><h1 className="text-3xl font-black text-white">Audit Log</h1><ErrorState error={error} /><div className="card-glass rounded-3xl p-6">{data.map((l) => <div key={l.audit_id} className="flex justify-between border-b border-slate-800 py-3 text-slate-200"><span>{format(new Date(l.created_at), 'dd/MM/yyyy HH:mm')} · {l.username}</span><span className="text-cyan-300">{l.action} {l.entity_type}</span></div>)}</div></div>; }
function DrawingPage() { const { data, loading } = useApi(api.organizerPrograms, [] as ApiProgram[]); const [message, setMessage] = useState(''); if (loading) return <Loading />; return <div className="card-glass rounded-3xl p-8"><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Organizer workspace</p><h1 className="mt-2 text-3xl font-black text-white">Quản lý quay số</h1><p className="mt-2 text-slate-400">Chỉ các chương trình do bạn tạo mới xuất hiện ở đây.</p>{data.map((p) => <div key={p.program_id} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-4 text-slate-200"><span>{p.program_code} · {p.program_name} · {statusLabel(p.status)}</span><button disabled={p.status === 'completed'} onClick={() => api.drawProgram(p.program_id).then(() => setMessage(`Đã tạo kết quả cho ${p.program_name}.`)).catch((e) => setMessage(e.message))} className="primary-btn rounded-xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50">{p.status === 'completed' ? 'Đã quay' : 'Tạo kết quả'}</button></div>)}{message && <p className="mt-4 text-cyan-300">{message}</p>}</div>; }

function LoginPage({ onLogin }: { onLogin: (user: AuthUser, token: string) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (register && password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      const result = register
        ? await api.register({ username, email, password, confirmPassword, fullName: name })
        : await api.login(email, password);
      const role: UserRole = result.user.role === 'ADMIN' ? 'admin' : result.user.role === 'ORGANIZER' ? 'organizer' : 'user';
      onLogin({ name: result.user.fullName, email: result.user.email, role }, result.token);
      navigate(role === 'admin' ? '/admin' : role === 'organizer' ? '/admin/programs' : '/');
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Đăng nhập thất bại.');
    }
  };
  return <div className="login-page"><div className="auth-layout">
    <form onSubmit={submit} className="login-card auth-card">
      <div className="auth-heading"><div className="login-logo"><Ticket className="h-6 w-6" /></div><span>{register ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}</span></div>
      <h1 className="login-title">{register ? 'Tạo tài khoản người mua vé' : 'Đăng nhập LuckyDraw'}</h1>
      <p className="login-subtitle">{register ? 'Tài khoản đăng ký mới chỉ có quyền mua vé. Tài khoản nhà tổ chức và quản trị viên được cấp riêng.' : 'Vai trò được xác thực ở tầng dữ liệu qua token, không chỉ dựa vào việc ẩn menu ở giao diện.'}</p>
      <div className="login-fields">
        {register && <><label className="login-field"><span>Họ và tên</span><div className="auth-input-wrap"><UserRound /><input className="login-input" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} required /></div></label><label className="login-field"><span>Tên đăng nhập</span><div className="auth-input-wrap"><UserRound /><input className="login-input" placeholder="nguyenvana" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} pattern="[-A-Za-z0-9_.]+" title="Chỉ dùng chữ cái không dấu, số, dấu gạch dưới, chấm hoặc gạch ngang." /></div></label></>}
        <label className="login-field"><span>Email</span><div className="auth-input-wrap"><Mail /><input className="login-input" type="email" placeholder="user@luckydraw.vn" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></label>
        <label className="login-field"><span>Mật khẩu</span><div className="auth-input-wrap"><LockKeyhole /><input className="login-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div></label>
        {register && <label className="login-field"><span>Nhập lại mật khẩu</span><div className="auth-input-wrap"><LockKeyhole /><input className="login-input" type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} /></div></label>}
      </div>
      {error && <p className="login-error">{error}</p>}
      <button className="login-submit">{register ? 'Tạo tài khoản' : 'Đăng nhập'} <LogIn className="h-4 w-4" /></button>
      <button type="button" className="login-link" onClick={() => { setRegister((v) => !v); setError(''); setConfirmPassword(''); }}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký người mua vé'}</button>
      {!register && <p className="auth-notice"><ShieldCheck className="h-4 w-4" /> Tài khoản ADMIN và ORGANIZER không thể tự đăng ký qua giao diện.</p>}
    </form>
    <aside className="auth-side-card">
      <div className="auth-side-icon"><ShieldCheck className="h-6 w-6" /></div>
      <h2>Quay số minh bạch</h2>
      <p>Đăng nhập để chọn số dự thưởng, theo dõi đơn hàng và kiểm tra vé của bạn.</p>
      <div className="auth-side-points"><span><Check className="h-4 w-4" /> Xác thực an toàn</span><span><Check className="h-4 w-4" /> Phân quyền tự động</span><span><Check className="h-4 w-4" /> Dữ liệu có thể kiểm chứng</span></div>
    </aside>
  </div></div>;
}

function Protected({ children, user, roles }: { children: ReactNode; user: AuthUser | null; roles?: UserRole[] }) { if (!user) return <Navigate to="/dang-nhap" replace />; if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />; return <>{children}</>; }
function App() { const [user, setUser] = useState<AuthUser | null>(() => { const raw = localStorage.getItem('luckydraw-user'); return raw ? JSON.parse(raw) as AuthUser : null; }); const login = (next: AuthUser, token: string) => { localStorage.setItem('luckydraw-token', token); localStorage.setItem('luckydraw-user', JSON.stringify(next)); setUser(next); }; const logout = () => { localStorage.removeItem('luckydraw-token'); localStorage.removeItem('luckydraw-user'); setUser(null); }; useEffect(() => { const handleUnauthorized = () => setUser(null); window.addEventListener('luckydraw:unauthorized', handleUnauthorized); return () => window.removeEventListener('luckydraw:unauthorized', handleUnauthorized); }, []); return <DashboardLayout currentUser={user ? { name: user.name, role: user.role } : null} onLogout={logout}><Routes><Route path="/" element={<HomePage />} /><Route path="/programs" element={<ProgramsPage />} /><Route path="/chuong-trinh" element={<ProgramsPage />} /><Route path="/programs/:id" element={<ProgramDetailPage />} /><Route path="/chuong-trinh/:id" element={<ProgramDetailPage />} /><Route path="/choose" element={<Protected user={user}><ChooseTicketsPage /></Protected>} /><Route path="/chuong-trinh/:id/chon-so" element={<Protected user={user}><ChooseTicketsPage /></Protected>} /><Route path="/checkout" element={<Protected user={user}><CheckoutPage /></Protected>} /><Route path="/don/:orderCode/xac-nhan" element={<Protected user={user}><CheckoutPage /></Protected>} /><Route path="/payment" element={<Protected user={user}><PaymentPage /></Protected>} /><Route path="/don/:orderCode/thanh-toan" element={<Protected user={user}><PaymentPage /></Protected>} /><Route path="/success" element={<Protected user={user}><SuccessPage /></Protected>} /><Route path="/tickets" element={<Protected user={user}><MyTicketsPage /></Protected>} /><Route path="/ve-cua-toi" element={<Protected user={user}><MyTicketsPage /></Protected>} /><Route path="/don-hang" element={<Protected user={user}><MyTicketsPage /></Protected>} /><Route path="/results" element={<ResultsPage />} /><Route path="/ket-qua" element={<ResultsPage />} /><Route path="/nguoi-thang" element={<ResultsPage />} /><Route path="/ket-qua/:id" element={<ResultsPage />} /><Route path="/xac-minh/:id" element={<ResultsPage />} /><Route path="/admin" element={<Protected user={user} roles={['admin']}><AdminDashboard /></Protected>} /><Route path="/quan-tri" element={<Protected user={user} roles={['admin']}><AdminDashboard /></Protected>} /><Route path="/admin/users" element={<Protected user={user} roles={['admin']}><AdminUsersPage /></Protected>} /><Route path="/quan-tri/nguoi-dung" element={<Protected user={user} roles={['admin']}><AdminUsersPage /></Protected>} /><Route path="/admin/programs" element={<Protected user={user} roles={['admin', 'organizer']}><ProgramManagement /></Protected>} /><Route path="/quan-tri/chuong-trinh" element={<Protected user={user} roles={['admin', 'organizer']}><ProgramManagement /></Protected>} /><Route path="/quan-tri/chuong-trinh/tao-moi" element={<Protected user={user} roles={['admin', 'organizer']}><ProgramManagement /></Protected>} /><Route path="/admin/tickets" element={<Protected user={user} roles={['admin']}><TicketVaultPage /></Protected>} /><Route path="/quan-tri/kho-ve" element={<Protected user={user} roles={['admin']}><TicketVaultPage /></Protected>} /><Route path="/admin/orders" element={<Protected user={user} roles={['admin']}><OrdersAdmin /></Protected>} /><Route path="/quan-tri/don-hang" element={<Protected user={user} roles={['admin']}><OrdersAdmin /></Protected>} /><Route path="/admin/draw" element={<Protected user={user} roles={['admin', 'organizer']}><DrawingPage /></Protected>} /><Route path="/quan-tri/quay-so" element={<Protected user={user} roles={['admin', 'organizer']}><DrawingPage /></Protected>} /><Route path="/admin/audit" element={<Protected user={user} roles={['admin']}><AuditPage /></Protected>} /><Route path="/quan-tri/nhat-ky" element={<Protected user={user} roles={['admin']}><AuditPage /></Protected>} /><Route path="/login" element={<LoginPage onLogin={login} />} /><Route path="/dang-nhap" element={<LoginPage onLogin={login} />} /></Routes></DashboardLayout>; }
export default App;
