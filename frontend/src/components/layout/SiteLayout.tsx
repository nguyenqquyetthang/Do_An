import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Coins,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  Trophy,
  UserRound,
  Bell,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLottery } from "@/store/lottery";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/format";

const navItems = [
  { to: "/", label: "Trang chủ" },
  { to: "/chuong-trinh", label: "Chương trình" },
  { to: "/ket-qua", label: "Kết quả" },
  { to: "/nguoi-thang", label: "Người trúng thưởng" },
];

const roleLabels = {
  USER: "Người mua vé",
  ORGANIZER: "Nhà tổ chức",
  ADMIN: "Quản trị",
} as const;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-md bg-gradient-gold shadow-glow-gold">
        <Ticket className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-[-0.02em]">
          Lucky<span className="text-gradient-gold">Draw</span>
        </span>
        {!compact ? (
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            quay số minh bạch
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { currentUser, logout } = useLottery();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const canManage = currentUser?.role === "ORGANIZER" || currentUser?.role === "ADMIN";
  const displayName = currentUser?.name?.trim() || currentUser?.email || "Người dùng";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 shadow-inset-line backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <BrandMark />
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-sm px-3 py-2 text-[13px] font-medium transition-colors duration-150 ease-standard",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/quan-tri">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Khu quản trị
              </Link>
            </Button>
          ) : null}

          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-left transition-colors duration-150 ease-standard hover:border-gold/40"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-gold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-[13px] font-semibold">{displayName}</span>
                  <span className="block font-mono-nums text-[11px] text-muted-foreground">
                    {formatPoints(currentUser.balance)}
                  </span>
                </span>
              </button>

              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div className="animate-rise absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-2 shadow-e3">
                    <div className="px-3 py-2">
                      <p className="text-[13px] font-semibold">{displayName}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{currentUser.email}</p>
                      <Badge variant="soft" className="mt-2">
                        {roleLabels[currentUser.role]}
                      </Badge>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    {[
                      { to: "/tai-khoan", label: "Thông tin cá nhân", icon: UserRound },
                      { to: "/ve-cua-toi", label: "Vé của tôi", icon: Ticket },
                      { to: "/don-hang", label: "Lịch sử đơn hàng", icon: Coins },
                      { to: "/giai-thuong", label: "Giải thưởng của tôi", icon: Trophy },
                      { to: "/thong-bao", label: "Thông báo", icon: Bell },
                      { to: "/ket-qua", label: "Kết quả quay số", icon: Trophy },
                    ].map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate(item.to);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:bg-secondary hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] text-destructive-text transition-colors duration-150 ease-standard hover:bg-destructive/15"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link to="/dang-nhap">
                <UserRound className="h-3.5 w-3.5" />
                Đăng nhập
              </Link>
            </Button>
          )}

          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-md border border-border bg-card p-2 lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="animate-rise border-t border-border bg-background/95 lg:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-sm px-3 py-2.5 text-sm font-medium",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {canManage ? (
              <NavLink
                to="/quan-tri"
                onClick={() => setMobileOpen(false)}
                className="rounded-sm px-3 py-2.5 text-sm font-medium text-gold"
              >
                Khu quản trị
              </NavLink>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-gradient-ink">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            Nền tảng quay số trực tuyến công bố commitment trước khi mở bán và public seed sau khi khoá
            bán, cho phép bất kỳ ai tái kiểm chứng kết quả bằng SHA-256.
          </p>
        </div>
        {[
          {
            title: "Người mua vé",
            links: [
              { label: "Chương trình đang mở", to: "/chuong-trinh" },
              { label: "Vé của tôi", to: "/ve-cua-toi" },
              { label: "Lịch sử đơn hàng", to: "/don-hang" },
            ],
          },
          {
            title: "Minh bạch",
            links: [
              { label: "Kết quả quay số", to: "/ket-qua" },
              { label: "Người trúng thưởng", to: "/nguoi-thang" },
              { label: "Xác minh kết quả", to: "/ket-qua" },
            ],
          },
          {
            title: "Nhà tổ chức",
            links: [
              { label: "Bảng điều khiển", to: "/quan-tri" },
              { label: "Tạo chương trình", to: "/quan-tri/chuong-trinh/tao-moi" },
              { label: "Bàn quay số", to: "/quan-tri/quay-so" },
            ],
          },
        ].map((group) => (
          <div key={group.title}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">{group.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-5 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 LuckyDraw. Dữ liệu được cung cấp từ hệ thống.</span>
          <span className="font-mono-nums">SHA-256 · commitment-first draw</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <SiteFooter />
    </div>
  );
}
