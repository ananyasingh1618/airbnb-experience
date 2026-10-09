"use client";

import { Minus, Plus } from "lucide-react";
import { plural } from "@/lib/format";

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
  hint?: string;
}

export function GuestSelector({ value, onChange, min = 1, max = 16, label = "Guests", hint }: Props) {
  const stepBtn =
    "grid size-8 place-items-center rounded-full border border-line-strong text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line-strong disabled:hover:text-ink-2";
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-ink-2">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={stepBtn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Decrease ${label.toLowerCase()}`}>
          <Minus className="size-4" />
        </button>
        <output aria-live="polite" className="w-6 text-center tabular-nums" aria-label={plural(value, "guest")}>
          {value}
        </output>
        <button type="button" className={stepBtn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`Increase ${label.toLowerCase()}`}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
