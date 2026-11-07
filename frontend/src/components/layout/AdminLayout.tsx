import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  ShieldAlert,
  Ticket,
  Wand2,
  Trophy,
  UserPlus,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/SiteLayout";
import { useLottery } from "@/store/lottery";
import { cn } from "@/lib/utils";

const adminNav: Array<{
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
  organizerOnly?: boolean;
  operatorOnly?: boolean;
}> = [
  { to: "/quan-tri", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/quan-tri/chuong-trinh", label: "Chương trình", icon: ClipboardList, operatorOnly: false },
  { to: "/quan-tri/chuong-trinh/tao-moi", label: "Tạo chương trình", icon: PlusCircle, operatorOnly: false },
  { to: "/quan-tri/kho-ve", label: "Kho vé", icon: Ticket, operatorOnly: false },
  { to: "/quan-tri/don-hang", label: "Đơn hàng", icon: Receipt, operatorOnly: false },
  { to: "/quan-tri/don-hang-nha-to-chuc", label: "Đơn chương trình", icon: Receipt, organizerOnly: true },
  { to: "/quan-tri/quay-so", label: "Bàn quay số", icon: Wand2, operatorOnly: true },
  { to: "/quan-tri/nguoi-thang", label: "Trao giải", icon: Trophy, operatorOnly: true },
  { to: "/quan-tri/nhat-ky", label: "Audit log", icon: FileClock, operatorOnly: false },
  { to: "/quan-tri/tai-khoan/nha-to-chuc", label: "Tạo nhà tổ chức", icon: UserPlus, adminOnly: true },
  { to: "/quan-tri/tai-khoan", label: "Tài khoản", icon: Users, adminOnly: true },
  { to: "/tai-khoan", label: "Hồ sơ & mật khẩu", icon: UserRound },
];

export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { currentUser } = useLottery();

  if (!currentUser) return <Navigate to="/dang-nhap?next=/quan-tri" replace />;

  if (currentUser.role === "USER") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-e3">
          <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
          <h1 className="mt-4 text-xl font-bold">Tài khoản không có quyền quản trị</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chỉ tài khoản có vai trò Nhà tổ chức hoặc Quản trị mới truy cập được khu vực này. Hệ thống kiểm
            tra vai trò ở tầng dữ liệu, không chỉ ẩn giao diện.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dang-nhap?next=/quan-tri">Đăng nhập vai trò khác</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName = currentUser.name?.trim() || currentUser.email || "Người dùng";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1500px] gap-0 lg:gap-8 lg:px-8">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 py-6 lg:flex">
          <div className="px-5">
            <BrandMark />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-primary/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold">
              <ShieldAlert className="h-3 w-3" />
              Khu quản trị
            </span>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-1 px-3">
            {adminNav.filter((item) => (!item.adminOnly || currentUser.role === "ADMIN") && (!item.organizerOnly || currentUser.role === "ORGANIZER") && (!item.operatorOnly || currentUser.role === "DRAW_OPERATOR" || currentUser.role === "ADMIN") && (currentUser.role !== "DRAW_OPERATOR" || item.operatorOnly === true || item.to === "/quan-tri" || item.to === "/quan-tri/nhat-ky")).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ease-standard",
                    isActive
                      ? "bg-secondary text-foreground shadow-inset-line"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-3">
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <Link to="/">
                <ArrowLeft className="h-3.5 w-3.5" />
                Về trang người mua
              </Link>
            </Button>
            <div className="mt-4 rounded-md border border-border bg-card px-3 py-2.5">
              <p className="text-[12px] font-semibold">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{currentUser.email || "Chưa có email"}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 overflow-x-auto border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            {adminNav.filter((item) => (!item.adminOnly || currentUser.role === "ADMIN") && (!item.organizerOnly || currentUser.role === "ORGANIZER") && (!item.operatorOnly || currentUser.role === "DRAW_OPERATOR" || currentUser.role === "ADMIN") && (currentUser.role !== "DRAW_OPERATOR" || item.operatorOnly === true || item.to === "/quan-tri" || item.to === "/quan-tri/nhat-ky")).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-medium",
                    isActive
                      ? "border-gold/50 bg-primary/12 text-gold"
                      : "border-border text-muted-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <main className="px-4 py-8 sm:px-6 lg:px-0 lg:py-10">{children ?? <Outlet />}</main>
        </div>
      </div>
    </div>
  );
}
