"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, Check, Heart, Luggage, Menu, Search, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useClickOutside } from "@/lib/hooks";
import { useDemoUser } from "@/lib/demo-user";

/** Airbnb's two circular header buttons (profile + menu) sharing one dropdown. */
export function AccountMenu({ tab = false }: { tab?: boolean }) {
  const { user, users, switchTo } = useDemoUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const circle = "grid size-10 place-items-center overflow-hidden rounded-full bg-[var(--grey-btn)] transition-[background-color,box-shadow] hover:bg-[#e8e8e8]";
  const item = "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-[var(--grey-btn)]";
  const toggle = () => setOpen((o) => !o);
  const menuBody = (
        <div role="menu" className="anim-pop relative w-full sm:absolute sm:right-0 sm:top-[calc(100%+12px)] sm:z-50 sm:w-72 overflow-hidden rounded-xl bg-white py-2 shadow-[0_2px_16px_rgba(0,0,0,0.18)]">
          <div className="px-4 pb-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">Demo account</p>
            <p className="mt-0.5 text-xs text-ink-2">Switch between guest and host. This is a demo switch, not a real log in.</p>
          </div>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                <button role="menuitemradio" aria-checked={user?.id === u.id} onClick={() => { switchTo(u.id); setOpen(false); toast(`Now browsing as ${u.name} (${u.role})`, "info"); }} className={item}>
                  <Avatar name={u.name} src={u.avatar_url} size={32} />
                  <span className="flex-1"><span className="block">{u.name}</span><span className="block text-xs font-normal capitalize text-ink-2">{u.role}</span></span>
                  {user?.id === u.id && <Check className="size-4" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
          <div className="my-2 border-t border-line" />
          <Link role="menuitem" href="/trips" onClick={() => setOpen(false)} className={item}><Luggage className="size-4" aria-hidden />Trips</Link>
          <Link role="menuitem" href="/?favorites=1" onClick={() => setOpen(false)} className={item}><Heart className="size-4" aria-hidden />Wishlists</Link>
          <Link role="menuitem" href="/host" onClick={() => setOpen(false)} className={item}><Briefcase className="size-4" aria-hidden />{user?.role === "host" ? "Host dashboard" : "Become a host"}</Link>
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className={item}><Search className="size-4" aria-hidden />Explore</Link>
        </div>
  );

  if (tab) {
    return (
      <div ref={ref} className="relative flex flex-1 justify-center">
        <button onClick={toggle} aria-haspopup="menu" aria-expanded={open} className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-ink-2"><UserRound className="size-6" strokeWidth={1.5} />Profile</button>
        {open && <div className="absolute inset-x-2 bottom-[calc(100%+8px)] z-50">{menuBody}</div>}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <button onClick={toggle} aria-label="Account" aria-haspopup="menu" aria-expanded={open} className={`${circle} hidden sm:grid`}>
        {user ? <Avatar name={user.name} src={user.avatar_url} size={40} tone="light" /> : <UserRound className="size-5" />}
      </button>
      <button onClick={toggle} aria-label="Main navigation menu" aria-haspopup="menu" aria-expanded={open} className={circle}>
        <Menu className="size-4" strokeWidth={2.4} />
      </button>
      {open && menuBody}
    </div>
  );
}
