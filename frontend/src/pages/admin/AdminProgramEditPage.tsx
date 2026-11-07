import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { api } from "@/lib/api";
import { useLottery } from "@/store/lottery";

const AdminProgramEditPage = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { programs, currentUser } = useLottery();
  const program = programs.find((item) => item.id === programId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [draw, setDraw] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizeValue, setPrizeValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!program) return;
    setName(program.name);
    setDescription(program.description);
    setPrice(String(program.ticketPrice));
    setTotal(String(program.totalNumbers));
    setStart(program.startAt.slice(0, 16));
    setEnd(program.endAt.slice(0, 16));
    setDraw((program.drawnAt ?? program.endAt).slice(0, 16));
    setPrizeName(program.prizeName);
    setPrizeValue(String(program.prizeValue));
  }, [program]);

  if (!program || currentUser?.role !== "ORGANIZER") {
    return <div className="rounded-xl border border-border bg-card p-8">Không tìm thấy chương trình hoặc chương trình không còn được phép chỉnh sửa.</div>;
  }
  if (!["draft", "rejected"].includes(program.status)) {
    return <div className="rounded-xl border border-border bg-card p-8">Chương trình đã mở bán/đã quay nên các thông tin quan trọng đã bị khóa.</div>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.updateProgram(program.id, {
        programName: name,
        description,
        rules: program.rules.join("\n"),
        ticketPrice: Number(price),
        totalTickets: Number(total),
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        drawTime: new Date(draw).toISOString(),
        prizeName,
        prizeValue: Number(prizeValue),
      });
      toast.success("Đã lưu chương trình nháp.");
      navigate("/quan-tri/chuong-trinh");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu chương trình.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={submit} className="space-y-6">
    <SectionHeading eyebrow="Chỉnh sửa bản nháp" title={`Chỉnh sửa ${program.code}`} description="Chỉ bản nháp hoặc chương trình bị từ chối mới được thay đổi thông tin quan trọng." />
    <div className="grid gap-5 rounded-xl border border-border bg-card p-6 shadow-e1 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label>Tên chương trình</Label><Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div className="sm:col-span-2"><Label>Mô tả</Label><Textarea className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div><Label>Giá mỗi vé</Label><Input className="mt-2" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
      <div><Label>Tổng số vé</Label><Input className="mt-2" type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} required /></div>
      <div><Label>Thời gian bắt đầu</Label><Input className="mt-2" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required /></div>
      <div><Label>Thời gian kết thúc</Label><Input className="mt-2" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required /></div>
      <div><Label>Thời gian quay</Label><Input className="mt-2" type="datetime-local" value={draw} onChange={(e) => setDraw(e.target.value)} required /></div>
      <div><Label>Tên giải thưởng</Label><Input className="mt-2" value={prizeName} onChange={(e) => setPrizeName(e.target.value)} required /></div>
      <div><Label>Giá trị giải thưởng</Label><Input className="mt-2" type="number" min="0" value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} required /></div>
    </div>
    <Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? "Đang lưu..." : "Lưu bản nháp"}</Button>
  </form>;
};

export default AdminProgramEditPage;
