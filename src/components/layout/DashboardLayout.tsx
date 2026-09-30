import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { navItems } from '../../data/mockData';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
            <button className="ghost-btn">Admin</button>
            <button className="primary-btn small">Đăng nhập</button>
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
          </div>
        )}
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}
