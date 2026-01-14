// src/components/sundra/public/PublicHeader.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { PublicTripSearchBar } from "@/components/sundra/public/PublicTripSearchBar";

type PickupOption = { id: string; label: string };

// ✅ Lokal typ (för att slippa att PublicTripSearchBar måste exportera/typa onSearch)
type PublicSearchValues = {
  tab: "DAY" | "MULTI" | "FUN";
  pickupId: string;
  date?: string | null;
  adults: number;
  children: number;
};

function normalizeTab(t: unknown): PublicSearchValues["tab"] {
  return t === "MULTI" || t === "FUN" ? t : "DAY";
}

export function PublicSiteHeader() {
  const router = useRouter();
  const [compact, setCompact] = useState(false);

  // Scroll: dölj menyraden, låt sök-ribbonen ligga kvar
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Demo-upphämtningar (kopplas till DB senare)
  const pickupOptions: PickupOption[] = useMemo(
    () => [
      { id: "hb", label: "Helsingborg C" },
      { id: "ag", label: "Ängelholm Station" },
      { id: "la", label: "Landskrona Station" },
      { id: "ma", label: "Malmö C" },
    ],
    []
  );

  // Defaults från query
  const defaultTab = normalizeTab(router.query.t);
  const defaultPickup = (router.query.p as string) || pickupOptions[0]?.id || "";

  function onSearch(values: PublicSearchValues) {
    router.push(
      {
        pathname: router.pathname, // funkar på /resor och /resor/[slug]
        query: {
          ...router.query,
          t: values.tab,
          p: values.pickupId,
          d: values.date || "",
          a: String(values.adults),
          c: String(values.children),
        },
      },
      undefined,
      { shallow: true }
    );
  }

  // Top menu links (du kan ändra href till WP-sidor om du vill)
  const nav = [
    { href: "/resor", label: "Våra resor" },
    { href: "/erbjudanden", label: "Erbjudanden" },
    { href: "/sista-minuten", label: "Sista minuten" },
    { href: "/utflykter", label: "Utflykter" },
    { href: "/kundservice", label: "Kundservice" },
  ];

  const activePath = (router.pathname || "").startsWith("/resor") ? "/resor" : router.pathname;

  return (
    <header className="sticky top-0 z-[60] w-full">
      {/* MENYRAD (försvinner vid scroll) */}
      <div
        className={[
          "w-full border-b bg-white transition-all duration-300",
          compact ? "max-h-0 overflow-hidden opacity-0" : "max-h-[120px] opacity-100",
        ].join(" ")}
      >
        <div className="mx-auto flex h-[78px] max-w-[1400px] items-center gap-4 px-4">
          {/* LOGO större */}
          <Link href="/resor" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sundra_logo_farg.svg" alt="Sundra" className="h-13 w-auto" />
          </Link>

          {/* NAV */}
          <nav className="hidden flex-1 items-center gap-6 md:flex">
            {nav.map((item) => {
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "text-sm font-semibold transition-colors",
                    isActive
                      ? "text-[var(--hb-primary)]"
                      : "text-gray-700 hover:text-[var(--hb-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* SÖKRUTA + MINA SIDOR */}
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M21 21l-4.3-4.3m1.3-5.2a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                placeholder="Sök..."
                className="h-10 w-[240px] rounded-full border bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.currentTarget.value || "").trim();
                    router.push({ pathname: "/resor", query: { ...router.query, q } }, undefined, {
                      shallow: true,
                    });
                  }
                }}
              />
            </div>

            <Link
              href="/mina-sidor"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M12 13a4 4 0 100-8 4 4 0 000 8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Mina sidor
            </Link>
          </div>
        </div>
      </div>

      {/* FULLBREDD SÖK-RIBBON (stannar alltid sticky) */}
      <PublicTripSearchBar
        fullWidth
        title="Sök din resa här"
        defaultTab={defaultTab}
        pickupOptions={pickupOptions}
        defaultPickupId={defaultPickup}
        onSearch={onSearch as any}
      />
    </header>
  );
}
