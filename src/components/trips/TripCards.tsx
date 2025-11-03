import React from "react";

/* ===== Typer ===== */
export type TripCardProps = {
  id: string;
  image: string;                  // URL till huvudbilden
  title: string;                  // "Vangelis Hotel"
  location?: string;              // "Fig Tree Bay, Cypern"
  tripKind?: "flerdagar" | "dagsresa" | "shopping";
  tripKindLabel?: string;         // skriv över pillens text om du vill
  headline?: string;              // extra rubrik i textytan
  excerpt?: string;               // kort brödtext
  highlight?: string;             // ex. "All Inclusive"
  priceFrom?: number | string;    // ex. 8298
  currency?: string;              // "SEK" (default)
  ctaHref?: string;               // länk till detaljer/bokning
  ctaText?: string;               // default: "Se datum och boka"

  // Blå horisontell banderoll över bilden
  banner?: {
    text: string;
    color?: string;               // default "#0ea5e9"
    textColor?: string;           // default "#fff"
  };

  // Diagonal röd banderoll (nu med snygga spetsar)
  ribbon?: {
    text: string;
    color?: string;               // default "#ef4444"
    textColor?: string;           // default "#fff"
    angle?: number;               // default -12
  };

  // Visa prisbubbla nere till höger i bilden
  showPriceBubble?: boolean;
};

/* ===== Hjälp-funktioner ===== */
function formatPrice(v?: number | string, currency = "SEK") {
  if (v === undefined || v === null || v === "") return "";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("sv-SE") + (currency === "SEK" ? ":-" : ` ${currency}`);
}
function kindLabel(kind?: TripCardProps["tripKind"], override?: string) {
  if (override) return override;
  switch (kind) {
    case "flerdagar": return "Flerdagarsresa";
    case "dagsresa":  return "Dagsresa";
    case "shopping":  return "Shoppingresa";
    default:          return "";
  }
}

/* ===== TripCard: kortet ===== */
export function TripCard(props: TripCardProps) {
  const {
    image, title, location, tripKind, tripKindLabel,
    headline, excerpt, highlight, priceFrom,
    currency = "SEK", ctaHref = "#", ctaText = "Se datum och boka",
    banner, ribbon, showPriceBubble = true,
  } = props;

  const badge = kindLabel(tripKind, tripKindLabel);
  const bannerBg = banner?.color || "#0ea5e9";
  const bannerFg = banner?.textColor || "#fff";
  const ribbonBg = ribbon?.color || "#ef4444";
  const ribbonFg = ribbon?.textColor || "#fff";
  const angle = ribbon?.angle ?? -12;
  const priceText = priceFrom ? `fr. ${formatPrice(priceFrom, currency)}` : "";

  return (
    <article className="relative overflow-hidden rounded-2xl shadow bg-white">
      {/* Bildyta */}
      <div className="relative">
        <div className="relative aspect-[16/10] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>

        {/* Blå banderoll (fullbredd) */}
        {banner?.text && (
          <div
            className="absolute left-0 top-0 w-full px-4 py-2 text-sm font-semibold"
            style={{ background: bannerBg, color: bannerFg }}
          >
            {banner.text}
          </div>
        )}

        {/* Diagonal röd banderoll — med spetsade ändar och skugga */}
        {ribbon?.text && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <div
              className="relative"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {/* Själva bandet */}
              <span
                className="inline-block px-6 py-2 text-[15px] font-semibold"
                style={{
                  background: ribbonBg,
                  color: ribbonFg,
                  borderRadius: 6,
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,.18))",
                }}
              >
                {ribbon.text}
              </span>

              {/* Vänster spets */}
              <span
                className="pointer-events-none absolute left-[-12px] top-[2px] h-0 w-0"
                style={{
                  borderTop: "12px solid transparent",
                  borderBottom: "12px solid transparent",
                  borderRight: `12px solid ${ribbonBg}`,
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,.12))",
                }}
              />
              {/* Höger spets */}
              <span
                className="pointer-events-none absolute right-[-12px] top-[2px] h-0 w-0"
                style={{
                  borderTop: "12px solid transparent",
                  borderBottom: "12px solid transparent",
                  borderLeft: `12px solid ${ribbonBg}`,
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,.12))",
                }}
              />
            </div>
          </div>
        )}

        {/* Typ-pille */}
        {badge && (
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[13px] font-semibold shadow">
            {badge}
          </div>
        )}

        {/* Pris-bubbla */}
        {showPriceBubble && priceText && (
          <div className="absolute bottom-3 right-3 rounded-full bg-rose-200/90 px-4 py-2 text-[15px] font-semibold text-rose-900 shadow">
            {priceText}
          </div>
        )}
      </div>

      {/* Innehåll */}
      <div className="p-4">
        {location && <div className="text-[13px] text-[#194C66]/70 mb-1">{location}</div>}
        <h3 className="text-[20px] font-semibold text-[#0f172a]">{title}</h3>

        {headline && <div className="mt-2 text-[15px] font-semibold text-[#0f172a]">{headline}</div>}
        {excerpt && <p className="mt-1 text-[14px] leading-relaxed text-[#0f172a]/80">{excerpt}</p>}

        <div className="mt-3 flex items-center justify-between">
          {highlight ? (
            <div className="text-[16px] font-semibold text-[#0f172a]">{highlight}</div>
          ) : <span />}
          {!showPriceBubble && priceText && (
            <div className="text-[#0f172a] font-semibold">{priceText}</div>
          )}
        </div>

        <div className="mt-4">
          <a
            href={ctaHref}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#194C66] px-5 py-2.5 text-white transition hover:bg-[#153a4c]"
          >
            {ctaText}
          </a>
        </div>
      </div>
    </article>
  );
}

/* ===== TripGrid: 3/4/5 per rad ===== */
export function TripGrid({ items, cols = 3 }: { items: TripCardProps[]; cols?: 3 | 4 | 5 }) {
  const map: Record<3 | 4 | 5, string> = {
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
  };
  return (
    <div className={`grid grid-cols-1 gap-6 ${map[cols]}`}>
      {items.map((it) => <TripCard key={it.id} {...it} />)}
    </div>
  );
}

export default TripGrid;
