"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExplorePage } from "@/components/listings/ExplorePage";
import { HomePage } from "@/components/listings/HomePage";
import { ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { isSearching, parseSearch } from "@/lib/search";

/** "/" is the carousel home page; any search/filter in the URL switches to the results grid. */
function Router() {
  const state = parseSearch(useSearchParams());
  return isSearching(state) ? <ExplorePage /> : <HomePage />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1760px] px-4 pt-24 sm:px-6 lg:px-10"><ListingGridSkeleton /></div>}>
      <Router />
    </Suspense>
  );
}
