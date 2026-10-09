import Link from "next/link";

/** Original SVG drawing of the "Bélo"-style loop mark + text wordmark (no downloaded brand assets). */
export function BeloMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2.6c-1.7 0-3 1.1-3.8 2.7L4.6 20.5c-1.4 2.8-1.5 5-.6 6.6.9 1.6 2.6 2.5 4.6 2.5 2.4 0 4.6-1.4 7.4-4.6 2.8 3.2 5 4.6 7.4 4.6 2 0 3.7-.9 4.6-2.5.9-1.6.8-3.8-.6-6.6L19.8 5.3C19 3.7 17.7 2.6 16 2.6Z" />
      <path d="M16 20.4c-2.2-2.7-3.4-4.9-3.4-6.6a3.4 3.4 0 0 1 6.8 0c0 1.7-1.2 3.9-3.4 6.6Z" />
    </svg>
  );
}

export function Logo({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <Link href="/" aria-label="Airbnb home" className="flex h-20 items-center gap-1 text-brand">
      <BeloMark className="size-[32px]" />
      {!markOnly && <span className="hidden text-[27px] font-semibold leading-none tracking-[-0.05em] lg:inline">airbnb</span>}
    </Link>
  );
}
