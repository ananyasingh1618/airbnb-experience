import { Suspense } from "react";
import { ExplorePage } from "@/components/listings/ExplorePage";
import { ListingGridSkeleton } from "@/components/listings/ListingGrid";

export default function Home() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1760px] px-4 pt-24 sm:px-6 lg:px-10"><ListingGridSkeleton /></div>}>
      <ExplorePage />
    </Suspense>
  );
}
