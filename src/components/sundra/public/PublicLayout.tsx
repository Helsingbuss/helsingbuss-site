// src/components/sundra/public/PublicLayout.tsx
import React from "react";
import Head from "next/head";
import { PublicSiteHeader } from "./PublicSiteHeader";
import { PublicSiteFooter } from "./PublicSiteFooter";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={
        {
          ["--hb-primary" as any]: "#0B2A44",
          ["--hb-accent" as any]: "#1B5B57",
          ["--hb-search-bg" as any]: "#6E7076",
          ["--hb-tab" as any]: "#8B95A3",
        } as React.CSSProperties
      }
    >
      {/* ✅ Favicon för Sundra (utan att heta favicon.*) */}
      <Head>
        <link rel="icon" href="/sundra_logo_icon_farg.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/sundra_logo_icon_farg.svg" />
        <link rel="apple-touch-icon" href="/sundra_logo_icon_farg.svg" />
      </Head>

      <PublicSiteHeader />
      <main>{children}</main>
      <PublicSiteFooter />
    </div>
  );
}
