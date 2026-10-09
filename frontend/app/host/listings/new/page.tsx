"use client";

import { ErrorState, Skeleton } from "@/components/ui/States";
import { HostGate } from "@/components/host/HostGate";
import { ListingForm } from "@/components/host/ListingForm";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";

export default function NewListingPage() {
  const meta = useAsync(() => api.meta(), []);
  return (
    <HostGate>
      {() => (
        <div className="mx-auto max-w-[760px] px-4 pb-10 pt-10 sm:px-6">
          <h1 className="mb-8 text-[32px] font-semibold">Create a listing</h1>
          {meta.error ? <ErrorState message={meta.error.message} onRetry={meta.reload} /> : !meta.data ? <Skeleton className="h-96" /> : <ListingForm meta={meta.data} />}
        </div>
      )}
    </HostGate>
  );
}
