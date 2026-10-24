import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Gift,
  Ticket,
  ListOrdered,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Ticket as TicketLogo } from 'lucide-react';

const adminTabs = [
  { label: 'Tổng quan', to: '/quan-tri', icon: LayoutDashboard },
  { label: 'Người dùng', to: '/admin/users', icon: Users },
  { label: 'Chương trình', to: '/quan-tri/chuong-trinh', icon: Gift },
  { label: 'Kho vé', to: '/quan-tri/kho-ve', icon: Ticket },
  { label: 'Đơn hàng', to: '/quan-tri/don-hang', icon: ListOrdered },
  { label: 'Quay số', to: '/quan-tri/quay-so', icon: Sparkles },
  { label: 'Nhật ký', to: '/quan-tri/nhat-ky', icon: ShieldCheck },
];

export function AdminNav({ role }: { role: 'admin' | 'organizer' }) {
  const location = useLocation();
  const visibleTabs = role === 'admin'
    ? adminTabs
    : adminTabs.filter((tab) => ['/quan-tri/chuong-trinh', '/quan-tri/quay-so'].includes(tab.to));

  return (
    <aside className="admin-sidebar">
      <Link to="/quan-tri" className="admin-sidebar-brand"><span className="admin-sidebar-logo"><TicketLogo className="h-5 w-5" /></span><span><strong><i>Lucky</i>Draw</strong><small>QUAY SỐ MINH BẠCH</small></span></Link>
      <div className="admin-sidebar-badge">◉ KHU QUẢN TRỊ</div>
      <div className="admin-sidebar-links">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.to || (tab.to !== '/quan-tri' && location.pathname.startsWith(tab.to));
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`admin-sidebar-link ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      </div>
    </aside>
  );
}
