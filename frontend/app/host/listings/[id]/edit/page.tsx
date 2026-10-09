"use client";

import { useParams } from "next/navigation";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { HostGate } from "@/components/host/HostGate";
import { ListingForm } from "@/components/host/ListingForm";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";

function Edit({ hostId }: { hostId: number }) {
  const { id } = useParams<{ id: string }>();
  const listing = useAsync(() => api.listing(id), [id]);
  const meta = useAsync(() => api.meta(), []);
  const err = listing.error ?? meta.error;
  if (listing.error?.status === 404) return <EmptyState title="Listing not found" action={{ label: "Back to dashboard", href: "/host" }} />;
  if (err) return <ErrorState message={err.message} onRetry={() => { listing.reload(); meta.reload(); }} />;
  if (!listing.data || !meta.data) return <Skeleton className="h-96" />;
  if (listing.data.host.id !== hostId)
    return <EmptyState title="That's not your listing" body="You can only edit listings owned by the active host account." action={{ label: "Back to dashboard", href: "/host" }} />;
  return <ListingForm meta={meta.data} listing={listing.data} />;
}

export default function EditListingPage() {
  return (
    <HostGate>
      {(host) => (
        <div className="mx-auto max-w-[760px] px-4 pb-10 pt-10 sm:px-6">
          <h1 className="mb-8 text-[32px] font-semibold">Edit listing</h1>
          <Edit hostId={host.id} />
        </div>
      )}
    </HostGate>
  );
}
