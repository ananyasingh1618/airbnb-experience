"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { plural } from "@/lib/format";
import type { Listing } from "@/types";

/** "Meet your host" card, as on Airbnb's listing page. */
export function MeetYourHost({ listing }: { listing: Listing }) {
  const { toast } = useToast();
  const h = listing.host;
  return (
    <section aria-labelledby="host-h">
      <h2 id="host-h" className="mb-6 text-[22px] font-medium tracking-[-0.02em]">Meet your host</h2>
      <div className="grid gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="flex items-center gap-6 rounded-3xl bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col items-center text-center">
            <Avatar name={h.name} src={h.avatar_url} size={96} />
            <p className="mt-3 text-[26px] font-semibold leading-8 tracking-[-0.02em]">{h.name}</p>
            <p className="text-sm font-medium">Host</p>
          </div>
        </div>
        <div>
          <p className="text-base leading-6">{h.bio ?? `${h.name} is a host on this demo site.`}</p>
          <p className="mt-4 text-sm text-ink-2">Host details are fictional demo content.</p>
          <button onClick={() => toast("Messaging isn't available in this demo.", "info")} className="btn-grey mt-6">Message host</button>
        </div>
      </div>
    </section>
  );
}

/** "Things to know": rules come from the listing's real data; times are fictional demo text. */
export function ThingsToKnow({ listing }: { listing: Listing }) {
  const pets = listing.amenities.some((a) => a.name === "Pets allowed");
  const col = "text-sm";
  const li = "mb-3 flex gap-3 leading-5";
  return (
    <section aria-labelledby="know-h">
      <h2 id="know-h" className="mb-6 text-[22px] font-medium tracking-[-0.02em]">Things to know</h2>
      <div className="grid gap-8 md:grid-cols-3">
        <div className={col}>
          <h3 className="mb-4 text-base font-medium">House rules</h3>
          <ul><li className={li}>Check-in after 3:00 pm</li><li className={li}>Checkout before 11:00 am</li><li className={li}>{plural(listing.max_guests, "guest")} maximum</li><li className={li}>{pets ? "Pets allowed" : "No pets"}</li></ul>
        </div>
        <div className={col}>
          <h3 className="mb-4 text-base font-medium">About this stay</h3>
          <ul><li className={li}>{listing.property_type} · {listing.bedrooms === 0 ? "Studio" : plural(listing.bedrooms, "bedroom")}</li><li className={li}>{plural(listing.beds, "bed")} · {plural(listing.bathrooms, "bathroom")}</li><li className={li}>Cleaning fee: charged once per stay</li></ul>
        </div>
        <div className={col}>
          <h3 className="mb-4 text-base font-medium">Cancellation policy</h3>
          <ul><li className={li}>Free cancellation until the day before check-in.</li><li className={li}>Cancel any time from <strong className="font-medium">Trips</strong>; the dates open up for other guests.</li><li className={li}>Payments are simulated — nothing is charged.</li></ul>
        </div>
      </div>
    </section>
  );
}
