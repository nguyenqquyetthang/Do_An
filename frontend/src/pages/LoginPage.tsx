import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLottery } from "@/store/lottery";
import { api } from "@/lib/api";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const navigate = useNavigate();
  const { login } = useLottery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const target = useMemo(() => next ?? "/", [next]);

  const submit = async (mail: string, pass: string) => {
    if (isRegistering && pass !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setIsSubmitting(true);
    const result = isRegistering
      ? await (async () => {
          try {
            await api.register({
              name,
              username: username || mail.split("@")[0],
              email: mail,
              password: pass,
              confirmPassword,
            });
            return await login(mail, pass);
          } catch (registrationError) {
            return {
              ok: false,
              error: registrationError instanceof Error ? registrationError.message : "Không thể tạo tài khoản.",
            };
          }
        })()
      : await login(mail, pass);
    if (!result.ok) {
      setError(result.error ?? "Đăng nhập không thành công.");
      setIsSubmitting(false);
      return;
    }
    setError(null);
    toast.success("Đăng nhập thành công.");
    navigate(target, { replace: true });
    setIsSubmitting(false);
  };

  return (
    <div className="container grid gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
      <div className="mx-auto w-full max-w-md">
        <Badge variant="soft" className="mb-5">
          <UserRound className="h-3 w-3" />
          Đăng nhập hệ thống
        </Badge>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.025em]">
          Đăng nhập Lucky<span className="text-gradient-gold">Draw</span>
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Vai trò được xác thực ở tầng dữ liệu qua token, không chỉ dựa vào việc ẩn menu ở giao diện.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit(email, password);
          }}
        >
          {isRegistering && <div>
            <Label htmlFor="name" className="mb-2 block text-[13px] text-muted-foreground">Họ và tên</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nguyễn Văn An" />
          </div>}
          {isRegistering && <div>
            <Label htmlFor="username" className="mb-2 block text-[13px] text-muted-foreground">Tên đăng nhập</Label>
            <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="nguyenvanan" minLength={3} />
          </div>}
          <div>
            <Label htmlFor="email" className="mb-2 block text-[13px] text-muted-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@luckydraw.vn"
                className="pl-9"
                autoComplete="email"
              />
            </div>

          </div>

          <div>
            <Label htmlFor="password" className="mb-2 block text-[13px] text-muted-foreground">
              Mật khẩu
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="pl-9"
                autoComplete="current-password"
              />
            </div>
          </div>

          {isRegistering && <div>
            <Label htmlFor="confirm-password" className="mb-2 block text-[13px] text-muted-foreground">
              Nhập lại mật khẩu
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="pl-9"
                autoComplete="new-password"
              />
            </div>
          </div>}

          {error ? (
            <p className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/12 px-3 py-2.5 text-[12px] text-destructive-text">
              <ShieldAlert className="h-3.5 w-3.5" />
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            {isSubmitting ? "Đang xử lý..." : isRegistering ? "Tạo tài khoản" : "Đăng nhập"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <Button type="button" variant="link" className="mt-2 w-full" onClick={() => setIsRegistering((value) => !value)}>
          {isRegistering ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký người mua"}
        </Button>

        <p className="mt-5 rounded-md border border-border bg-card px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
          Tài khoản <span className="font-mono-nums text-foreground">ADMIN</span> không thể tự đăng ký qua
          giao diện; chỉ tài khoản được cấp trong cơ sở dữ liệu mới có quyền quản trị toàn hệ thống.
        </p>
      </div>

      <div>
        <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Thông tin đăng nhập được xác thực trực tiếp với PostgreSQL qua backend API. Mật khẩu không được
            gửi hoặc kiểm tra trong frontend.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/chuong-trinh">Tiếp tục xem chương trình</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
