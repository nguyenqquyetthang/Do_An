import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarRange, Check, CircleDollarSign, Gift, LayoutDashboard, ListOrdered, LogIn, ShieldCheck, Ticket, Trophy, UserRound } from 'lucide-react';
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
const toProgram = (program: ApiProgram): UiProgram => ({ ...program, id: String(program.program_id), title: program.program_name, ticketPrice: Number(program.ticket_price), soldTickets: Number(program.reserved_tickets ?? 0), displayStatus: statusLabel(program.status), prizeValue: Number(program.prizes?.[0]?.estimated_value ?? 0) });
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
  const active = programs.find((p) => p.status === 'published') ?? programs[0];
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!active) return <div className="card-glass rounded-3xl p-8 text-slate-300">Chưa có chương trình nào được công bố.</div>;
  const counts = ['published', 'draft', 'completed'].map((status) => programs.filter((p) => p.status === status).length);
  return <div className="space-y-8">
    <section className="card-glass hero-panel rounded-[28px] border p-8">
      <div className="max-w-3xl space-y-5"><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Chương trình đang diễn ra</p><h1 className="text-4xl font-black text-white lg:text-5xl">Mã may mắn trong tay, giải thưởng lớn đang chờ.</h1><p className="text-lg text-slate-300">{active.description || 'Chọn số dự thưởng minh bạch, an toàn và có thể xác minh.'}</p><Link to={`/programs/${active.id}`} className="primary-btn inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold">Xem chương trình <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><StatCard label="Đang diễn ra" value={String(counts[0])} icon={Ticket} /><StatCard label="Sắp mở" value={String(counts[1])} icon={CalendarRange} /><StatCard label="Đã kết thúc" value={String(counts[2])} icon={Trophy} /></div>
    </section>
    <section className="space-y-4"><h2 className="text-2xl font-bold text-white">Danh sách chương trình quay số</h2><div className="grid gap-6 lg:grid-cols-3">{programs.map((p) => <ProgramCard key={p.id} program={p} />)}</div></section>
  </div>;
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
  return <div className="card-glass rounded-3xl p-8"><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{p.displayStatus}</p><h1 className="mt-2 text-3xl font-black text-white">{p.title}</h1>{(prize?.image_url || prize?.video_url) && <div className="mt-6 grid gap-4 md:grid-cols-2">{prize.image_url && <img src={`${API_ORIGIN}${prize.image_url}`} alt={prize.prize_name} className="max-h-80 w-full rounded-2xl object-cover" />}{prize.video_url && <video src={`${API_ORIGIN}${prize.video_url}`} controls className="max-h-80 w-full rounded-2xl bg-slate-950 object-cover" />}</div>}<p className="mt-4 text-slate-300">{p.description || 'Chưa có mô tả.'}</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[['Giá mỗi số', money(p.ticketPrice)], ['Tổng số vé', p.total_tickets.toLocaleString()], ['Đã bán/giữ', p.soldTickets.toLocaleString()], ['Giải thưởng', money(p.prizeValue)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><div className="text-xs uppercase text-slate-400">{label}</div><div className="mt-2 text-lg font-bold text-white">{value}</div></div>)}</div>{p.start_time && <p className="mt-6 text-slate-300">Mở từ {format(new Date(p.start_time), 'dd/MM/yyyy HH:mm')} {p.end_time && `đến ${format(new Date(p.end_time), 'dd/MM/yyyy HH:mm')}`}</p>}<Link to={`/choose?program=${p.id}`} className="primary-btn mt-8 inline-flex rounded-xl px-5 py-3 font-semibold">Chọn số dự thưởng</Link></div>;
}

function ChooseTicketsPage() {
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('program') ?? '1';
  const { data: program } = useApi(() => api.program(programId), null as ApiProgram | null);
  const { data: tickets, error, loading } = useApi(() => api.tickets(programId), [] as ApiTicket[]);
  const [selected, setSelected] = useState<string[]>(() => JSON.parse(localStorage.getItem('luckydraw-selected') ?? '[]') as string[]);
  const map = useMemo(() => Object.fromEntries(tickets.map((t) => [t.ticket_number, t.status === 'available' ? 'Available' : t.status === 'held' ? 'Held' : t.status === 'sold' ? 'Sold' : 'Unavailable'])), [tickets]);
  const choose = (number: string) => { if (map[number] !== 'Available') return; setSelected((old) => old.includes(number) ? old.filter((n) => n !== number) : old.length < 10 ? [...old, number] : old); };
  const next = () => { localStorage.setItem('luckydraw-selected', JSON.stringify(selected)); localStorage.setItem('luckydraw-program', programId); };
  if (loading) return <Loading />;
  return <div className="space-y-6"><div className="card-glass rounded-3xl p-6"><h1 className="text-3xl font-black text-white">Số dự thưởng {program ? `- ${program.program_name}` : ''}</h1><ErrorState error={error} /></div><div className="card-glass rounded-3xl p-6"><TicketGrid selected={selected} onSelect={choose} ticketMap={map as never} tickets={tickets.map((t) => ({ number: t.ticket_number, status: map[t.ticket_number] as never }))} /><div className="mt-8 flex items-center justify-between"><div><div className="text-sm text-slate-400">Số đã chọn</div><div className="font-semibold text-white">{selected.join(', ') || 'Chưa chọn'}</div></div><div className="text-2xl font-black text-cyan-300">{money(selected.reduce((sum, n) => sum + Number(tickets.find((t) => t.ticket_number === n)?.price ?? 0), 0))}</div></div><Link onClick={next} to={selected.length ? '/checkout' : '#'} className="primary-btn mt-6 inline-flex rounded-xl px-6 py-3 font-bold">Tiếp tục</Link></div></div>;
}

