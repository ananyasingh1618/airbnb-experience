import { money, plural } from "@/lib/format";
import type { Quote } from "@/types";

/** The only place the price table is rendered (listing page, checkout, confirmation). */
export function PriceBreakdown({ quote, nightlyCents }: { quote: Quote; nightlyCents?: number }) {
  const night = nightlyCents ?? Math.round(quote.nightly_subtotal_cents / quote.nights);
  const row = "flex justify-between gap-4";
  return (
    <dl className="space-y-3 text-[15px]">
      <div className={row}>
        <dt className="text-ink-2 underline decoration-dotted underline-offset-4">
          {money(night)} × {plural(quote.nights, "night")}
        </dt>
        <dd className="tabular-nums">{money(quote.nightly_subtotal_cents, { forceCents: true })}</dd>
      </div>
      <div className={row}>
        <dt className="text-ink-2">Cleaning fee</dt>
        <dd className="tabular-nums">{money(quote.cleaning_fee_cents, { forceCents: true })}</dd>
      </div>
      <div className={row}>
        <dt className="text-ink-2">Roamly service fee (10%)</dt>
        <dd className="tabular-nums">{money(quote.service_fee_cents, { forceCents: true })}</dd>
      </div>
      <div className={`${row} border-t border-line pt-4 text-base font-semibold`}>
        <dt>Total (USD)</dt>
        <dd className="tabular-nums">{money(quote.total_price_cents, { forceCents: true })}</dd>
      </div>
    </dl>
  );
}
