/** Always-visible, truthful identity statement shown above the header on every page. */
export const DISCLOSURE =
  "Independent educational project — not affiliated with or endorsed by Airbnb, Inc. Listings are fictional and bookings and payments are simulated.";

export function DisclosureBanner() {
  return (
    <div role="note" aria-label="About this site" data-disclosure className="bg-ink px-4 py-2 text-center text-xs leading-4 text-white sm:text-[13px]">
      <strong className="font-semibold">Demo clone.</strong> {DISCLOSURE}
    </div>
  );
}
