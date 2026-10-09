"use client";

import { Suspense, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Star } from "lucide-react";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { btn } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { formatRange, guestLabel } from "@/lib/format";
import { stayQuery, useStay } from "@/lib/stay";

function Checkout() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, user } = useDemoUser();
  const { stay, hasDates } = useStay();
  const listing = useAsync(ready ? () => api.listing(id) : null, [id, ready]);
  const quote = useAsync(
    ready && hasDates ? () => api.availability(id, { check_in: stay.check_in, check_out: stay.check_out, guests: stay.guests }) : null,
    [id, ready, stay.check_in, stay.check_out, stay.guests],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const back = `/listings/${id}?${stayQuery(stay)}`;

  if (!hasDates)
    return <EmptyState title="Choose your dates first" body="We need check-in and check-out dates before checkout." action={{ label: "Pick dates", href: back }} />;
  if (listing.error) return <ErrorState message={listing.error.message} onRetry={listing.reload} />;
  if (quote.error) return (
    <EmptyState title="These dates can't be booked" body={quote.error.message} action={{ label: "Change dates", href: back }} />
  );
  const l = listing.data;
  const a = quote.data;
  if (!l || !a?.quote)
    return <div className="mx-auto grid max-w-[1100px] gap-12 px-4 pt-12 md:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>;

  const confirm = async () => {
    if (submitting) return; // guards against double-clicks; the API is idempotent too
    setSubmitting(true);
    setError(null);
    try {
      const b = await api.createBooking({ listing_id: l.id, check_in: stay.check_in, check_out: stay.check_out, guests: stay.guests });
      router.push(`/booking-confirmation/${b.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "error", "Something went wrong."));
      setSubmitting(false);
    }
  };

  const conflict = error?.status === 409 || a.available === false;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      <Link href={back} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"><ArrowLeft className="size-4" />Edit trip</Link>
      <h1 className="mb-8 text-[32px] font-semibold">Confirm and pay</h1>
      <div className="grid gap-12 md:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <section aria-labelledby="trip">
            <h2 id="trip" className="mb-4 text-[22px] font-semibold">Your trip</h2>
            <dl className="space-y-4">
              <div className="flex justify-between"><div><dt className="font-medium">Dates</dt><dd className="text-ink-2">{formatRange(stay.check_in, stay.check_out)}</dd></div><Link href={back} className="font-semibold underline">Edit</Link></div>
              <div className="flex justify-between"><div><dt className="font-medium">Guests</dt><dd className="text-ink-2">{guestLabel(stay.guests, stay.infants, stay.pets)}</dd></div><Link href={back} className="font-semibold underline">Edit</Link></div>
            </dl>
          </section>
          <section aria-labelledby="pay" className="border-t border-line pt-8">
            <h2 id="pay" className="mb-1 text-[22px] font-semibold">Pay with</h2>
            <p className="mb-4 rounded-lg bg-[#f7f7f7] p-3 text-sm"><strong className="font-semibold">This is an independent educational demo, not Airbnb.</strong> Nothing is charged, no card or personal payment details are collected, and the reservation is stored only in a demo database.</p>
            <div className="flex items-center gap-3 rounded-xl border border-ink bg-surface p-4">
              <Lock className="size-5" aria-hidden />
              <div><p className="font-medium">Simulated payment</p><p className="text-sm text-ink-2">Paying as {user?.name ?? "demo guest"}</p></div>
            </div>
          </section>
          {(error || conflict) && (
            <div role="alert" className="rounded-xl border border-danger bg-danger-bg p-4 text-danger">
              <p className="font-semibold">{conflict ? "Those dates are no longer available" : "We couldn't complete your booking"}</p>
              <p className="mt-1 text-sm">{error?.message ?? a.reason}</p>
              {conflict && <Link href={back} className="mt-2 inline-block text-sm font-semibold underline">Choose different dates</Link>}
            </div>
          )}
          <button onClick={confirm} disabled={submitting || conflict} className={btn("brand", "w-full py-4 text-base")}>
            {submitting ? "Confirming…" : `Confirm and book (demo) · ${(a.quote.total_price_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
          </button>
          <p className="text-xs text-ink-2">By confirming you agree this is a simulated reservation stored in the demo database.</p>
        </div>

        <aside aria-label="Booking summary" className="h-fit rounded-2xl border border-line p-6 md:sticky md:top-28">
          <div className="mb-6 flex gap-4 border-b border-line pb-6">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              <SafeImage src={l.images[0]} alt={l.title} fill sizes="112px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-ink-2">{l.property_type}</p>
              <p className="line-clamp-2 font-medium">{l.title}</p>
              <p className="text-sm text-ink-2">{l.location}</p>
              {l.rating && <p className="mt-1 flex items-center gap-1 text-sm"><Star className="size-3 fill-ink" />{l.rating.toFixed(2)}</p>}
            </div>
          </div>
          <h2 className="mb-4 text-[22px] font-semibold">Price details</h2>
          <PriceBreakdown quote={a.quote} nightlyCents={l.price_per_night_cents} />
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense><Checkout /></Suspense>;
}
