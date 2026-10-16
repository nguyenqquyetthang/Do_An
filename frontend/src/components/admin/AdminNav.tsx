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

const adminTabs = [
  { label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
  { label: 'Người dùng', to: '/admin/users', icon: Users },
  { label: 'Chương trình', to: '/admin/programs', icon: Gift },
  { label: 'Số dự thưởng', to: '/admin/tickets', icon: Ticket },
  { label: 'Đơn hàng', to: '/admin/orders', icon: ListOrdered },
  { label: 'Quay số', to: '/admin/draw', icon: Sparkles },
  { label: 'Audit Log', to: '/admin/audit', icon: ShieldCheck },
];

export function AdminNav() {
  const location = useLocation();

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
      {adminTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
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
  );
}
