"use client";

import { useState } from "react";
import Image from "next/image";
import { initials } from "@/lib/format";

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      sizes={`${size}px`}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-surface-2 object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-label={name}
      role="img"
      className="grid shrink-0 place-items-center rounded-full bg-ink font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
