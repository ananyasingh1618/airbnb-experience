"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ListingDetails } from "@/components/listings/ListingDetails";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";

function Page() {
  const { id } = useParams<{ id: string }>();
  const { ready, user } = useDemoUser();
  const { data, error, loading, reload } = useAsync(ready ? () => api.listing(id) : null, [id, ready, user?.id]);

  if (error?.status === 404 || (error && error.code === "listing_not_found"))
    return <EmptyState title="We couldn't find that listing" body="It may have been removed by its host." action={{ label: "Back to explore", href: "/" }} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !data)
    return (
      <div className="mx-auto max-w-[1280px] px-4 pt-10 sm:px-6 lg:px-10">
        <Skeleton className="mb-5 h-8 w-2/3" />
        <Skeleton className="aspect-[2.2/1] w-full rounded-2xl" />
      </div>
    );
  return <ListingDetails listing={data} />;
}

export default function ListingPage() {
  return <Suspense><Page /></Suspense>;
}
