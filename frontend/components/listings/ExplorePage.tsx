"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronLeft, ChevronRight, Heart, SlidersHorizontal, X } from "lucide-react";
import { CategoryNavigation } from "@/components/search/CategoryNavigation";
import { FilterDialog } from "@/components/search/FilterDialog";
import { ListingGrid, ListingGridSkeleton } from "@/components/listings/ListingGrid";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { useFavorites } from "@/lib/favorites";
import { CATEGORY_LABELS, formatDate, money } from "@/lib/format";
import { filterCount, parseSearch, toApiParams, toQuery, type SearchState } from "@/lib/search";

const PAGE_SIZE = 12;
const SORTS = [
  ["recommended", "Recommended"],
  ["rating", "Top rated"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["newest", "Newest"],
];

export function ExplorePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const state = useMemo(() => parseSearch(sp), [sp]);
  const { user, ready } = useDemoUser();
  const { version } = useFavorites();
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const reset = () => router.push("/", { scroll: false });

  // Scroll to top of results when the page number changes.
  useEffect(() => {
    if (state.page > 1) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.page]);

  const chips: { label: string; clear: () => void }[] = [];
  if (state.q) chips.push({ label: `“${state.q}”`, clear: () => update({ q: "" }) });
  if (state.check_in && state.check_out) chips.push({ label: `${formatDate(state.check_in, "MMM d")} – ${formatDate(state.check_out, "MMM d")}`, clear: () => update({ check_in: "", check_out: "" }) });
  if (state.guests) chips.push({ label: `${state.guests}+ guests`, clear: () => update({ guests: 0 }) });
  if (state.category) chips.push({ label: CATEGORY_LABELS[state.category] ?? state.category, clear: () => update({ category: "" }) });
  if (state.min_price || state.max_price)
    chips.push({
      label: `${state.min_price ? money(Number(state.min_price) * 100) : "$0"} – ${state.max_price ? money(Number(state.max_price) * 100) : "any"}`,
      clear: () => update({ min_price: "", max_price: "" }),
    });
  if (state.property_type) chips.push({ label: state.property_type, clear: () => update({ property_type: "" }) });
  state.amenities.forEach((a) => chips.push({ label: a, clear: () => update({ amenities: state.amenities.filter((x) => x !== a) }) }));
  if (state.favorites) chips.push({ label: "Saved stays", clear: () => update({ favorites: false }) });

  const data = results.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const carry = new URLSearchParams(
    state.check_in && state.check_out ? { check_in: state.check_in, check_out: state.check_out, ...(state.guests ? { guests: String(state.guests) } : {}) } : state.guests ? { guests: String(state.guests) } : {},
  ).toString();
  const nFilters = filterCount(state);

  return (
    <div>
      <div className="sticky top-[var(--header-h,73px)] z-30 bg-bg">
        <div className="mx-auto flex max-w-[1760px] items-start gap-4 px-4 pt-4 sm:px-6 lg:px-10">
          <CategoryNavigation value={state.category} onChange={(category) => update({ category })} />
          <button
            onClick={() => setFiltersOpen(true)}
            className="hidden shrink-0 items-center gap-2 rounded-xl border border-line-strong px-4 py-3 text-sm font-medium transition-colors hover:border-ink hover:bg-surface sm:flex"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {nFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink text-xs text-white">{nFilters}</span>}
          </button>
        </div>
        <div className="border-b border-line" />
      </div>

      <section className="mx-auto max-w-[1760px] px-4 pb-4 pt-6 sm:px-6 lg:px-10" aria-live="polite">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="mr-auto text-sm text-ink-2">
            {results.loading && !data ? "Finding stays…" : data ? <><span className="font-semibold text-ink">{data.total}</span> {data.total === 1 ? "stay" : "stays"}</> : ""}
          </p>
          <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium sm:hidden">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters{nFilters > 0 ? ` · ${nFilters}` : ""}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <ArrowUpDown className="size-4 text-ink-2" aria-hidden />
            <span className="sr-only">Sort by</span>
            <select
              value={state.sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="rounded-full border border-line-strong bg-bg py-2 pl-3 pr-8 text-sm font-medium outline-none transition-colors hover:border-ink focus-visible:outline-2"
            >
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((c) => (
              <button key={c.label} onClick={c.clear} className="group flex items-center gap-1.5 rounded-full border border-line-strong bg-bg py-1.5 pl-3.5 pr-2.5 text-sm transition-colors hover:border-ink">
                {c.label}
                <X className="size-3.5 text-ink-2 group-hover:text-ink" aria-label="Remove filter" />
              </button>
            ))}
            <button onClick={reset} className="ml-1 text-sm font-semibold underline">Reset filters</button>
          </div>
        )}

        {results.error ? (
          <ErrorState message={results.error.message} onRetry={results.reload} />
        ) : !data ? (
          <ListingGridSkeleton count={8} />
        ) : data.items.length === 0 ? (
          state.favorites ? (
            <EmptyState icon={<Heart className="size-6" />} title="No saved stays yet" body="Tap the heart on any stay to keep it here." action={{ label: "Explore stays", onClick: reset }} />
          ) : (
            <EmptyState title="No stays match your search" body="Try changing or removing some filters, or search a different destination or dates." action={{ label: "Reset filters", onClick: reset }} />
          )
        ) : (
          <div className={results.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ListingGrid items={data.items} carry={carry} />
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-4">
                <button disabled={state.page <= 1} onClick={() => update({ page: state.page - 1 })} className="flex items-center gap-1 rounded-full border border-line-strong px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong">
                  <ChevronLeft className="size-4" />Previous
                </button>
                <span className="text-sm text-ink-2">Page {state.page} of {totalPages}</span>
                <button disabled={state.page >= totalPages} onClick={() => update({ page: state.page + 1 })} className="flex items-center gap-1 rounded-full border border-line-strong px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong">
                  Next<ChevronRight className="size-4" />
                </button>
              </nav>
            )}
          </div>
        )}
      </section>

      <FilterDialog open={filtersOpen} onClose={() => setFiltersOpen(false)} state={state} meta={meta.data} onApply={update} />
    </div>
  );
}

