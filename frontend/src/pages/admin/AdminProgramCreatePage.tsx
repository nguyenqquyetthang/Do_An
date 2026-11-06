import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  Film,
  Image as ImageIcon,
  KeyRound,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { HashChip } from "@/components/shared/HashChip";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buildCommitment } from "@/lib/draw";
import { formatNumber, formatPoints } from "@/lib/format";
import { useLottery } from "@/store/lottery";
import type { PrizeCategory, PrizeTerm } from "@/data/types";

const IMAGE_LIMIT = 10 * 1024 * 1024;
const VIDEO_LIMIT = 100 * 1024 * 1024;

const toLocalInput = (ms: number) => {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const randomSecret = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const categories: { value: PrizeCategory; label: string }[] = [
  { value: "tech", label: "Thiết bị công nghệ" },
  { value: "vehicle", label: "Xe / phương tiện" },
  { value: "cash", label: "Tiền mặt / điểm thưởng" },
  { value: "travel", label: "Du lịch / trải nghiệm" },
  { value: "home", label: "Gia dụng / nội thất" },
  { value: "other", label: "Khác" },
];

const AdminProgramCreatePage = () => {
  const navigate = useNavigate();
  const { createProgram, currentUser, programs } = useLottery();

  const [name, setName] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PrizeCategory>("tech");
  const [ticketPrice, setTicketPrice] = useState("1000");
  const [totalNumbers, setTotalNumbers] = useState("5000");
  const [startAt, setStartAt] = useState(toLocalInput(Date.now() + 60 * 60 * 1000));
  const [endAt, setEndAt] = useState(toLocalInput(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [terms, setTerms] = useState<PrizeTerm[]>([
    { id: "dac-biet", label: "Giải đặc biệt", quantity: 1, value: 10_000_000 },
    { id: "nhi", label: "Giải nhì", quantity: 3, value: 1_500_000 },
  ]);
  const [secret, setSecret] = useState(randomSecret);
  const [media, setMedia] = useState<{ name: string; kind: "image" | "video"; size: number } | null>(null);

  const nextCode = useMemo(() => `#${String(programs.length + 1).padStart(3, "0")}`, [programs.length]);
  const commitHash = buildCommitment("new", secret);
  const totalPrizeValue = terms.reduce((sum, term) => sum + term.value * term.quantity, 0);
  const totalNumbersValue = Number.parseInt(totalNumbers, 10) || 0;
  const priceValue = Number.parseInt(ticketPrice, 10) || 0;
  const grossRevenue = totalNumbersValue * priceValue;

  const errors = useMemo(() => {
    const list: string[] = [];
    if (name.trim().length < 5) list.push("Tên chương trình cần tối thiểu 5 ký tự.");
    if (prizeName.trim().length < 3) list.push("Tên giải thưởng cần tối thiểu 3 ký tự.");
    if (priceValue <= 0) list.push("Giá mỗi số phải lớn hơn 0.");
    if (totalNumbersValue < 100) list.push("Tổng số vé tối thiểu là 100.");
    if (totalNumbersValue > 100_000) list.push("Tổng số vé tối đa là 100.000.");
    if (totalNumbersValue % 10 !== 0) list.push("Tổng số vé nên là bội số của 10 để chia dải số đẹp.");
    if (new Date(endAt).getTime() <= new Date(startAt).getTime())
      list.push("Thời gian khoá bán phải sau thời gian mở bán.");
    if (terms.length === 0) list.push("Cần ít nhất một giải thưởng.");
    if (terms.some((term) => term.quantity < 1 || term.value <= 0 || term.label.trim() === ""))
      list.push("Mỗi giải cần có tên, số lượng ≥ 1 và giá trị > 0.");
    if (secret.length < 16) list.push("Chuỗi bí mật cần tối thiểu 16 ký tự.");
    return list;
  }, [name, prizeName, priceValue, totalNumbersValue, endAt, startAt, terms, secret]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Chỉ chấp nhận tệp ảnh hoặc video.");
      return;
    }
    if (isImage && file.size > IMAGE_LIMIT) {
      toast.error("Ảnh vượt quá 10MB. Vui lòng nén hoặc chọn ảnh nhỏ hơn.");
      return;
    }
    if (isVideo && file.size > VIDEO_LIMIT) {
      toast.error("Video vượt quá 100MB. Vui lòng chọn video ngắn hơn.");
      return;
    }
    setMedia({ name: file.name, kind: isImage ? "image" : "video", size: file.size });
    toast.success(`Đã đính kèm ${file.name}`);
  };

  const submit = async (publish: boolean) => {
    if (errors.length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin chương trình.");
      return;
    }
    const program = await createProgram({
      name,
      description: description.trim() || `${name} — chương trình quay số do ${currentUser?.name ?? "ban tổ chức"} tạo.`,
      prizeName,
      ticketPrice: priceValue,
      totalNumbers: totalNumbersValue,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      category,
      prizeTerms: terms,
      secret,
      mediaName: media?.name,
      mediaKind: media?.kind,
      mediaSize: media?.size,
      publish,
    });
    toast.success(
      publish ? `Đã công bố chương trình ${program.code}.` : `Đã lưu nháp chương trình ${program.code}.`,
    );
    navigate("/quan-tri/chuong-trinh");
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Tạo chương trình"
        title="Chương trình quay số mới"
        description="Cấu hình giải thưởng, dải số, giá vé và thời gian mở bán. Commitment được sinh ngay khi tạo."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => submit(false)}>
              <Save className="h-4 w-4" />
              Lưu nháp
            </Button>
            <Button onClick={() => submit(true)}>
              <UploadCloud className="h-4 w-4" />
              Công bố & mở bán
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="text-[15px] font-semibold">Thông tin chương trình</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name" className="mb-2 block text-[13px] text-muted-foreground">
                  Tên chương trình
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Quay số mừng xuân 2026"
                />
              </div>
              <div>
                <Label htmlFor="prize" className="mb-2 block text-[13px] text-muted-foreground">
                  Giải thưởng chính
                </Label>
                <Input
                  id="prize"
                  value={prizeName}
                  onChange={(event) => setPrizeName(event.target.value)}
                  placeholder="Ví dụ: iPhone 17 Pro Max"
                />
              </div>
              <div>
                <Label className="mb-2 block text-[13px] text-muted-foreground">Nhóm giải thưởng</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as PrizeCategory)}>
                  <SelectTrigger className="border-input bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description" className="mb-2 block text-[13px] text-muted-foreground">
                  Mô tả chương trình
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Mô tả ngắn về giải thưởng, thể lệ và thời gian quay số."
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="text-[15px] font-semibold">Cấu hình dải số</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="total" className="mb-2 block text-[13px] text-muted-foreground">
                  Tổng số dự thưởng
                </Label>
                <Input
                  id="total"
                  inputMode="numeric"
                  value={totalNumbers}
                  onChange={(event) => setTotalNumbers(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="font-mono-nums"
                />
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Số sẽ được đánh từ 0001 đến {formatNumber(totalNumbersValue || 0)} (4 chữ số).
                </p>
              </div>
              <div>
                <Label htmlFor="price" className="mb-2 block text-[13px] text-muted-foreground">
                  Giá mỗi số (điểm)
                </Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={ticketPrice}
                  onChange={(event) => setTicketPrice(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="font-mono-nums"
                />
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Doanh thu tối đa dự kiến: {formatPoints(grossRevenue)}
                </p>
              </div>
              <div>
                <Label htmlFor="start" className="mb-2 block text-[13px] text-muted-foreground">
                  Mở bán
                </Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className="font-mono-nums"
                />
              </div>
              <div>
                <Label htmlFor="end" className="mb-2 block text-[13px] text-muted-foreground">
                  Khoá bán
                </Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  className="font-mono-nums"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Cơ cấu giải thưởng</h2>
              <Button
                variant="subtle"
                size="sm"
                onClick={() =>
                  setTerms((prev) => [
                    ...prev,
                    { id: `giai-${prev.length + 1}`, label: `Giải ${prev.length + 1}`, quantity: 1, value: 500_000 },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm giải
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {terms.map((term, index) => (
                <div key={term.id} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1.2fr_auto]">
                  <Input
                    value={term.label}
                    onChange={(event) =>
                      setTerms((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Tên giải"
                  />
                  <Input
                    inputMode="numeric"
                    value={String(term.quantity)}
                    onChange={(event) =>
                      setTerms((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, quantity: Number(event.target.value.replace(/\D/g, "").slice(0, 4)) || 0 }
                            : item,
                        ),
                      )
                    }
                    className="font-mono-nums"
                    placeholder="Số lượng"
                  />
                  <Input
                    inputMode="numeric"
                    value={String(term.value)}
                    onChange={(event) =>
                      setTerms((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: Number(event.target.value.replace(/\D/g, "").slice(0, 9)) || 0 }
                            : item,
                        ),
                      )
                    }
                    className="font-mono-nums"
                    placeholder="Giá trị (điểm)"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xoá giải"
                    onClick={() => setTerms((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    disabled={terms.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-5" />
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Tổng giá trị giải thưởng</span>
              <span className="font-mono-nums font-bold text-gold">{formatPoints(totalPrizeValue)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="text-[15px] font-semibold">Tư liệu giải thưởng</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Ảnh tối đa 10MB, video tối đa 100MB. Tệp được kiểm tra dung lượng trước khi tải lên và
              hiển thị tên; production nên lưu trên object storage.
            </p>

            <label
              htmlFor="media"
              className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input/70 bg-secondary/20 px-6 py-10 text-center transition-colors duration-150 ease-standard hover:border-gold/50 hover:bg-secondary/40"
            >
              <UploadCloud className="h-7 w-7 text-gold" />
              <span className="text-[13px] font-medium">Kéo thả hoặc bấm để chọn tệp</span>
              <span className="text-[12px] text-muted-foreground">PNG, JPG, MP4 — tối đa 10MB / 100MB</span>
              <input
                id="media"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            {media ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/30 px-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  {media.kind === "video" ? (
                    <Film className="h-4 w-4 shrink-0 text-gold" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-gold" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{media.name}</span>
                    <span className="font-mono-nums block text-[11px] text-muted-foreground">
                      {(media.size / 1024 / 1024).toFixed(2)} MB · {media.kind === "video" ? "video" : "ảnh"}
                    </span>
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setMedia(null)}>
                  Gỡ
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-xl border border-gold/25 bg-gradient-panel p-6 shadow-e2">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Tóm tắt</h2>
              <Badge variant="soft">{nextCode}</Badge>
            </div>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Giá mỗi số
                </dt>
                <dd className="font-mono-nums">{formatPoints(priceValue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tổng số vé</dt>
                <dd className="font-mono-nums">{formatNumber(totalNumbersValue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Giá trị giải thưởng</dt>
                <dd className="font-mono-nums text-gold">{formatPoints(totalPrizeValue)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Thời gian bán
                </dt>
                <dd className="font-mono-nums text-[12px]">
                  {endAt && startAt
                    ? `${Math.max(
                        1,
                        Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 86_400_000),
                      )} ngày`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-e1">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <KeyRound className="h-4 w-4 text-gold" />
              Chuỗi bí mật & commitment
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Chuỗi bí mật chỉ lưu ở phía máy chủ. Commitment được công bố ngay khi tạo chương trình để chứng
              minh kết quả chưa bị chọn trước.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="secret" className="mb-2 block text-[12px] text-muted-foreground">
                  Server secret
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    className="font-mono-nums text-[12px]"
                  />
                  <Button variant="outline" size="icon" onClick={() => setSecret(randomSecret())} aria-label="Tạo lại chuỗi bí mật">
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <HashChip label="Commitment sẽ công bố" value={commitHash} />
            </div>
          </div>

          {errors.length > 0 ? (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-warning">
                <AlertTriangle className="h-4 w-4" />
                Cần bổ sung trước khi công bố
              </p>
              <ul className="mt-3 space-y-2">
                {errors.map((error) => (
                  <li key={error} className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-verified/35 bg-verified/10 p-5 text-[13px] text-muted-foreground">
              Thông tin hợp lệ. Bạn có thể lưu nháp hoặc công bố chương trình để bắt đầu mở bán.
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={() => submit(true)} size="lg">
              <UploadCloud className="h-4 w-4" />
              Công bố & mở bán
            </Button>
            <Button variant="outline" onClick={() => submit(false)}>
              <Save className="h-4 w-4" />
              Lưu nháp
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminProgramCreatePage;
