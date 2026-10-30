import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/SiteLayout";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <BrandMark compact />
        <span className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-gold">
          <Compass className="h-7 w-7" />
        </span>
        <p className="font-mono-nums mt-6 text-[56px] font-extrabold leading-none text-gradient-gold">404</p>
        <h1 className="mt-4 text-xl font-bold tracking-[-0.01em]">Không tìm thấy trang</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Đường dẫn bạn truy cập không tồn tại hoặc chương trình đã bị gỡ khỏi hệ thống.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chuong-trinh">Xem chương trình</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
