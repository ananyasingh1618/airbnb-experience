const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold transition-[background-color,transform,box-shadow,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const variants = {
  brand: "bg-brand text-white hover:bg-brand-hover",
  dark: "bg-ink text-white hover:bg-black",
  outline: "border border-ink bg-bg text-ink hover:bg-surface",
  ghost: "text-ink hover:bg-surface-2",
  danger: "border border-danger text-danger hover:bg-danger-bg",
} as const;

export const btn = (variant: keyof typeof variants = "dark", extra = "") =>
  `${base} ${variants[variant]} ${extra}`.trim();
