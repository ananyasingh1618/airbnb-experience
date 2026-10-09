"use client";

import { useMemo } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import { fromISO, toISO } from "@/lib/format";
import type { BookedRange } from "@/types";

export interface DateValue { check_in: string; check_out: string }

interface Props {
  value: DateValue;
  onChange: (v: DateValue) => void;
  /** Confirmed bookings from the API: their nights are unavailable. */
  booked?: BookedRange[];
  months?: 1 | 2;
}

/**
 * Range picker. Nights inside [check_in, check_out) of an existing booking are disabled, so a
 * new stay may start on someone's checkout day and end on someone's check-in day — exactly
 * the half-open interval rule the backend enforces.
 */
export function DateRangePicker({ value, onChange, booked = [], months = 2 }: Props) {
  const today = startOfDay(new Date());
  const from = value.check_in ? fromISO(value.check_in) : undefined;
  const to = value.check_out ? fromISO(value.check_out) : undefined;

  const ranges = useMemo(
    () => booked.map((b) => ({ ci: fromISO(b.check_in).getTime(), co: fromISO(b.check_out).getTime() })),
    [booked],
  );
  const isBookedNight = (t: number) => ranges.some((r) => t >= r.ci && t < r.co);
  // The first booked check-in after the chosen start caps how far the stay can extend.
  const cap = useMemo(() => {
    if (!from || to) return Infinity;
    const later = ranges.filter((r) => r.ci >= from.getTime()).map((r) => r.ci);
    return later.length ? Math.min(...later) : Infinity;
  }, [from, to, ranges]);

  const isDisabled = (d: Date) => {
    const t = startOfDay(d).getTime();
    if (t < today.getTime()) return true;
    if (from && !to && t > from.getTime()) return t > cap; // choosing an end date
    return isBookedNight(t);
  };

  const select = (_r: DateRange | undefined, trigger: Date) => {
    const t = startOfDay(trigger);
    if (!from || to || t <= from) return onChange({ check_in: toISO(t), check_out: "" });
    onChange({ check_in: value.check_in, check_out: toISO(t) });
  };

  return (
    <DayPicker
      mode="range"
      selected={from ? { from, to } : undefined}
      onSelect={select}
      numberOfMonths={months}
      navLayout="around"
      formatters={{ formatWeekdayName: (d: Date) => format(d, "EEEEE") }}
      disabled={isDisabled}
      startMonth={startOfMonth(today)}
      endMonth={addDays(today, 540)}
      defaultMonth={from ?? today}
      min={1}
    />
  );
}
