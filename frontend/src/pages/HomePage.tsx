import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Fingerprint,
  Lock,
  MousePointerClick,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeaturedSpotlight } from "@/components/home/FeaturedSpotlight";
import { ProgramCard } from "@/components/shared/ProgramCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatCard } from "@/components/shared/StatCard";
import { CountdownText } from "@/components/shared/CountdownText";
import { formatDate, formatNumber, formatPoints } from "@/lib/format";
import { useLottery } from "@/store/lottery";

const steps = [
  {
    icon: MousePointerClick,
    title: "Chọn số dự thưởng",
    description: "Bàn chọn số hiển thị trạng thái từng ô theo thời gian thực: trống, đang giữ, đã bán.",
  },
  {
    icon: Lock,
    title: "Giữ số có khoá giao dịch",
    description: "Hệ thống giữ số trong 10 phút bằng khoá giao dịch, hai người không thể giữ cùng một số.",
  },
  {
    icon: CircleDollarSign,
    title: "Thanh toán đơn hàng",
    description: "Xác nhận đơn bằng phương thức thanh toán đã chọn, vé chuyển sang trạng thái đã bán.",
  },
  {
    icon: Fingerprint,
    title: "Kiểm chứng kết quả",
    description: "Tự tính lại SHA-256(commitment + public seed) để đối chiếu với số trúng đã công bố.",
  },
];

