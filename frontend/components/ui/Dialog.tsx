"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "center" modal or "full" (near full-screen, for the photo viewer). */
  size?: "md" | "lg" | "full";
}

/** Native <dialog>: gives focus trapping, Esc to close and inert background for free. */
export function Dialog({ open, onClose, title, children, footer, size = "md" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const width = size === "full" ? "w-[min(1100px,100vw)] h-[100dvh] sm:h-[92vh]" : size === "lg" ? "w-[min(720px,100vw)]" : "w-[min(560px,100vw)]";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={`${width} m-auto max-w-[100vw] max-sm:h-[100dvh] max-sm:w-screen max-h-[100dvh] overflow-hidden rounded-none bg-bg p-0 text-ink shadow-pop sm:max-h-[90vh] sm:rounded-2xl`}
    >
      <div className="flex max-h-[inherit] h-full flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <button
            onClick={onClose}
            aria-label="Close"
            className="-ml-2 grid size-8 place-items-center rounded-full transition-colors hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
          <h2 className="text-base font-semibold">{title}</h2>
          <span className="size-8" aria-hidden />
        </header>
        <div className="flex-1 overflow-y-auto">{open && children}</div>
        {open && footer && <footer className="border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    </dialog>
  );
}
