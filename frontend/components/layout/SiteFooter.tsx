"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

/** Destinations come from the seeded inventory; each links to a real search. */
const INSPIRATION: [string, string, string][] = [
  ["Whistler", "Cabin rentals", "Whistler"], ["Tulum", "House rentals", "Tulum"], ["Paris", "Apartment rentals", "Paris"],
  ["Marbella", "Villa rentals", "Marbella"], ["Banff", "Cabin rentals", "Banff"], ["Mykonos", "Villa rentals", "Mykonos"],
  ["Lagos", "Beachfront rentals", "Lagos"], ["Brooklyn", "Loft rentals", "Brooklyn"], ["Aspen", "Lodge rentals", "Aspen"],
  ["Ubud", "Villa rentals", "Ubud"], ["Palm Springs", "House rentals", "Palm Springs"], ["Isle of Skye", "Cottage rentals", "Skye"],
];

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Support", links: ["Help Centre", "Get help with a safety issue", "AirCover", "Anti-discrimination", "Disability support", "Cancellation options", "Report neighbourhood concern"] },
  { title: "Hosting", links: ["Airbnb your home", "Airbnb your experience", "Airbnb your service", "AirCover for Hosts", "Hosting resources", "Community forum", "Hosting responsibly", "Join a free hosting class", "Find a co-host", "Refer a host"] },
  { title: "Airbnb", links: ["Newsroom", "New features", "Careers", "Investors", "Gift cards", "Airbnb.org emergency stays"] },
];

export function SiteFooter() {
  const { toast } = useToast();
  const demo = (name: string) => () => toast(`“${name}” isn't available in this demo clone.`, "info");
  const link = "text-left text-sm text-[#222] hover:underline";
  return (
    <footer className="mt-12 border-t border-[#ebebeb] bg-white pb-16 text-sm md:pb-0">
      <div className="mx-auto max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-12">
        <section aria-labelledby="inspo" className="border-b border-[#ebebeb] py-12">
          <h2 id="inspo" className="mb-6 text-[22px] font-medium tracking-[-0.02em]">Inspiration for future getaways</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {INSPIRATION.map(([name, type, q]) => (
              <li key={name}>
                <Link href={`/?q=${encodeURIComponent(q)}`} className="block"><span className="block font-medium">{name}</span><span className="block text-[#6c6c6c]">{type}</span></Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-10 border-b border-[#ebebeb] py-12 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="mb-4 font-semibold">{c.title}</h3>
              <ul className="space-y-4">
                {c.links.map((l) => <li key={l}><button onClick={demo(l)} className={link}>{l}</button></li>)}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="text-[#222]">© 2026 Airbnb clone · <button onClick={demo("Privacy")} className="hover:underline">Privacy</button> · <button onClick={demo("Terms")} className="hover:underline">Terms</button> · <button onClick={demo("Company details")} className="hover:underline">Company details</button></p>
          <p className="flex items-center gap-5 font-medium"><span className="flex items-center gap-2"><Globe className="size-4" aria-hidden />English (US)</span><span>$ USD</span></p>
        </div>
        <p className="pb-8 text-xs text-[#6c6c6c]">
          Educational project — not affiliated with, endorsed by, or sponsored by Airbnb, Inc. Listings, hosts and reviews are fictional sample data, photos are from Unsplash, and payments are simulated.
        </p>
      </div>
    </footer>
  );
}
