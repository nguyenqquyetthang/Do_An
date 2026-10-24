import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Clock3, LogOut, Menu, Ticket, Trophy, UserRound } from 'lucide-react';
import { AdminNav } from '../admin/AdminNav';
const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Chương trình', to: '/chuong-trinh' },
  { label: 'Kết quả', to: '/ket-qua' },
  { label: 'Người trúng thưởng', to: '/nguoi-thang' },
];

type AuthUser = {
  name: string;
  role: 'user' | 'organizer' | 'admin';
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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className={`app-shell${isAdmin ? ' admin-app-shell' : ''}`}>
      <header className={`topbar${isAdmin ? ' admin-topbar' : ''}`}>
        <div className="topbar-inner">
          <Link to="/" className="brand-wrap">
            <div className="brand-mark"><Ticket className="h-5 w-5" /></div>
            <div className="brand-copy">
              <div className="brand-name"><span>Lucky</span>Draw</div>
              <div className="brand-tagline">QUAY SỐ MINH BẠCH</div>
            </div>
          </Link>

          <nav className="nav hidden md:flex" aria-label="Điều hướng chính">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {currentUser ? (
              <>
                <button type="button" className="account-pill" onClick={() => setAvatarOpen((v) => !v)} aria-expanded={avatarOpen} aria-haspopup="menu">
                  <span className="account-avatar">{currentUser.name.slice(0, 1).toUpperCase()}</span>
                  <span className="account-details"><strong>{currentUser.name}</strong><small>{currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'organizer' ? 'Nhà tổ chức' : 'Người mua vé'}</small></span>
                </button>
                {avatarOpen && <div className="account-menu" role="menu">
                  <div className="account-menu-heading"><strong>{currentUser.name}</strong><small>{currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'organizer' ? 'Nhà tổ chức' : 'Người mua vé'}</small></div>
                  {currentUser.role === 'admin' && <Link to="/admin" className="account-menu-link" onClick={() => setAvatarOpen(false)}><UserRound className="h-4 w-4" /> Khu quản trị</Link>}
                  {!isAdmin && <><Link to="/ve-cua-toi" className="account-menu-link" onClick={() => setAvatarOpen(false)}><Ticket className="h-4 w-4" /> Vé của tôi</Link>
                  <Link to="/don-hang" className="account-menu-link" onClick={() => setAvatarOpen(false)}><Clock3 className="h-4 w-4" /> Lịch sử đơn hàng</Link>
                  <Link to="/ket-qua" className="account-menu-link" onClick={() => setAvatarOpen(false)}><Trophy className="h-4 w-4" /> Kết quả quay số</Link></>}
                  <button type="button" className="account-menu-link account-menu-logout" onClick={() => { setAvatarOpen(false); onLogout(); }}><LogOut className="h-4 w-4" /> Đăng xuất</button>
                </div>}
              </>
            ) : (
              <Link to="/dang-nhap" className="primary-btn small"><span className="login-icon">♙</span> Đăng nhập</Link>
            )}
          </div>

          {!isAdmin && <button className="menu-btn md:hidden" aria-label="Mở menu" onClick={() => setMobileMenuOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </button>}
        </div>

        {!isAdmin && mobileMenuOpen && (
          <div className="mobile-nav">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="mobile-nav-link font-bold text-cyan-300" onClick={() => setMobileMenuOpen(false)}>
                🛡️ Trang quản trị viên
              </Link>
            )}
            {currentUser && <button className="mobile-nav-link mobile-logout" onClick={onLogout}>Đăng xuất</button>}
          </div>
        )}
      </header>

      <main className={`main-content${isAdmin ? ' admin-main-content' : ''}`}>{currentUser && (currentUser.role === 'admin' || currentUser.role === 'organizer') && <div className={isAdmin ? 'admin-nav-host' : 'mb-6'}><AdminNav role={currentUser.role} /></div>}{children}</main>
      <footer className={`site-footer${isAdmin ? ' admin-footer' : ''}`}>
        <div className="site-footer-grid">
          <div className="footer-brand">
            <div className="brand-wrap">
              <div className="brand-mark"><Ticket className="h-5 w-5" /></div>
              <div className="brand-copy">
                <div className="brand-name"><span>Lucky</span>Draw</div>
                <div className="brand-tagline">QUAY SỐ MINH BẠCH</div>
              </div>
            </div>
            <p>Nền tảng quay số trực tuyến công bố commitment trước khi mở bán và public seed sau khi khớp bán, cho phép bất kỳ ai tái kiểm chứng kết quả bằng SHA-256.</p>
          </div>
          <div><h3>NGƯỜI MUA VÉ</h3><Link to="/programs">Chương trình đang mở</Link><Link to="/tickets">Vé của tôi</Link><Link to="/tickets">Lịch sử đơn hàng</Link></div>
          <div><h3>MINH BẠCH</h3><Link to="/results">Kết quả quay số</Link><Link to="/results">Người trúng thưởng</Link><Link to="/results">Xác minh kết quả</Link></div>
          <div><h3>NHÀ TỔ CHỨC</h3><Link to="/admin">Bảng điều khiển</Link><Link to="/admin/programs">Tạo chương trình</Link><Link to="/admin/draw">Bản quay số</Link></div>
        </div>
        <div className="site-footer-bottom"><span>© 2026 LuckyDraw. Dữ liệu được cung cấp từ hệ thống.</span><span>SHA-256</span></div>
      </footer>
    </div>
  );
}
