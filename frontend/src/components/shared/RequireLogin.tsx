import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RequireLogin({ title, description }: { title: string; description: string }) {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-e2">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-gold">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-[-0.01em]">{title}</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link to="/dang-nhap">Đăng nhập</Link>
        </Button>
      </div>
    </div>
  );
}