function CheckoutPage() {
  const navigate = useNavigate(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const selected = JSON.parse(localStorage.getItem('luckydraw-selected') ?? '[]') as string[]; const programId = Number(localStorage.getItem('luckydraw-program') ?? 0);
  const { data: program } = useApi(() => api.program(String(programId)), null as ApiProgram | null);
  const confirm = async () => { setBusy(true); setError(''); try { await api.holdTickets(String(programId), selected); const result = await api.createOrder(programId, selected); localStorage.setItem('luckydraw-order', String(result.order.order_id)); navigate('/payment'); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tạo đơn hàng.'); } finally { setBusy(false); } };
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
  if (loading) return <Loading />;
  return <div className="space-y-6"><div><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Organizer workspace</p><h1 className="mt-2 text-3xl font-black text-white">Quản lý chương trình</h1><p className="mt-2 text-slate-400">Tạo chương trình, theo dõi vé, đơn hàng và giới thiệu giải thưởng bằng ảnh/video.</p></div><ErrorState error={error} /><div className="flex flex-wrap gap-3"><button onClick={() => setTab('programs')} className={`rounded-xl border px-4 py-2 ${tab === 'programs' ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>Chương trình</button><button onClick={() => selectedProgram && loadTickets(selectedProgram)} className={`rounded-xl border px-4 py-2 ${tab === 'tickets' ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>Quản lý vé</button><button onClick={loadOrders} className={`rounded-xl border px-4 py-2 ${tab === 'orders' ? 'border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-300'}`}>Đơn hàng</button></div>{tab === 'programs' && <><div className="card-glass overflow-hidden rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Chương trình của tôi</h2><div className="grid gap-4 md:grid-cols-2">{data.map((p) => <div key={p.program_id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-cyan-300">{p.program_code}</p><h3 className="mt-1 font-bold text-white">{p.program_name}</h3></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{statusLabel(p.status)}</span></div><p className="mt-3 text-sm text-slate-400">Đã giữ/bán: {p.reserved_tickets ?? 0}/{p.total_tickets} vé</p><button onClick={() => loadTickets(p.program_id)} className="mt-4 rounded-lg border border-slate-600 px-3 py-2 text-sm text-cyan-300">Xem vé</button></div>)}</div></div><form onSubmit={submit} className="card-glass grid gap-4 rounded-3xl p-6 md:grid-cols-2"><h2 className="md:col-span-2 text-xl font-bold text-white">Tạo chương trình mới</h2><input required placeholder="Mã chương trình" value={form.programCode} onChange={(e) => setForm({ ...form, programCode: e.target.value })} className="organizer-input" /><input required placeholder="Tên chương trình" value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} className="organizer-input" /><textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="organizer-input md:col-span-2" /><textarea placeholder="Thể lệ chương trình" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="organizer-input md:col-span-2" /><input placeholder="Tên giải thưởng" value={form.prizeName} onChange={(e) => setForm({ ...form, prizeName: e.target.value })} className="organizer-input" /><input type="number" min="0" placeholder="Giá trị giải thưởng" value={form.prizeValue} onChange={(e) => setForm({ ...form, prizeValue: e.target.value })} className="organizer-input" /><div className="media-upload md:col-span-2"><label className="upload-box"><span>Ảnh sản phẩm</span><small>JPG, PNG, WEBP · tối đa 10MB</small><input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadMedia('image', e.target.files[0])} /></label>{form.imageUrl && <img src={`${API_ORIGIN}${form.imageUrl}`} alt="Xem trước sản phẩm" className="media-preview" />}</div><div className="media-upload md:col-span-2"><label className="upload-box"><span>Video sản phẩm</span><small>MP4, WebM, MOV · tối đa 100MB</small><input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && uploadMedia('video', e.target.files[0])} /></label>{form.videoUrl && <video src={`${API_ORIGIN}${form.videoUrl}`} controls className="media-preview" />}</div><input required type="number" min="0" placeholder="Giá mỗi vé" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} className="organizer-input" /><input required type="number" min="1" placeholder="Tổng số vé" value={form.totalTickets} onChange={(e) => setForm({ ...form, totalTickets: e.target.value })} className="organizer-input" /><label className="text-sm text-slate-300">Bắt đầu<input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="organizer-input mt-2" /></label><label className="text-sm text-slate-300">Kết thúc<input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="organizer-input mt-2" /></label><label className="text-sm text-slate-300">Thời gian quay<input type="datetime-local" value={form.drawTime} onChange={(e) => setForm({ ...form, drawTime: e.target.value })} className="organizer-input mt-2" /></label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="organizer-input self-end"><option value="draft">Lưu nháp</option><option value="published">Công bố ngay</option></select><button disabled={uploading !== null} className="primary-btn rounded-xl px-5 py-3 font-bold md:col-span-2 disabled:opacity-50">{uploading ? `Đang tải ${uploading === 'image' ? 'ảnh' : 'video'}...` : 'Lưu chương trình'}</button>{message && <p className="md:col-span-2 text-cyan-300">{message}</p>}</form></>}{tab === 'tickets' && <div className="card-glass overflow-hidden rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Quản lý số dự thưởng</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm text-slate-200"><thead><tr className="border-b border-slate-700"><th className="py-3">Số</th><th>Người dùng</th><th>Trạng thái</th><th>Đơn hàng</th></tr></thead><tbody>{ticketData.map((ticket) => <tr key={ticket.ticket_id} className="border-b border-slate-800"><td className="py-3 font-bold">{ticket.ticket_number}</td><td>{ticket.full_name ?? '--'}</td><td>{ticket.status}</td><td>{ticket.order_code ?? '--'}</td></tr>)}</tbody></table></div></div>}{tab === 'orders' && <div className="card-glass overflow-hidden rounded-3xl p-6"><h2 className="mb-4 text-xl font-bold text-white">Đơn hàng của chương trình</h2>{orders.map((order) => <div key={order.order_id} className="flex flex-wrap justify-between gap-3 border-b border-slate-800 py-4 text-slate-200"><span>{order.order_code} · {order.program_name} · {order.ticket_count} vé</span><span>{money(Number(order.total_amount))} · {order.status}</span></div>)}</div>}</div>;
}

