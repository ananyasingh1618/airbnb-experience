"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { HostGate } from "@/components/host/HostGate";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { btn } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatRange, money, plural } from "@/lib/format";
import type { HostListing, User } from "@/types";

function Dashboard({ host }: { host: User }) {
  const { toast } = useToast();
  const listings = useAsync(() => api.hostListings(), [host.id]);
  const bookings = useAsync(() => api.hostBookings(), [host.id]);
  const [target, setTarget] = useState<HostListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const close = () => { setTarget(null); setBlocked(null); };
  const remove = async () => {
    if (!target || deleting) return;
    setDeleting(true);
    try {
      await api.deleteListing(target.id);
      toast("Listing deleted", "success");
      close();
      listings.reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setBlocked(e.message);
      else toast(e instanceof Error ? e.message : "Couldn't delete the listing", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-10 sm:px-6 lg:px-10">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={host.name} src={host.avatar_url} size={56} />
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Host dashboard</h1>
            <p className="text-ink-2">{host.name} · demo host account</p>
          </div>
        </div>
        <Link href="/host/listings/new" className={btn("brand")}><Plus className="size-4" />Create listing</Link>
      </header>

      <section aria-labelledby="mine">
        <h2 id="mine" className="mb-5 text-[22px] font-semibold">Your listings</h2>
        {listings.error ? <ErrorState message={listings.error.message} onRetry={listings.reload} /> : !listings.data ? (
          <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        ) : listings.data.length === 0 ? (
          <EmptyState title="You haven't listed anything yet" body="Create your first listing and it will appear on Explore right away." action={{ label: "Create listing", href: "/host/listings/new" }} />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {listings.data.map((l) => (
              <li key={l.id} className="flex gap-4 rounded-2xl border border-line p-3">
                <Link href={`/listings/${l.id}`} className="relative aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-44" aria-label={`View ${l.title}`}>
                  <Image src={l.images[0]} alt={l.title} fill sizes="176px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-semibold">{l.title}</h3>
                    <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success">Published</span>
                  </div>
                  <p className="text-sm text-ink-2">{l.location}</p>
                  <p className="mt-1 text-sm">{money(l.price_per_night_cents)} / night · {plural(l.booking_count, "booking")}{l.upcoming_booking_count ? ` (${l.upcoming_booking_count} upcoming)` : ""}</p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Link href={`/host/listings/${l.id}/edit`} className={btn("outline", "px-3.5 py-2 text-sm")}><Pencil className="size-3.5" />Edit</Link>
                    <button onClick={() => setTarget(l)} className={btn("danger", "px-3.5 py-2 text-sm")}><Trash2 className="size-3.5" />Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="res" className="mt-14">
        <h2 id="res" className="mb-5 text-[22px] font-semibold">Reservations</h2>
        {bookings.error ? <ErrorState message={bookings.error.message} onRetry={bookings.reload} /> : !bookings.data ? <Skeleton className="h-32" /> : bookings.data.length === 0 ? (
          <p className="rounded-2xl bg-surface p-6 text-ink-2">No reservations yet for your listings.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface text-ink-2"><tr><th className="px-4 py-3 font-medium">Guest</th><th className="px-4 py-3 font-medium">Listing</th><th className="px-4 py-3 font-medium">Dates</th><th className="px-4 py-3 font-medium">Guests</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
              <tbody>
                {bookings.data.map((b) => (
                  <tr key={b.id} className="border-t border-line">
                    <td className="px-4 py-3"><span className="flex items-center gap-2"><Avatar name={b.guest.name} src={b.guest.avatar_url} size={28} />{b.guest.name}</span></td>
                    <td className="max-w-[220px] truncate px-4 py-3">{b.listing_title}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatRange(b.check_in, b.check_out)}</td>
                    <td className="px-4 py-3">{b.guests}</td>
                    <td className="px-4 py-3 tabular-nums">{money(b.total_price_cents, { forceCents: true })}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.status === "cancelled" ? "bg-surface-2 text-ink-2" : "bg-success-bg text-success"}`}>{b.status === "cancelled" ? "Cancelled" : b.is_upcoming ? "Confirmed" : "Completed"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={target !== null} onClose={close} title="Delete listing">
        <div className="p-6">
          {blocked ? (
            <>
              <p role="alert" className="rounded-xl bg-danger-bg p-4 text-danger">{blocked}</p>
              <button onClick={close} className={btn("dark", "mt-5")}>Got it</button>
            </>
          ) : (
            <>
              <p>Delete <strong>{target?.title}</strong>? This removes it from Explore. Listings with booking history can&apos;t be deleted.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={remove} disabled={deleting} className={btn("danger", "bg-danger-bg")}>{deleting ? "Deleting…" : "Delete listing"}</button>
                <button onClick={close} className={btn("ghost")}>Keep it</button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default function HostPage() {
  return <HostGate>{(host) => <Dashboard host={host} />}</HostGate>;
}
