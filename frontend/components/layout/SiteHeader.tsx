"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConciergeBell, Globe, House, Sparkles } from "lucide-react";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { Logo } from "@/components/layout/Logo";
import { CompactSearch, SearchBar } from "@/components/search/SearchBar";
import { useToast } from "@/components/ui/Toast";
import { useClickOutside } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { isSearching, parseSearch } from "@/lib/search";

function Tabs() {
  const router = useRouter();
  const { toast } = useToast();
  const sp = useSearchParams();
  const pathname = usePathname();
  const homesActive = pathname === "/" && parseSearch(sp).homes;
  const allActive = pathname === "/" && !homesActive;
  const tab = (active: boolean) =>
    `group relative flex h-[66px] items-center gap-3 px-5 text-sm font-medium transition-colors ${active ? "text-ink" : "text-[#6c6c6c] hover:text-ink"}`;
  const underline = (active: boolean) => `absolute inset-x-3 bottom-0 h-0.5 rounded bg-ink transition-opacity ${active ? "opacity-100" : "opacity-0"}`;
  const soon = (name: string) => () => toast(`${name} aren't part of this demo — stays only.`, "info");
  return (
    <nav aria-label="Product" className="mx-auto flex w-fit items-center">
      <button className={tab(allActive)} aria-current={allActive ? "page" : undefined} onClick={() => router.push("/")}><Globe className="size-10" strokeWidth={1} aria-hidden />All<span className={underline(allActive)} /></button>
      <button className={tab(homesActive)} aria-current={homesActive ? "page" : undefined} onClick={() => router.push("/?homes=1")}><House className="size-10" strokeWidth={1} aria-hidden />Homes<span className={underline(homesActive)} /></button>
      <button className={tab(false)} onClick={soon("Experiences")}><Sparkles className="size-10" strokeWidth={1} aria-hidden />Experiences</button>
      <button className={tab(false)} onClick={soon("Services")}><ConciergeBell className="size-10" strokeWidth={1} aria-hidden />Services</button>
    </nav>
  );
}

function MobileChips() {
  const router = useRouter();
  const { toast } = useToast();
  const sp = useSearchParams();
  const homesActive = parseSearch(sp).homes;
  const chip = (on: boolean) => `flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_1px_4px_rgba(0,0,0,0.18)] ${on ? "ring-1 ring-ink" : ""}`;
  return (
    <div className="scrollbar-none -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
      <button className={chip(!homesActive)} onClick={() => router.push("/")}><Globe className="size-5" strokeWidth={1.5} />All</button>
      <button className={chip(homesActive)} onClick={() => router.push("/?homes=1")}><House className="size-5" strokeWidth={1.5} />Homes</button>
      <button className={chip(false)} onClick={() => toast("Experiences aren't part of this demo — stays only.", "info")}><Sparkles className="size-5" strokeWidth={1.5} />Experiences</button>
      <button className={chip(false)} onClick={() => toast("Services aren't part of this demo — stays only.", "info")}><ConciergeBell className="size-5" strokeWidth={1.5} />Services</button>
    </div>
  );
}

export function SiteHeader() {
  const { user } = useDemoUser();
  const pathname = usePathname();
  const sp = useSearchParams();
  const searching = pathname === "/" && isSearching(parseSearch(sp));
  const header = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [forced, setForced] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const openedAt = useRef(0);
  const openedTime = useRef(0);

  // The big pill shows at the top of Explore and collapses once you scroll (like Airbnb).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setForced(false);
  }
  const expanded = (pathname === "/" && !searching && !scrolled) || forced;
  const sticky = pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Opening the pill grows the header and shifts the page; re-baseline during that settle
      // window so only a deliberate scroll afterwards closes it.
      if (performance.now() - openedTime.current < 500) openedAt.current = window.scrollY;
      else if (Math.abs(window.scrollY - openedAt.current) > 48) setForced(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Publish the live header height so sticky rows below it can offset correctly.
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useClickOutside(header, () => setForced(false), forced);
  const collapse = () => setForced(false);

  return (
    <header
      ref={header}
      className={`${sticky ? "sticky top-0" : "relative"} ${pathname.startsWith("/listings/") ? "max-md:hidden" : ""} z-40 border-b transition-colors ${expanded && pathname === "/" ? "border-[#ebebeb] bg-gradient-to-b from-white via-white to-[#f7f7f7]" : searching ? "border-transparent bg-white" : "border-[#ebebeb] bg-white"}`}
    >
      <div className="mx-auto grid max-w-[1760px] items-center gap-3 px-4 sm:px-6 md:h-24 md:grid-cols-[auto_1fr_auto] md:px-10 xl:px-12 max-md:pb-2 max-md:pt-3">
        <div className="max-md:hidden"><Logo /></div>
        <div className="min-w-0">
          <div className="md:hidden">
            <Suspense fallback={<div className="skeleton h-12 rounded-full" />}><SearchBar mode="mobile" /></Suspense>
            {pathname === "/" && !searching && <Suspense fallback={null}><MobileChips /></Suspense>}
          </div>
          <div className="hidden md:block">
            {expanded ? (
              <Suspense fallback={null}><Tabs /></Suspense>
            ) : (
              <Suspense fallback={<div className="skeleton mx-auto h-12 w-[380px] rounded-full" />}><CompactSearch onOpen={() => { openedAt.current = window.scrollY; openedTime.current = performance.now(); setForced(true); }} /></Suspense>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 max-md:hidden">
          <Link href="/host" className="hidden whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--grey-btn)] lg:block">{user?.role === "host" ? "Host dashboard" : "Become a host"}</Link>
          <div className="max-md:hidden"><AccountMenu /></div>
        </div>
      </div>
      {expanded && (
        <div className="anim-fade hidden px-4 pb-8 pt-1.5 sm:px-6 md:block md:px-10 xl:px-12">
          <Suspense fallback={<div className="skeleton mx-auto h-[66px] max-w-[850px] rounded-full" />}>
            <SearchBar mode="desktop" onSubmitted={collapse} />
          </Suspense>
        </div>
      )}
    </header>
  );
}