function OrdersAdmin() { const { data, error, loading } = useApi(api.adminOrders, [] as ApiOrder[]); if (loading) return <Loading />; return <div className="space-y-6"><h1 className="text-3xl font-black text-white">Quản lý đơn hàng</h1><ErrorState error={error} /><div className="card-glass rounded-3xl p-6">{data.map((o) => <div key={o.order_id} className="flex justify-between border-b border-slate-800 py-4 text-slate-200"><span>{o.order_code} - {o.tickets.length} vé</span><span>{money(Number(o.total_amount))} · {o.status}</span></div>)}</div></div>; }
function AuditPage() { const { data, error, loading } = useApi(api.auditLogs, []); if (loading) return <Loading />; return <div className="space-y-6"><h1 className="text-3xl font-black text-white">Audit Log</h1><ErrorState error={error} /><div className="card-glass rounded-3xl p-6">{data.map((l) => <div key={l.audit_id} className="flex justify-between border-b border-slate-800 py-3 text-slate-200"><span>{format(new Date(l.created_at), 'dd/MM/yyyy HH:mm')} · {l.username}</span><span className="text-cyan-300">{l.action} {l.entity_type}</span></div>)}</div></div>; }
function DrawingPage() { const { data, loading } = useApi(api.organizerPrograms, [] as ApiProgram[]); const [message, setMessage] = useState(''); if (loading) return <Loading />; return <div className="card-glass rounded-3xl p-8"><p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Organizer workspace</p><h1 className="mt-2 text-3xl font-black text-white">Quản lý quay số</h1><p className="mt-2 text-slate-400">Chỉ các chương trình do bạn tạo mới xuất hiện ở đây.</p>{data.map((p) => <div key={p.program_id} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-4 text-slate-200"><span>{p.program_code} · {p.program_name} · {statusLabel(p.status)}</span><button disabled={p.status === 'completed'} onClick={() => api.drawProgram(p.program_id).then(() => setMessage(`Đã tạo kết quả cho ${p.program_name}.`)).catch((e) => setMessage(e.message))} className="primary-btn rounded-xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50">{p.status === 'completed' ? 'Đã quay' : 'Tạo kết quả'}</button></div>)}{message && <p className="mt-4 text-cyan-300">{message}</p>}</div>; }

function LoginPage({ onLogin }: { onLogin: (user: AuthUser, token: string) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [accountRole, setAccountRole] = useState<'USER' | 'ORGANIZER'>('USER');
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
        ? await api.register({ username, email, password, confirmPassword, fullName: name, role: accountRole })
        : await api.login(email, password);
      const role: UserRole = result.user.role === 'ADMIN' ? 'admin' : result.user.role === 'ORGANIZER' ? 'organizer' : 'user';
      onLogin({ name: result.user.fullName, email: result.user.email, role }, result.token);
      navigate(role === 'admin' ? '/admin' : role === 'organizer' ? '/admin/programs' : '/');
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Đăng nhập thất bại.');
    }
  };
  return <div className="login-page"><form onSubmit={submit} className="login-card"><div className="login-logo">L</div><h1 className="login-title">{register ? 'Tạo tài khoản' : 'Chào mừng trở lại.'}</h1><p className="login-subtitle">{register ? 'Chọn đúng loại tài khoản để sử dụng các chức năng phù hợp.' : 'Đăng nhập để tiếp tục mua vé hoặc quản lý chương trình.'}</p><div className="login-fields">{register && <><label className="login-field"><span>Họ và tên</span><input className="login-input" placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} required /></label><label className="login-field"><span>Tên đăng nhập</span><input className="login-input" placeholder="nguyenvana" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} pattern="[A-Za-z0-9_.-]+" title="Chỉ dùng chữ cái không dấu, số, dấu gạch dưới, chấm hoặc gạch ngang." /></label><label className="login-field"><span>Loại tài khoản</span><select className="login-input" value={accountRole} onChange={(e) => setAccountRole(e.target.value as 'USER' | 'ORGANIZER')}><option value="USER">Người mua vé số</option><option value="ORGANIZER">Người tạo chương trình</option></select></label></>}<label className="login-field"><span>Email</span><input className="login-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="login-field"><span>Mật khẩu</span><input className="login-input" type="password" placeholder="Tối thiểu 6 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>{register && <label className="login-field"><span>Nhập lại mật khẩu</span><input className="login-input" type="password" placeholder="Nhập lại mật khẩu để xác nhận" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} /></label>}</div>{error && <p className="login-error">{error}</p>}<button className="login-submit">{register ? 'Tạo tài khoản' : 'Đăng nhập'} <LogIn className="h-4 w-4" /></button><button type="button" className="login-link" onClick={() => { setRegister((v) => !v); setError(''); setConfirmPassword(''); }}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button></form></div>;
}

