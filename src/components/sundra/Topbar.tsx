// src/components/sundra/Topbar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ✅ Hydration-fix:
 * Rendera INTE aktuell tid/datum på servern.
 * Visa placeholder ("—") tills komponenten mountat i browsern,
 * och börja sen uppdatera klockan.
 */
function useClientNow() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);

    const tick = () => setNow(new Date());
    tick();

    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  return { mounted, now };
}

function stripQuery(path: string) {
  return (path || "/").split("?")[0] || "/";
}

function detectRole(path: string): "admin" | "agent" {
  return path.startsWith("/agent") ? "agent" : "admin";
}

function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 22a2.3 2.3 0 0 0 2.2-2H9.8A2.3 2.3 0 0 0 12 22Z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export type TopbarProps = {
  userInitial?: string;
  userLabel?: string;

  // ✅ props som dina sidor skickar in
  title?: string;
  subtitle?: string;
  backHref?: string; // accepteras (utan att ändra design)

  homeHref?: string;
  notificationsCount?: number;
  showSearch?: boolean;
  rightSlot?: ReactNode;
};

export function Topbar({
  userInitial = "K",
  userLabel = "Konto",

  title,
  subtitle,
  backHref, // ✅ används ej i UI (men props finns -> inga TS-fel)

  homeHref,
  notificationsCount = 1,
  showSearch = true,
  rightSlot,
}: TopbarProps) {
  const router = useRouter();
  const path = stripQuery(router.asPath || "/");
  const role = detectRole(path);

  const base = role === "agent" ? "/agent/sundra" : "/admin/sundra";
  const autoTitle = role === "agent" ? "Sundra – Agent" : "Sundra – Admin";

  const headerTitle = title ?? autoTitle;
  const headerSubtitle = subtitle ?? "Backoffice";
  const home = homeHref ?? base;

  const { mounted, now } = useClientNow();

  const timeStr = useMemo(() => {
    if (!mounted || !now) return "—";
    try {
      return now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  }, [mounted, now]);

  const dateStr = useMemo(() => {
    if (!mounted || !now) return "—";
    try {
      return now.toLocaleDateString("sv-SE", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }, [mounted, now]);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const notifCount = Number.isFinite(Number(notificationsCount)) ? Number(notificationsCount) : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B2A44] text-white">
      <div className="flex h-16 w-full items-center gap-4 px-5">
        <div className="flex items-center gap-3">
          <Link href={home} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sundra_logo_vit.svg" alt="Sundra" className="h-7 w-auto" draggable={false} />
          </Link>

          <div className="leading-tight">
            <div className="text-sm font-semibold">{headerTitle}</div>
            <div className="text-xs opacity-80">{headerSubtitle}</div>
          </div>
        </div>

        <div className="flex-1">
          {showSearch ? (
            <div className="relative mx-auto max-w-[900px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
                <IconSearch className="h-5 w-5" />
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/10 pl-11 pr-4 text-sm font-semibold text-white placeholder:text-white/60 outline-none focus:border-white/20 focus:bg-white/12"
                placeholder="Sök bokning, resa, kund..."
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold lg:flex">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
            <span>{timeStr}</span>
            <span className="opacity-60">|</span>
            <span className="opacity-90">{dateStr}</span>
          </div>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15"
            title="Notiser"
          >
            <IconBell className="h-5 w-5" />
            {notifCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold">
                {notifCount}
              </span>
            ) : null}
          </button>

          {rightSlot ? (
            <div className="hidden md:flex">{rightSlot}</div>
          ) : (
            <button
              type="button"
              className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2A44] hover:opacity-95 md:inline-flex"
              title="Skapa ny avgång"
              onClick={() => router.push(`${base}/avgangar`)}
            >
              <IconPlus className="h-4 w-4" />
              Ny avgång
            </button>
          )}

          <div className="relative" ref={wrapRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
                {String(userInitial || "K").slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden md:inline">{userLabel}</span>
              <span className="hidden md:inline opacity-80">▾</span>
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0B2A44] shadow-xl">
                <div className="px-3 py-2 text-xs font-semibold text-white/70">KONTO</div>

                <Link
                  href={`${base}/installningar`}
                  className="block px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  Inställningar
                </Link>

                <Link
                  href={`${base}/support`}
                  className="block px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  Support
                </Link>

                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    setOpen(false);
                    alert("Logga ut kopplas senare (auth).");
                  }}
                >
                  Logga ut
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
