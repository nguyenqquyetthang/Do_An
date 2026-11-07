import { AdminLayout } from "./components/layout/AdminLayout";
import { SiteLayout } from "./components/layout/SiteLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import NotFound from "./pages/NotFound";
import OrderConfirmPage from "./pages/OrderConfirmPage";
import PaymentPage from "./pages/PaymentPage";
import PickNumbersPage from "./pages/PickNumbersPage";
import ProgramDetailPage from "./pages/ProgramDetailPage";
import ProgramsPage from "./pages/ProgramsPage";
import ResultDetailPage from "./pages/ResultDetailPage";
import ResultsPage from "./pages/ResultsPage";
import VerifyPage from "./pages/VerifyPage";
import WinnersPage from "./pages/WinnersPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import PrizesPage from "./pages/PrizesPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminDrawConsolePage from "./pages/admin/AdminDrawConsolePage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProgramCreatePage from "./pages/admin/AdminProgramCreatePage";
import AdminProgramsPage from "./pages/admin/AdminProgramsPage";
import AdminOrganizerCreatePage from "./pages/admin/AdminOrganizerCreatePage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import OrganizerOrdersPage from "./pages/admin/OrganizerOrdersPage";
import AdminProgramEditPage from "./pages/admin/AdminProgramEditPage";
import OperatorDashboardPage from "./pages/admin/OperatorDashboardPage";

export const routers = [
  {
    path: "/",
    name: "site",
    element: <SiteLayout />,
    children: [
      { index: true, name: "home", element: <HomePage /> },
      { path: "chuong-trinh", name: "programs", element: <ProgramsPage /> },
      { path: "chuong-trinh/:programId", name: "program-detail", element: <ProgramDetailPage /> },
      { path: "chuong-trinh/:programId/chon-so", name: "pick-numbers", element: <PickNumbersPage /> },
      { path: "don/:orderId/xac-nhan", name: "order-confirm", element: <OrderConfirmPage /> },
      { path: "don/:orderId/thanh-toan", name: "payment", element: <PaymentPage /> },
      { path: "ve-cua-toi", name: "my-tickets", element: <MyTicketsPage /> },
      { path: "don-hang", name: "my-orders", element: <MyOrdersPage /> },
      { path: "tai-khoan", name: "profile", element: <ProfilePage /> },
      { path: "thong-bao", name: "notifications", element: <NotificationsPage /> },
      { path: "giai-thuong", name: "my-prizes", element: <PrizesPage /> },
      { path: "ket-qua", name: "results", element: <ResultsPage /> },
      { path: "ket-qua/:programId", name: "result-detail", element: <ResultDetailPage /> },
      { path: "xac-minh/:programId", name: "verify", element: <VerifyPage /> },
      { path: "nguoi-thang", name: "winners", element: <WinnersPage /> },
      { path: "dang-nhap", name: "login", element: <LoginPage /> },
    ],
  },
  {
    path: "/quan-tri",
    name: "admin",
    element: <AdminLayout />,
    children: [
      { index: true, name: "admin-dashboard", element: <AdminDashboardPage /> },
      { path: "chuong-trinh", name: "admin-programs", element: <AdminProgramsPage /> },
      { path: "chuong-trinh/tao-moi", name: "admin-program-create", element: <AdminProgramCreatePage /> },
      { path: "chuong-trinh/:programId/chinh-sua", name: "admin-program-edit", element: <AdminProgramEditPage /> },
      { path: "tai-khoan/nha-to-chuc", name: "admin-organizer-create", element: <AdminOrganizerCreatePage /> },
      { path: "tai-khoan", name: "admin-users", element: <AdminUsersPage /> },
      { path: "kho-ve", name: "admin-inventory", element: <AdminInventoryPage /> },
      { path: "don-hang", name: "admin-orders", element: <AdminOrdersPage /> },
      { path: "don-hang-nha-to-chuc", name: "organizer-orders", element: <OrganizerOrdersPage /> },
      { path: "quay-so", name: "admin-draw", element: <AdminDrawConsolePage /> },
      { path: "nguoi-thang", name: "operator-winners", element: <OperatorDashboardPage /> },
      { path: "nhat-ky", name: "admin-audit", element: <AdminAuditPage /> },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
