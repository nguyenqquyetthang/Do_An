import { useState } from "react";
import { CheckCircle2, KeyRound, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequireLogin } from "@/components/shared/RequireLogin";
import { useLottery } from "@/store/lottery";
import { api } from "@/lib/api";

const ProfilePage = () => {
  const { currentUser, updateProfile } = useLottery();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [address, setAddress] = useState(currentUser?.address ?? "");
  const [province, setProvince] = useState(currentUser?.province ?? "");
  const [district, setDistrict] = useState(currentUser?.district ?? "");
  const [ward, setWard] = useState(currentUser?.ward ?? "");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!currentUser) return <RequireLogin title="Đăng nhập để quản lý tài khoản" description="Cập nhật thông tin liên hệ và bảo vệ tài khoản mua vé của bạn." />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await updateProfile({ fullName: name, email, phone, address, province, district, ward });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật thông tin cá nhân.");
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đã đổi mật khẩu.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đổi mật khẩu.");
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <Badge variant="soft"><UserRound className="h-3 w-3" /> Tài khoản người mua</Badge>
      <h1 className="mt-4 text-2xl font-extrabold sm:text-[30px]">Thông tin cá nhân</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">Thông tin này được dùng để liên hệ khi bạn trúng thưởng.</p>
      <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-e1">
        <div>
          <Label htmlFor="profile-name">Họ và tên</Label>
          <Input id="profile-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
        </div>
        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="profile-phone">Số điện thoại</Label>
          <Input id="profile-phone" className="mt-2" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" />
        </div>
        <div>
          <Label htmlFor="profile-address">Địa chỉ nhận giải</Label>
          <Input id="profile-address" className="mt-2" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" maxLength={500} />
          <p className="mt-1.5 text-[11px] text-muted-foreground">Địa chỉ được dùng khi cần trao giải trực tiếp.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="profile-province">Tỉnh / thành phố</Label>
            <Input id="profile-province" className="mt-2" value={province} onChange={(event) => setProvince(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="profile-district">Quận / huyện</Label>
            <Input id="profile-district" className="mt-2" value={district} onChange={(event) => setDistrict(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="profile-ward">Phường / xã</Label>
            <Input id="profile-ward" className="mt-2" value={ward} onChange={(event) => setWard(event.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-[12px] text-muted-foreground">Tên đăng nhập: <span className="font-medium text-foreground">{currentUser.email}</span></p>
          <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"} <CheckCircle2 className="h-4 w-4" /></Button>
        </div>
      </form>
      <form onSubmit={changePassword} className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6 shadow-e1">
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-gold" /> Đổi mật khẩu</h2>
        <Input type="password" placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required minLength={6} />
        <Input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} />
        <Input type="password" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} />
        <Button type="submit">Đổi mật khẩu</Button>
      </form>
    </div>
  );
};

export default ProfilePage;
