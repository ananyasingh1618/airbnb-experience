"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

interface Props {
  listingId: number;
  title: string;
  /** "overlay" sits on a photo; "inline" is a labelled text button. */
  variant?: "overlay" | "inline";
}

export function FavoriteButton({ listingId, title, variant = "overlay" }: Props) {
  const { isFavorite, toggle, pending } = useFavorites();
  const on = isFavorite(listingId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault(); // never trigger the parent card link
    e.stopPropagation();
    toggle(listingId);
  };

  if (variant === "inline") {
    return (
      <button
        onClick={onClick}
        aria-pressed={on}
        disabled={pending(listingId)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline-offset-2 transition-colors hover:bg-surface-2"
      >
        <Heart className={`size-4 transition-transform duration-150 ${on ? "scale-110 fill-brand text-brand" : ""}`} aria-hidden />
        {on ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
      disabled={pending(listingId)}
      className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
    >
      <Heart
        className={`size-6 drop-shadow-[0_1px_2px_rgb(0_0_0/0.45)] transition-colors duration-150 ${
          on ? "fill-brand stroke-white" : "fill-black/45 stroke-white"
        }`}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}
