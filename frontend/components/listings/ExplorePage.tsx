"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, SlidersHorizontal, X } from "lucide-react";
import { FilterDialog } from "@/components/search/FilterDialog";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { useFavorites } from "@/lib/favorites";
import { CATEGORY_LABELS, formatDate, money } from "@/lib/format";
import { filterCount, guestSummary, parseSearch, toApiParams, toQuery, type SearchState } from "@/lib/search";

const ResultsMap = dynamic(() => import("@/components/listings/ResultsMap"), { ssr: false, loading: () => <div className="skeleton size-full" /> });

const PAGE_SIZE = 12;
const SORTS = [
  ["recommended", "Recommended"],
  ["rating", "Top rated"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["newest", "Newest"],
];
/** Quick amenity chips under the header, like Airbnb's results page. */
const QUICK_AMENITIES = ["Kitchen", "Free parking", "Wifi", "Air conditioning", "TV", "Pets allowed", "Washer", "Pool", "Hot tub", "Fireplace"];

export function ExplorePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const state = useMemo(() => parseSearch(sp), [sp]);
  const { user, ready } = useDemoUser();
  const { version } = useFavorites();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  // Only "saved only" results depend on favourite changes; other views keep their data.
  const favDep = state.favorites ? version : 0;
  const results = useAsync(
    ready ? () => api.listings(toApiParams(state, PAGE_SIZE)) : null,
    [ready, user?.id, sp.toString(), favDep],
  );
  const meta = useAsync(() => api.meta(), []);

  const update = useCallback(
    (patch: Partial<SearchState>) => {
      const next = { ...state, page: 1, ...patch };
      router.push(`/?${toQuery(next).toString()}`, { scroll: false });
    },
    [router, state],
  );
  const reset = () => router.push("/?homes=1", { scroll: false });
  const toggleAmenity = (a: string) => update({ amenities: state.amenities.includes(a) ? state.amenities.filter((x) => x !== a) : [...state.amenities, a] });

  useEffect(() => {
    if (state.page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.page]);

  const chips: { label: string; clear: () => void }[] = [];
  if (state.check_in && state.check_out) chips.push({ label: `${formatDate(state.check_in, "MMM d")} – ${formatDate(state.check_out, "MMM d")}`, clear: () => update({ check_in: "", check_out: "" }) });
  if (state.guests || state.infants || state.pets) chips.push({ label: guestSummary(state.guests, state.infants, state.pets), clear: () => update({ guests: 0, children: 0, infants: 0, pets: 0 }) });
  if (state.category) chips.push({ label: CATEGORY_LABELS[state.category] ?? state.category, clear: () => update({ category: "" }) });
  if (state.min_price || state.max_price)
    chips.push({ label: `${state.min_price ? money(Number(state.min_price) * 100) : "$0"} – ${state.max_price ? money(Number(state.max_price) * 100) : "any"}`, clear: () => update({ min_price: "", max_price: "" }) });
  if (state.property_type) chips.push({ label: state.property_type, clear: () => update({ property_type: "" }) });
  if (state.favorites) chips.push({ label: "Wishlist", clear: () => update({ favorites: false }) });

  const data = results.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const carry = new URLSearchParams({
    ...(state.check_in && state.check_out ? { check_in: state.check_in, check_out: state.check_out } : {}),
    ...(state.guests ? { guests: String(state.guests) } : {}),
    ...(state.infants ? { infants: String(state.infants) } : {}),
    ...(state.pets ? { pets: String(state.pets) } : {}),
  }).toString();
  const nFilters = filterCount(state);
  const where = state.q.trim();
  const heading = state.favorites ? "Wishlist" : data ? `${data.total} ${data.total === 1 ? "home" : "homes"}${where ? ` in ${where}` : ""}` : "Finding homes…";

  const chipBtn = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${on ? "border-ink bg-[#f7f7f7] ring-1 ring-ink" : "border-[#ddd] bg-white hover:border-ink"}`;

  return (
    <div>
      {/* chips row: sits directly under the compact header, like the reference */}
      <div className="sticky top-[var(--header-h,96px)] z-30 border-b border-[#ebebeb] bg-gradient-to-b from-white to-[#f7f7f7]">
        <div className="scrollbar-none mx-auto flex max-w-[1760px] items-center gap-3 overflow-x-auto px-4 py-2.5 sm:px-6 md:px-10 md:[&>:first-child]:ml-auto md:[&>:last-child]:mr-auto xl:px-12">
          <button onClick={() => setFiltersOpen(true)} className={`${chipBtn(nFilters > 0)} flex items-center gap-2`}>
            <SlidersHorizontal className="size-4" aria-hidden />Filters{nFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink text-xs text-white">{nFilters}</span>}
          </button>
          <span aria-hidden className="h-6 w-px shrink-0 bg-[#ddd]" />
          {QUICK_AMENITIES.map((a) => (
            <button key={a} aria-pressed={state.amenities.includes(a)} onClick={() => toggleAmenity(a)} className={chipBtn(state.amenities.includes(a))}>{a}</button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1760px] px-4 pb-4 pt-6 sm:px-6 md:px-10 xl:px-12" aria-live="polite">
        <div className="xmap:grid xmap:grid-cols-[minmax(0,1fr)_658px] xmap:gap-12">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[22px] font-medium leading-7 tracking-[-0.02em]">{heading}</h1>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-ink-2">Sort</span>
                <select value={state.sort} onChange={(e) => update({ sort: e.target.value })} className="rounded-full border border-[#ddd] bg-white py-2 pl-3 pr-8 text-sm font-medium outline-none transition-colors hover:border-ink focus-visible:outline-2">
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>

            {chips.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
                {chips.map((c) => (
                  <button key={c.label} onClick={c.clear} className="group flex items-center gap-1.5 rounded-full border border-[#ddd] bg-white py-1.5 pl-3.5 pr-2.5 text-sm transition-colors hover:border-ink">
                    {c.label}<X className="size-3.5 text-ink-2 group-hover:text-ink" aria-label="Remove filter" />
                  </button>
                ))}
                <button onClick={reset} className="ml-1 text-sm font-semibold underline">Reset filters</button>
              </div>
            )}

            {results.error ? (
              <ErrorState message={results.error.message} onRetry={results.reload} />
            ) : !data ? (
              <ListingGridSkeleton count={6} />
            ) : data.items.length === 0 ? (
              state.favorites ? (
                <EmptyState icon={<Heart className="size-6" />} title="No saved stays yet" body="Tap the heart on any stay to keep it here." action={{ label: "Explore stays", onClick: reset }} />
              ) : (
                <EmptyState title="No exact matches" body="Try changing or removing some of your filters or adjusting your search area." action={{ label: "Remove all filters", onClick: reset }} />
              )
            ) : (
              <div className={results.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <ListingGrid items={data.items} carry={carry} onHover={setHovered} />
                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-4">
                    <button disabled={state.page <= 1} onClick={() => update({ page: state.page - 1 })} className="flex items-center gap-1 rounded-full border border-[#ddd] px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-[#ddd]"><ChevronLeft className="size-4" />Previous</button>
                    <span className="text-sm text-ink-2">Page {state.page} of {totalPages}</span>
                    <button disabled={state.page >= totalPages} onClick={() => update({ page: state.page + 1 })} className="flex items-center gap-1 rounded-full border border-[#ddd] px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-[#ddd]">Next<ChevronRight className="size-4" /></button>
                  </nav>
                )}
              </div>
            )}
          </div>

          <aside className="hidden xmap:block" aria-label="Map">
            <div className="sticky top-[calc(var(--header-h,96px)+77px)] h-[calc(100vh-var(--header-h,96px)-77px-24px)] min-h-[420px] overflow-hidden rounded-[20px] border border-[#ebebeb]">
              <ResultsMap items={data?.items ?? []} hoveredId={hovered} onOpen={(id) => router.push(`/listings/${id}${carry ? `?${carry}` : ""}`)} />
            </div>
          </aside>
        </div>
      </section>

      <FilterDialog open={filtersOpen} onClose={() => setFiltersOpen(false)} state={state} meta={meta.data} onApply={update} />
    </div>
  );
}
