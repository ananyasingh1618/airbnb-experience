"use client";

import { Luggage } from "lucide-react";
import { TripCard } from "@/components/booking/TripCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import type { Booking } from "@/types";

export default function TripsPage() {
  const { ready, user } = useDemoUser();
  const { toast } = useToast();
  const { data, error, reload } = useAsync(ready && user ? () => api.myBookings() : null, [ready, user?.id]);

  const cancel = async (b: Booking) => {
    try {
      await api.cancelBooking(b.id);
      toast("Reservation cancelled — those dates are open again", "success");
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't cancel", "error");
    }
  };

  const upcoming = (data ?? []).filter((b) => b.is_upcoming).sort((a, b) => a.check_in.localeCompare(b.check_in));
  const past = (data ?? []).filter((b) => !b.is_upcoming);

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-10 pt-10 sm:px-6">
      <h1 className="text-[32px] font-semibold">Trips</h1>
      {user && <p className="mt-1 text-ink-2">Reservations for {user.name} (demo account)</p>}
      <div className="mt-8">
        {error ? <ErrorState message={error.message} onRetry={reload} /> : !data ? (
          <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon={<Luggage className="size-6" />} title="No trips booked… yet!" body="Time to dust off your bags and start planning your next adventure." action={{ label: "Start exploring", href: "/" }} />
        ) : (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <section aria-labelledby="up"><h2 id="up" className="mb-4 text-[22px] font-semibold">Upcoming</h2>
                <div className="space-y-4">{upcoming.map((b) => <TripCard key={b.id} booking={b} onCancel={cancel} />)}</div></section>
            )}
            {past.length > 0 && (
              <section aria-labelledby="past"><h2 id="past" className="mb-4 text-[22px] font-semibold">Past &amp; cancelled</h2>
                <div className="space-y-4">{past.map((b) => <TripCard key={b.id} booking={b} />)}</div></section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
