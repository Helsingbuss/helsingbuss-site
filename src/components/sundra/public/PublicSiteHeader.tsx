import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PublicTripSearchBar } from "./PublicTripSearchBar";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function PublicSiteHeader() {
  const navRef = useRef<HTMLDivElement | null>(null);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const [navHidden, setNavHidden] = useState(false);
  const [navH, setNavH] = useState(78); // fallback

  const navLinks = useMemo(
    () => [
      { label: "Våra resor", href: "/resor" },
      { label: "Erbjudanden", href: "/resor?view=offers" },
      { label: "Sista minuten", href: "/resor?view=lastminute" },
      { label: "Utflykter", href: "/resor?view=excursions" },
      { label: "Kundservice", href: "/resor?view=support" },
    ],
    []
  );

  // Mät menyradens höjd
  useIsoLayoutEffect(() => {
    const measure = () => {
      const h = navRef.current?.offsetHeight ?? 78;
      setNavH(h);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Scrolllogik (stabil)
  useEffect(() => {
    const SHOW_AT_TOP = 12;
    const HIDE_AFTER = 90;
    const SHOW_ON_UP_DELTA = 18;

    const onScroll = () => {
      const y = window.scrollY || 0;

      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          const prev = lastY.current;
          const delta = y - prev;
          const scrollingDown = delta > 0;

          if (y <= SHOW_AT_TOP) {
            setNavHidden(false);
          } else if (scrollingDown && y > HIDE_AFTER) {
            setNavHidden(true);
          } else if (!scrollingDown && Math.abs(delta) > SHOW_ON_UP_DELTA) {
            setNavHidden(false);
          }

          lastY.current = y;
          ticking.current = false;
        });
      }
    };

    lastY.current = window.scrollY || 0;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Offset så gröna ribban hamnar under menyn när menyn syns
  useEffect(() => {
    const offset = navHidden ? 0 : navH;
    document.documentElement.style.setProperty("--public-nav-offset", `${offset}px`);
  }, [navHidden, navH]);

  return (
    <>
      {/* FIXED MENY (försvinner på scroll) */}
      <div
        ref={navRef}
        className={[
          "fixed left-0 right-0 top-0 z-[120] border-b bg-white/95 backdrop-blur",
          "transition-transform duration-200 will-change-transform",
          navHidden ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-4">
          {/* ✅ Färgad logo på vit meny */}
          <Link href="/resor" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sundra_logo_farg.svg"
              alt="Sundra"
              className="h-12 w-auto"  // lite större
            />
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-semibold text-gray-800 hover:text-gray-950"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:block">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                <input
                  placeholder="Sök..."
                  className="h-10 w-[240px] rounded-full border bg-white pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>

            <Link
              href="/resor?mina-sidor=1"
              className="inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <span>👤</span> Mina sidor
            </Link>
          </div>
        </div>
      </div>

      {/* Gröna ribban + dropdown */}
      <PublicTripSearchBar title="Sök din resa här" />
    </>
  );
}
