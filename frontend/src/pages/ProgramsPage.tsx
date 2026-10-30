import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgramCard } from "@/components/shared/ProgramCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useLottery } from "@/store/lottery";
import type { ProgramStatus } from "@/data/types";

type StatusFilter = "all" | "active" | "upcoming" | "finished";

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang diễn ra" },
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "finished", label: "Đã kết thúc" },
];

const matchesFilter = (status: ProgramStatus, filter: StatusFilter) => {
  if (filter === "all") return true;
  if (filter === "active") return status === "active";
  if (filter === "upcoming") return status === "upcoming" || status === "draft";
  return status === "closed" || status === "published";
};

const ProgramsPage = () => {
  const { programs } = useLottery();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("ending");

  const visible = useMemo(() => {
    const filtered = programs.filter((program) => {
      if (!matchesFilter(program.status, filter)) return false;
      if (!keyword.trim()) return true;
      const needle = keyword.trim().toLowerCase();
      return (
        program.name.toLowerCase().includes(needle) ||
        program.prizeName.toLowerCase().includes(needle) ||
        program.code.toLowerCase().includes(needle)
      );
    });

    return filtered.sort((a, b) => {
      if (sort === "prize") return b.prizeValue - a.prizeValue;
      if (sort === "price") return a.ticketPrice - b.ticketPrice;
      return new Date(a.endAt).getTime() - new Date(b.endAt).getTime();
    });
  }, [programs, filter, keyword, sort]);

  return (
    <div className="container py-10">
      <SectionHeading
        eyebrow="Danh sách chương trình"
        title="Tất cả chương trình quay số"
        description="Lọc theo trạng thái, giá trị giải thưởng và khoảng thời gian để tìm chương trình phù hợp."
      />

      <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-e1 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as StatusFilter)}>
          <TabsList className="h-auto flex-wrap gap-1 rounded-md bg-secondary/60 p-1">
            {statusTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-sm px-3.5 py-1.5 text-[13px] data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên hoặc mã chương trình"
              className="w-full pl-9 sm:w-72"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full border-input bg-card sm:w-56">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending">Sắp kết thúc</SelectItem>
              <SelectItem value="prize">Giá trị giải cao nhất</SelectItem>
              <SelectItem value="price">Giá mỗi số thấp nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-5 text-[13px] text-muted-foreground">
        Tìm thấy <span className="font-mono-nums font-semibold text-foreground">{visible.length}</span> chương
        trình
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-input/60 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold">Không có chương trình phù hợp</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Thử đổi bộ lọc trạng thái hoặc từ khoá tìm kiếm khác.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;
