"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Check, Heart, Luggage, Menu, Search } from "lucide-react";
import { CompactSearch, SearchBar } from "@/components/search/SearchBar";
import { Avatar } from "@/components/ui/Avatar";
import { useClickOutside } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";
import { useToast } from "@/components/ui/Toast";

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 text-brand" aria-label="Roamly home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 28c-6-5-9-9.5-9-14a9 9 0 0 1 18 0c0 4.500-3 9-9 14Z" />
        <circle cx="16" cy="14" r="3.4" />
      </svg>
      <span className="hidden text-[22px] font-extrabold tracking-tight sm:inline">roamly</span>
    </Link>
  );
}

function AccountMenu() {
  const { user, users, switchTo } = useDemoUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const item = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-2";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-3 rounded-full border border-line py-1.5 pl-3.5 pr-1.5 transition-shadow hover:shadow-md"
      >
        <Menu className="size-4" aria-hidden />
        {user ? <Avatar name={user.name} src={user.avatar_url} size={30} /> : <span className="size-[30px] rounded-full bg-surface-2" />}
      </button>
      {open && (
        <div role="menu" className="anim-pop absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-line bg-bg py-2 shadow-pop">
          <div className="px-4 pb-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Demo account</p>
            <p className="mt-0.5 text-xs text-ink-2">Switch roles to try the guest and host experiences. Not real sign-in.</p>
          </div>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                <button
                  role="menuitemradio"
                  aria-checked={user?.id === u.id}
                  onClick={() => { switchTo(u.id); setOpen(false); toast(`Now browsing as ${u.name} (${u.role})`, "info"); }}
                  className={item}
                >
                  <Avatar name={u.name} src={u.avatar_url} size={32} />
                  <span className="flex-1">
                    <span className="block font-medium">{u.name}</span>
                    <span className="block text-xs capitalize text-ink-2">{u.role}</span>
                  </span>
                  {user?.id === u.id && <Check className="size-4" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
          <div className="my-2 border-t border-line" />
          <Link role="menuitem" href="/trips" onClick={() => setOpen(false)} className={item}><Luggage className="size-4" aria-hidden />My trips</Link>
          <Link role="menuitem" href="/?favorites=1" onClick={() => setOpen(false)} className={item}><Heart className="size-4" aria-hidden />Saved stays</Link>
          <Link role="menuitem" href="/host" onClick={() => setOpen(false)} className={item}><Briefcase className="size-4" aria-hidden />Host dashboard</Link>
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className={item}><Search className="size-4" aria-hidden />Explore</Link>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { user } = useDemoUser();
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [forced, setForced] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const openedAt = useRef(0);
  const openedTime = useRef(0);

  // Airbnb: the big pill shows at the top of Explore and collapses once you scroll.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setForced(false);
  }
  const expanded = (pathname === "/" && !scrolled) || forced;

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

  const link = "whitespace-nowrap rounded-full px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2";
  const collapse = () => setForced(false);

  return (
    <header ref={header} className={`sticky top-0 z-40 bg-bg ${pathname === "/" && expanded && !scrolled ? "" : "border-b border-line"}`}>
      <div className="mx-auto grid max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 md:h-24 md:px-10 xl:px-12 max-md:py-3">
        <Wordmark />
        <div className="min-w-0">
          <div className="md:hidden">
            <Suspense fallback={<div className="skeleton h-[52px] rounded-full" />}><SearchBar mode="mobile" /></Suspense>
          </div>
          <div className="hidden md:block">
            {expanded ? (
              <Link href="/" className="mx-auto block w-fit border-b-2 border-ink px-1 pb-2 pt-3 text-base font-medium" aria-current="page">Stays</Link>
            ) : (
              <Suspense fallback={<div className="skeleton mx-auto h-12 w-[380px] rounded-full" />}><CompactSearch onOpen={() => { openedAt.current = window.scrollY; openedTime.current = performance.now(); setForced(true); }} /></Suspense>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1">
          <Link href={user?.role === "host" ? "/host" : "/host"} className={`${link} hidden lg:block`}>{user?.role === "host" ? "Host dashboard" : "Become a host"}</Link>
          <Link href="/trips" className={`${link} hidden lg:block`}>Trips</Link>
          <AccountMenu />
        </div>
      </div>
      {expanded && (
        <div className="anim-fade hidden px-4 pb-4 sm:px-6 md:block md:px-10 xl:px-12">
          <Suspense fallback={<div className="skeleton mx-auto h-[66px] max-w-[850px] rounded-full" />}>
            <SearchBar mode="desktop" onSubmitted={collapse} />
          </Suspense>
        </div>
      )}
    </header>
  );
}
