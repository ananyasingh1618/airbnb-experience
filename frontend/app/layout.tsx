import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { DisclosureBanner } from "@/components/layout/DisclosureBanner";
import { Suspense } from "react";

const figtree = Figtree({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Airbnb clone — educational demo (not affiliated with Airbnb)", template: "%s · Airbnb clone (demo)" },
  description: "An independent educational clone of a stays-booking site. Not affiliated with or endorsed by Airbnb, Inc. Listings are fictional and bookings and payments are simulated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="flex min-h-screen flex-col bg-bg text-ink">
        <Providers>
          <DisclosureBanner />
          <Suspense fallback={<header className="h-24 border-b border-[#ebebeb] bg-white" />}><SiteHeader /></Suspense>
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <SiteFooter />
          <Suspense fallback={null}><MobileTabBar /></Suspense>
        </Providers>
      </body>
    </html>
  );
}
