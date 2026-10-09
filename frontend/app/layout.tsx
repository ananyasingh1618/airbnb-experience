import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Suspense } from "react";

const figtree = Figtree({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Airbnb | Holiday rentals, cabins, beach houses & more", template: "%s · Airbnb" },
  description:
    "Educational Airbnb clone: search stays, book with simulated payment, and manage listings. Not affiliated with Airbnb, Inc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="flex min-h-screen flex-col bg-bg text-ink">
        <Providers>
          <Suspense fallback={<header className="h-24 border-b border-[#ebebeb] bg-white" />}><SiteHeader /></Suspense>
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <SiteFooter />
          <Suspense fallback={null}><MobileTabBar /></Suspense>
        </Providers>
      </body>
    </html>
  );
}
