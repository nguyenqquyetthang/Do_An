import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminNav } from '../admin/AdminNav';

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Chương trình', to: '/programs' },
  { label: 'Kết quả', to: '/results' },
];

type AuthUser = {
  name: string;
  role: 'user' | 'admin';
};

export function DashboardLayout({
  children,
  currentUser,
  onLogout,
}: {
  children: ReactNode;
  currentUser: AuthUser | null;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-wrap">
            <div className="brand-mark">L</div>
            <div className="brand-name">LUCKYDRAW</div>
          </div>

          <nav className="nav hidden md:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions hidden md:flex">
            {currentUser ? (
              <>
                <Link to={currentUser.role === 'admin' ? '/admin' : '/'} className="ghost-btn inline-flex items-center gap-2">
                  <span className="status-dot" />
                  {currentUser.name}
                </Link>
                <button className="primary-btn small" onClick={onLogout}>Đăng xuất</button>
              </>
            ) : (
              <Link to="/login" className="primary-btn small">Đăng nhập</Link>
            )}
          </div>

          <button className="menu-btn md:hidden" onClick={() => setMenuOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-nav">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="mobile-nav-link font-bold text-cyan-300" onClick={() => setMenuOpen(false)}>
                🛡️ Trang quản trị viên
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="main-content">
        {isAdminPage && currentUser?.role === 'admin' && (
          <div className="mb-6">
            <AdminNav />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
