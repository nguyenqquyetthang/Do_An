import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { api } from "@/lib/api";

export default function AdminOrganizerCreatePage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"ORGANIZER" | "DRAW_OPERATOR">("ORGANIZER");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createOrganizer({ fullName: name, username, email, password, confirmPassword, role });
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("ORGANIZER");
      toast.success("Đã tạo tài khoản nhà tổ chức.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo tài khoản.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Quản lý tài khoản"
        title="Cấp tài khoản nghiệp vụ"
        description="Chỉ ADMIN được cấp tài khoản ORGANIZER hoặc DRAW_OPERATOR. Ban tổ chức quay thưởng chỉ xử lý các chương trình được phân công."
      />
      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-6 shadow-e1">
        <div>
          <Label htmlFor="account-role">Vai trò</Label>
          <select
            id="account-role"
            className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={role}
            onChange={(event) => setRole(event.target.value as "ORGANIZER" | "DRAW_OPERATOR")}
          >
            <option value="ORGANIZER">Nhà tổ chức</option>
            <option value="DRAW_OPERATOR">Ban tổ chức quay thưởng</option>
          </select>
        </div>
        <div>
          <Label htmlFor="organizer-name">Họ và tên</Label>
          <Input id="organizer-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="organizer-username">Tên đăng nhập</Label>
          <Input
            id="organizer-username"
            className="mt-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            pattern="[A-Za-z0-9_.-]+"
            title="Chỉ dùng chữ không dấu, số, dấu gạch dưới (_), dấu chấm (.) hoặc dấu gạch ngang (-)."
            required
          />
        </div>
        <div>
          <Label htmlFor="organizer-email">Email</Label>
          <Input id="organizer-email" type="email" className="mt-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="organizer-password">Mật khẩu</Label>
          <Input id="organizer-password" type="password" minLength={6} className="mt-2" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="organizer-confirm-password">Nhập lại mật khẩu</Label>
          <Input id="organizer-confirm-password" type="password" minLength={6} className="mt-2" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Đang tạo..." : "Tạo tài khoản"}</Button>
      </form>
    </div>
  );
}
