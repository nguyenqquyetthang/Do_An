import { ArrowRight, Check, Lock, Minus } from "lucide-react";

import type { TicketCellState } from "@/data/types";
import { formatTicketNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const stateClasses: Record<TicketCellState, string> = {
  available:
    "border border-ticket-available-border bg-ticket-available-bg text-ticket-available-fg hover:border-primary hover:text-foreground hover:shadow-glow-gold",
  mine: "border border-transparent bg-ticket-mine-bg font-bold text-ticket-mine-fg shadow-glow-gold",
  other:
    "pattern-other cursor-not-allowed border border-dashed border-ticket-other-border bg-ticket-other-bg text-ticket-other-fg",
  sold: "pattern-sold cursor-not-allowed border border-transparent bg-ticket-sold-bg text-ticket-sold-fg",
  unavailable:
    "pattern-off cursor-not-allowed border border-dashed border-ticket-off-border bg-ticket-off-bg text-ticket-off-fg opacity-80",
};

const stateLabels: Record<TicketCellState, string> = {
  available: "còn trống",
  mine: "bạn đang giữ",
  other: "người khác đang giữ",
  sold: "đã bán",
  unavailable: "không khả dụng",
};

interface NumberGridProps {
  numbers: number[];
  numberLength?: number;
  stateOf: (value: number) => TicketCellState;
  selected?: number[];
  onToggle?: (value: number) => void;
  onBlocked?: (value: number, state: TicketCellState) => void;
}

export function NumberGrid({
  numbers,
  numberLength = 4,
  stateOf,
  selected = [],
  onToggle,
  onBlocked,
}: NumberGridProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2" role="grid" aria-label="Bàn chọn số">
      {numbers.map((value) => {
        const baseState = stateOf(value);
        const isSelected = selected.includes(value);
        const state: TicketCellState = isSelected ? "mine" : baseState;
        const interactive = state === "available" || (state === "mine" && isSelected);

        return (
          <button
            key={value}
            type="button"
            role="gridcell"
            aria-label={`Số ${formatTicketNumber(value, numberLength)} — ${
              isSelected ? "bạn đang chọn" : stateLabels[state]
            }`}
            aria-pressed={isSelected}
            disabled={!interactive}
            onClick={() => {
              if (interactive) onToggle?.(value);
              else onBlocked?.(value, state);
            }}
            className={cn(
              "relative flex h-11 items-center justify-center rounded-cell text-[13px] transition-all duration-150 ease-standard sm:h-12 sm:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              stateClasses[state],
              isSelected && "animate-pop ring-2 ring-ticket-mine-ring ring-offset-2 ring-offset-background",
            )}
          >
            <span className="font-mono-nums">{formatTicketNumber(value, numberLength)}</span>
            {state === "mine" ? (
              <Check className="absolute right-1 top-1 h-3 w-3" strokeWidth={3} aria-hidden />
            ) : null}
            {state === "other" ? (
              <Lock className="absolute right-1 top-1 h-3 w-3" aria-hidden strokeWidth={2.5} />
            ) : null}
            {state === "sold" ? (
              <span className="absolute bottom-1 right-1.5 h-1 w-1 rounded-full bg-ticket-sold-fg" aria-hidden />
            ) : null}
            {state === "unavailable" ? (
              <Minus className="absolute h-4 w-4 opacity-70" aria-hidden strokeWidth={3} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

const legendItems: { state: TicketCellState; label: string }[] = [
  { state: "available", label: "Còn trống" },
  { state: "mine", label: "Bạn đang giữ" },
  { state: "other", label: "Người khác đang giữ" },
  { state: "sold", label: "Đã bán" },
  { state: "unavailable", label: "Không khả dụng" },
];

export function TicketLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {legendItems.map((item) => (
        <li key={item.state} className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span
            className={cn(
              "flex h-5 w-7 items-center justify-center rounded-[6px] text-[9px] font-bold",
              stateClasses[item.state],
            )}
            aria-hidden
          >
            {item.state === "mine" ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            {item.state === "other" ? <Lock className="h-3 w-3" strokeWidth={2.5} /> : null}
            {item.state === "sold" ? <span className="h-1.5 w-1.5 rounded-full bg-ticket-sold-fg" /> : null}
            {item.state === "unavailable" ? <Minus className="h-3 w-3" strokeWidth={3} /> : null}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function SelectionSummary({ selected, onRemove }: { selected: number[]; onRemove: (value: number) => void }) {
  if (selected.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-input/60 px-3 py-4 text-center text-[13px] text-muted-foreground">
        Chưa chọn số nào. Bấm vào ô trống để chọn số dự thưởng.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onRemove(value)}
          className="animate-pop group flex items-center gap-1.5 rounded-cell border border-gold/40 bg-primary/12 px-2.5 py-1.5 font-mono-nums text-[13px] font-semibold text-gold transition-colors duration-150 ease-standard hover:bg-primary/20"
        >
          {formatTicketNumber(value)}
          <ArrowRight className="h-3 w-3 rotate-45 opacity-60 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