const HomePage = () => {
  const { programs, orders, users, ledgers } = useLottery();

  const activePrograms = programs
    .filter((program) => program.status === "active")
    .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
  const upcomingPrograms = programs.filter((program) => program.status === "upcoming");
  const publishedProgram = programs.find((program) => program.status === "published");

  const featured =
    [...activePrograms].sort((a, b) => b.prizeValue - a.prizeValue)[0] ?? activePrograms[0] ?? programs[0];

  const soldTotal = Object.values(ledgers).reduce((sum, ledger) => sum + ledger.sold.size, 0);

  return (
    <div>
      {/* HERO */}
      <section className="surface-hero relative overflow-hidden border-b border-border">
        <div className="surface-grid-lines absolute inset-0 opacity-[0.35]" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="container relative grid items-start gap-12 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div className="animate-rise">
            <Badge variant="soft" className="mb-6">
              <ShieldCheck className="h-3 w-3" />
              Commitment-first draw · SHA-256
            </Badge>
            <h1 className="text-[38px] font-extrabold leading-[1.16] tracking-[-0.03em] sm:text-[52px]">
              Quay số minh bạch,
              <br />
              <span className="text-gradient-gold">kiểm chứng được bằng toán học.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              LuckyDraw công bố commitment trước khi mở bán và public seed sau khi khoá bán. Bất kỳ ai cũng
              có thể tái tạo kết quả quay số chỉ với hai giá trị đó.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link to="/chuong-trinh">
                  <Ticket className="h-4 w-4" />
                  Chọn số dự thưởng
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to={publishedProgram ? `/xac-minh/${publishedProgram.id}` : "/ket-qua"}>
                  <Fingerprint className="h-4 w-4" />
                  Xem cách xác minh
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6">
              {[
                { label: "Chương trình", value: formatNumber(programs.length) },
                { label: "Đơn hàng", value: formatNumber(orders.length) },
                { label: "Người dùng", value: formatNumber(users.length) },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="font-mono-nums mt-1 text-xl font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise">
            <FeaturedSpotlight program={featured} />
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="border-b border-border bg-background">
        <div className="container grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Chương trình đang mở"
            value={activePrograms.length}
            icon={Ticket}
            hint="Cập nhật theo thời gian thực"
          />
          <StatCard
            label="Số dự thưởng phát hành"
            value={soldTotal}
            icon={Trophy}
            hint="Tổng số vé trên toàn hệ thống"
          />
          <StatCard
            label="Người dùng"
            value={users.length}
            icon={Users}
            hint="Bao gồm người mua vé và nhà tổ chức"
          />
          <StatCard
            label="Giá trị giải thưởng"
            value={programs.reduce((sum, program) => sum + program.prizeValue, 0) / 1_000_000}
            suffix="tr điểm"
            icon={BadgeCheck}
            decimals={1}
            hint="Tổng trên các chương trình hiện có"
          />
        </div>
      </section>

      {/* ACTIVE PROGRAMS */}
      <section className="container py-14">
        <SectionHeading
          eyebrow="Đang diễn ra"
          title="Chương trình đang mở bán"
          description="Chọn số dự thưởng, số sẽ được giữ cho bạn trong 10 phút trước khi thanh toán."
          action={
            <Button variant="outline" asChild>
              <Link to="/chuong-trinh">
                Xem tất cả chương trình
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {activePrograms.slice(0, 3).map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border bg-gradient-ink">
        <div className="container py-14">
          <SectionHeading
            eyebrow="Cách hoạt động"
            title="Bốn bước từ chọn số tới kiểm chứng"
            description="Mỗi bước đều để lại dấu vết trong audit log, phục vụ mục tiêu kiểm toán của hệ thống."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-lg border border-border bg-card p-5 shadow-e1 transition-all duration-200 ease-standard hover:-translate-y-[2px] hover:border-gold/35 hover:shadow-e2"
              >
                <span className="font-mono-nums absolute right-4 top-4 text-[28px] font-bold leading-none text-secondary">
                  0{index + 1}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-gold">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING + VERIFICATION */}
      <section className="container grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <SectionHeading
            eyebrow="Sắp mở bán"
            title="Chương trình sắp diễn ra"
            description="Đăng nhập để nhận thông báo khi chương trình mở bán."
          />
          <ul className="mt-8 space-y-3">
            {upcomingPrograms.map((program) => (
              <li
                key={program.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 shadow-e1 transition-colors duration-200 ease-standard hover:border-gold/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-nums text-[12px] text-muted-foreground">{program.code}</span>
                    <Badge variant="warning">Sắp mở</Badge>
                  </div>
                  <p className="mt-1 truncate text-[15px] font-semibold">{program.prizeName}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Mở bán {formatDate(program.startAt)} · {formatPoints(program.ticketPrice)}/số ·{" "}
                    {formatNumber(program.totalNumbers)} số
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-nums text-[12px] text-muted-foreground">
                    Mở sau <CountdownText target={new Date(program.startAt).getTime()} />
                  </span>
                  <Button variant="subtle" size="sm" asChild>
                    <Link to={`/chuong-trinh/${program.id}`}>Chi tiết</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-verified/25 bg-card p-6 shadow-e2">
          <Badge variant="verified" className="mb-4">
            <ShieldCheck className="h-3 w-3" />
            Đã tái kiểm chứng
          </Badge>
          <h3 className="text-xl font-bold tracking-[-0.015em]">
            Kết quả quay số có thể tái tạo bởi bất kỳ ai
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Commitment được sinh từ chuỗi bí mật của ban tổ chức ngay khi tạo chương trình. Sau khi khoá bán,
            tổ chức công bố public seed; kết quả trúng thưởng là hàm tất định của hai giá trị này.
          </p>
          {publishedProgram ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-border bg-background/60 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  Chương trình đã công bố
                </p>
                <p className="mt-1 text-[14px] font-semibold">
                  {publishedProgram.code} · {publishedProgram.prizeName}
                </p>
                <p className="font-mono-nums mt-1 text-[12px] text-verified-text">
                  {publishedProgram.winners?.length ?? 0} số trúng · seed {publishedProgram.publicSeed}
                </p>
              </div>
              <Button asChild variant="verified" className="w-full">
                <Link to={`/xac-minh/${publishedProgram.id}`}>
                  <Fingerprint className="h-4 w-4" />
                  Xác minh kết quả ngay
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {/* ORGANIZER CTA */}
      <section className="border-t border-border bg-gradient-ink">
        <div className="container flex flex-col items-start justify-between gap-6 py-14 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4">
              Dành cho nhà tổ chức
            </Badge>
            <h2 className="text-2xl font-bold tracking-[-0.015em] sm:text-[30px]">
              Tạo chương trình quay số của riêng bạn
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Cấu hình giải thưởng, dải số, giá vé và thời gian mở bán. Bàn quay số hỗ trợ tạo kết quả,
              công bố và ghi audit log bất biến.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/quan-tri/chuong-trinh/tao-moi">Tạo chương trình</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/quan-tri">
                Bảng điều khiển
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
