"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

/** next/image with a graceful fallback tile if the photo fails to load (offline, blocked, bad URL). */
export function SafeImage({ onError, alt, ...props }: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<unknown>(null);
  if (failedSrc === props.src) {
    return (
      <div role="img" aria-label={alt} data-image-fallback className="absolute inset-0 grid place-items-center bg-[var(--grey-btn)] text-ink-2">
        <ImageOff className="size-6" aria-hidden />
      </div>
    );
  }
  return <Image {...props} alt={alt} onError={(e) => { setFailedSrc(props.src); onError?.(e); }} />;
}
