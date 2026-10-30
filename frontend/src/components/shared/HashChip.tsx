import { useState } from "react";
import { Check, Copy, Fingerprint } from "lucide-react";

import { shortHash } from "@/lib/draw";
import { cn } from "@/lib/utils";

interface HashChipProps {
  label: string;
  value: string;
  className?: string;
  tone?: "default" | "verified";
}

export function HashChip({ label, value, className, tone = "default" }: HashChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card/60 px-3 py-2.5",
        tone === "verified" ? "border-verified/30" : "border-border",
        className,
      )}
    >
      <Fingerprint
        className={cn("h-4 w-4 shrink-0", tone === "verified" ? "text-verified-text" : "text-gold")}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
        <div className="font-mono-nums truncate text-[13px] text-foreground" title={value}>
          {shortHash(value, 14, 10)}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Sao chép ${label}`}
        className="rounded-sm p-1.5 text-muted-foreground transition-colors duration-150 ease-standard hover:bg-secondary hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-verified-text" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
