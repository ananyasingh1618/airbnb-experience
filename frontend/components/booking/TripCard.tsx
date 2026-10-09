"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { formatRange, money, plural } from "@/lib/format";
import type { Booking } from "@/types";

export function TripCard({ booking: b, onCancel }: { booking: Booking; onCancel?: (b: Booking) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const cancelled = b.status === "cancelled";
  const canCancel = onCancel && b.status === "confirmed" && new Date(b.check_in) > new Date();

  return (
    <article className={`flex flex-col gap-5 rounded-2xl border border-line p-4 sm:flex-row ${cancelled ? "opacity-70" : ""}`}>
      <Link href={`/listings/${b.listing_id}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-56" aria-label={`Open ${b.listing_title}`}>
        {b.listing_image && <Image src={b.listing_image} alt={b.listing_title} fill sizes="(min-width:640px) 224px, 100vw" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{b.listing_title}</h3>
            <p className="text-ink-2">{b.listing_location}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${cancelled ? "bg-surface-2 text-ink-2" : b.is_upcoming ? "bg-success-bg text-success" : "bg-surface-2 text-ink"}`}>
            {cancelled ? "Cancelled" : b.is_upcoming ? "Confirmed" : "Completed"}
          </span>
        </div>
        <p className="mt-3 font-medium">{formatRange(b.check_in, b.check_out)}</p>
        <p className="text-sm text-ink-2">{plural(b.nights, "night")} · {plural(b.guests, "guest")} · Ref {b.reference}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <p className="text-lg font-semibold">{money(b.total_price_cents, { forceCents: true })} <span className="text-sm font-normal text-ink-2">total</span></p>
          <div className="flex gap-2">
            <Link href={`/booking-confirmation/${b.id}`} className={btn("outline", "px-4 py-2 text-sm")}>Details</Link>
            <Link href={`/listings/${b.listing_id}`} className={btn("outline", "px-4 py-2 text-sm")}>View listing</Link>
            {canCancel && !confirming && <button onClick={() => setConfirming(true)} className={btn("danger", "px-4 py-2 text-sm")}>Cancel</button>}
            {canCancel && confirming && (
              <button disabled={busy} onClick={async () => { setBusy(true); try { await onCancel(b); } finally { setBusy(false); setConfirming(false); } }} className={btn("danger", "bg-danger-bg px-4 py-2 text-sm")}>
                {busy ? "Cancelling…" : "Confirm cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
