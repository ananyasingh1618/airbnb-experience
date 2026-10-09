"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Check, Heart, Luggage, Menu, Search } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
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
  const nav = (href: string, label: string) => (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2 ${pathname === href ? "bg-surface-2" : ""}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1760px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6 md:py-4">
        <div className="md:justify-self-start"><Wordmark /></div>
        <div className="min-w-0 flex-1 md:flex-none md:w-[min(820px,48vw)] lg:w-[min(820px,52vw)]">
          <Suspense fallback={<div className="skeleton h-[52px] rounded-full" />}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="flex items-center justify-end gap-1">
          <div className="hidden items-center lg:flex">
            {nav("/", "Explore")}
            {nav("/trips", "My trips")}
            {user?.role === "host" ? nav("/host", "Host dashboard") : nav("/host", "Become a host")}
          </div>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

