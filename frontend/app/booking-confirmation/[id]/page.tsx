"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { btn } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { formatDate, plural } from "@/lib/format";

export default function Confirmation() {
  const { id } = useParams<{ id: string }>();
  const { ready, user } = useDemoUser();
  const { data: b, error, reload } = useAsync(ready ? () => api.booking(id) : null, [id, ready, user?.id]);

  if (error?.status === 404 || error?.status === 403)
    return <EmptyState title="We can't show that reservation" body="It doesn't exist, or it belongs to a different demo account." action={{ label: "Go to my trips", href: "/trips" }} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!b) return <div className="mx-auto max-w-[760px] px-4 pt-12"><Skeleton className="h-96" /></div>;

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-10 pt-12 sm:px-6">
      <div className="anim-slide mb-8 flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-success-bg text-success"><CheckCircle2 className="size-8" aria-hidden /></span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight">{b.status === "cancelled" ? "Reservation cancelled" : "You're booked!"}</h1>
          <p className="text-ink-2">Reservation <span className="font-semibold text-ink">{b.reference}</span> · demo booking, no payment taken</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        {b.listing_image && (
          <div className="relative aspect-[16/7] bg-surface-2">
            <Image src={b.listing_image} alt={b.listing_title} fill priority sizes="760px" className="object-cover" />
          </div>
        )}
        <div className="space-y-6 p-6">
          <div>
            <h2 className="text-xl font-semibold">{b.listing_title}</h2>
            <p className="text-ink-2">{b.listing_location} · hosted by {b.host_name}</p>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-y border-line py-5">
            <div><dt className="text-sm text-ink-2">Check-in</dt><dd className="font-medium">{formatDate(b.check_in, "EEE, MMM d")}</dd></div>
            <div><dt className="text-sm text-ink-2">Check-out</dt><dd className="font-medium">{formatDate(b.check_out, "EEE, MMM d")}</dd></div>
            <div><dt className="text-sm text-ink-2">Guests</dt><dd className="font-medium">{plural(b.guests, "guest")}</dd></div>
          </dl>
          <PriceBreakdown quote={b} />
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/trips" className={btn("dark")}>View my trips</Link>
        <Link href="/" className={btn("outline")}>Keep exploring</Link>
      </div>
    </div>
  );
}
