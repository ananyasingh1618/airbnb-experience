"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { DemoUserProvider } from "@/lib/demo-user";
import { FavoritesProvider } from "@/lib/favorites";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DemoUserProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </DemoUserProvider>
    </ToastProvider>
  );
}
