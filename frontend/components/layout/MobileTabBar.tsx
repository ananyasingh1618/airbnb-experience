"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Luggage, Search } from "lucide-react";
import { AccountMenu } from "@/components/layout/AccountMenu";

/** Airbnb's bottom tab bar on phones. Hidden on pages that have their own sticky reserve bar. */
export function MobileTabBar() {
  const pathname = usePathname();
  const sp = useSearchParams();
  if (pathname.startsWith("/listings") || pathname.startsWith("/checkout")) return null;
  const fav = sp.get("favorites") === "1";
  const tab = (active: boolean) => `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${active ? "text-brand" : "text-ink-2"}`;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#ebebeb] bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <Link href="/" className={tab(pathname === "/" && !fav)}><Search className="size-6" strokeWidth={1.75} aria-hidden />Explore</Link>
      <Link href="/?favorites=1" className={tab(fav)}><Heart className="size-6" strokeWidth={1.5} aria-hidden />Wishlists</Link>
      <Link href="/trips" className={tab(pathname === "/trips")}><Luggage className="size-6" strokeWidth={1.5} aria-hidden />Trips</Link>
      <AccountMenu tab />
    </nav>
  );
}
