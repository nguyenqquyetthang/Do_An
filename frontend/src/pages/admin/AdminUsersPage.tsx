import { useEffect, useState } from "react";
import { KeyRound, Lock, Search, Unlock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

type AdminUser = {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: "active" | "inactive" | "locked";
  createdAt: string;
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    void api.adminUsers().then((rows) => setUsers(rows as unknown as AdminUser[])).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh sách tài khoản.");
    });
  }, []);

  const visible = users.filter((user) =>
    `${user.fullName} ${user.username} ${user.email}`.toLowerCase().includes(keyword.toLowerCase()),
  );

  const toggleStatus = async (user: AdminUser) => {
    const status = user.status === "locked" ? "active" : "locked";
    try {
      await api.updateUserStatus(String(user.userId), status);
      setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, status } : item));
      toast.success(status === "locked" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tài khoản.");
    }
  };

  const revokeRole = async (user: AdminUser) => {
    if (!["ORGANIZER", "DRAW_OPERATOR"].includes(user.role)) return;
    if (!window.confirm(`Thu hồi quyền ${user.role} của ${user.fullName}?`)) return;
    try {
      await api.revokeRole(String(user.userId));
      setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, role: "USER", status: "active" } : item));
      toast.success("Đã thu hồi quyền nghiệp vụ.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thu hồi quyền.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Quản trị tài khoản" title="Người mua và người tạo chương trình" description="Theo dõi vai trò, trạng thái hoạt động và khóa/mở tài khoản khi cần." />
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm theo họ tên, username hoặc email" className="pl-9" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-e1">
        <Table>
          <TableHeader><TableRow><TableHead>Tài khoản</TableHead><TableHead>Vai trò</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.map((user) => (
              <TableRow key={user.userId}>
                <TableCell><p className="font-medium">{user.fullName}</p><p className="text-xs text-muted-foreground">{user.username} · {user.email}</p></TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell><Badge variant={user.status === "active" ? "verified" : "danger"}>{user.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => void toggleStatus(user)}>
                    {user.status === "locked" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {user.status === "locked" ? "Mở khóa" : "Khóa"}
                  </Button>
                  {["ORGANIZER", "DRAW_OPERATOR"].includes(user.role) ? (
                    <Button size="sm" variant="danger" onClick={() => void revokeRole(user)}>
                      <KeyRound className="h-3.5 w-3.5" /> Thu hồi quyền
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
