export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-2 px-4 py-8 text-sm text-ink-2 sm:px-6 lg:px-10">
        <p>
          <span className="font-semibold text-ink">Roamly</span> is an independent, Airbnb-inspired demo built for a coding assignment.
          It is not affiliated with Airbnb.
        </p>
        <p>
          Listings, hosts, reviews and bookings are fictional sample data. Payments are simulated — no card is ever charged.
          Photography by contributors on Unsplash.
        </p>
      </div>
    </footer>
  );
}
