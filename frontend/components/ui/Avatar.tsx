"use client";

import { useState } from "react";
import Image from "next/image";
import { initials } from "@/lib/format";

/** Initials render underneath the photo, so a slow or failed image never leaves a blank circle. */
export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      role="img"
      aria-label={name}
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-ink font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      <span aria-hidden>{initials(name)}</span>
      {src && !failed && (
        <Image src={src} alt="" fill sizes={`${size}px`} onError={() => setFailed(true)} className="object-cover" />
      )}
    </span>
  );
}