function Protected({ children, user, roles }: { children: ReactNode; user: AuthUser | null; roles?: UserRole[] }) { if (!user) return <Navigate to="/login" replace />; if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />; return <>{children}</>; }
function App() { const [user, setUser] = useState<AuthUser | null>(() => { const raw = localStorage.getItem('luckydraw-user'); return raw ? JSON.parse(raw) as AuthUser : null; }); const login = (next: AuthUser, token: string) => { localStorage.setItem('luckydraw-token', token); localStorage.setItem('luckydraw-user', JSON.stringify(next)); setUser(next); }; const logout = () => { localStorage.removeItem('luckydraw-token'); localStorage.removeItem('luckydraw-user'); setUser(null); }; useEffect(() => { const handleUnauthorized = () => setUser(null); window.addEventListener('luckydraw:unauthorized', handleUnauthorized); return () => window.removeEventListener('luckydraw:unauthorized', handleUnauthorized); }, []); return <DashboardLayout currentUser={user ? { name: user.name, role: user.role } : null} onLogout={logout}><Routes><Route path="/" element={<HomePage />} /><Route path="/programs" element={<ProgramsPage />} /><Route path="/programs/:id" element={<ProgramDetailPage />} /><Route path="/choose" element={<Protected user={user}><ChooseTicketsPage /></Protected>} /><Route path="/checkout" element={<Protected user={user}><CheckoutPage /></Protected>} /><Route path="/payment" element={<Protected user={user}><PaymentPage /></Protected>} /><Route path="/success" element={<Protected user={user}><SuccessPage /></Protected>} /><Route path="/tickets" element={<Protected user={user}><MyTicketsPage /></Protected>} /><Route path="/results" element={<ResultsPage />} /><Route path="/admin" element={<Protected user={user} roles={['admin']}><AdminDashboard /></Protected>} /><Route path="/admin/programs" element={<Protected user={user} roles={['admin', 'organizer']}><ProgramManagement /></Protected>} /><Route path="/admin/orders" element={<Protected user={user} roles={['admin']}><OrdersAdmin /></Protected>} /><Route path="/admin/draw" element={<Protected user={user} roles={['admin', 'organizer']}><DrawingPage /></Protected>} /><Route path="/admin/audit" element={<Protected user={user} roles={['admin']}><AuditPage /></Protected>} /><Route path="/login" element={<LoginPage onLogin={login} />} /></Routes></DashboardLayout>; }
export default App;
