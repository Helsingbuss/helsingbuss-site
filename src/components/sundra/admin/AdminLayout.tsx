// src/components/sundra/admin/AdminLayout.tsx
import Link from "next/link";
import React from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl text-white flex items-center justify-center font-bold"
              style={{ background: "var(--hb-accent)" }}
            >
              S
            </div>
            <div>
              <div className="text-sm font-semibold">Admin – Sundra</div>
              <div className="text-xs text-gray-500">Resor / innehåll</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/resor"
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Alla resor
            </Link>
            <Link
              href="/admin/resor/ny"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
              style={{ background: "var(--hb-primary)" }}
            >
              Ny resa
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6">{children}</div>
    </div>
  );
}
