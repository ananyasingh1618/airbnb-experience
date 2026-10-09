/** Original laurel-branch drawing used beside the "Guest favourite" label. */
export function Laurel({ flip = false, className = "h-12 w-6" }: { flip?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 48" className={className} aria-hidden fill="currentColor" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M14 46c-5-5-8-12-8-20 0-6 2-11 6-16 .5 5 .5 9-.7 13 2-1 4-3 5-5 1 7-.5 13-2.8 18 2-.5 4-2 5-4-0.2 6-2 10-4.5 14z" opacity=".9" />
      <path d="M6 30c-2-1-3.5-3-4-6 2 .2 3.5.8 5 2zM5.500 20c-1.5-1.5-2-3.5-1.8-6 2 1 3 2.5 3.5 4.5zM8 12c-1-1.8-1-3.800-0.2-6 1.8 1.300 2.5 3 2.5 5z" />
    </svg>
  );
}
