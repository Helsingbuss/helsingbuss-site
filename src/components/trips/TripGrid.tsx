// src/components/trips/TripCard.tsx
import Link from "next/link";
import Image from "next/image";
import * as React from "react";

type Promo = {
  text: string;
  color?: "red" | "blue";
};

type PriceConf =
  | {
      mode: "pill";               // visar pris-piller som på din skiss
      from: number | string;      // 4898 eller "4 898"
      prefix?: string;            // "fr."
      suffix?: string;            // ":-"
    }
  | {
      mode: "button";             // vanlig CTA-knapp (fallback)
      label: string;              // t.ex. "Se datum & boka"
    };

export type TripCardProps = {
  imageUrl: string;
  title: string;
  href?: string;

  tag?: "Flerdagarsresa" | "Dagsresa" | "Shoppingresa" | string;
  promo?: Promo | null;

  // Text under bilden (vänster)
  introTitle?: string;            // t.ex. "All Inclusive"
  introSub?: string;              // t.ex. "1 vecka …" (valfri)

  // Beskrivning i mitten
  heading?: string;               // valfri fet rubrik i textytan
  body?: string;                  // kort brödtext

  price?: PriceConf;              // pris-pill eller knapp
  className?: string;
};

function fmtPrice(v: number | string) {
  if (typeof v === "number") return v.toLocaleString("sv-SE");
  return v;
}

export default function TripCard({
  imageUrl,
  title,
  href = "#",
  tag,
  promo,
  introTitle,
  introSub,
  heading,
  body,
  price,
  className = "",
}: TripCardProps) {
  return (
    <article
      className={`relative bg-white rounded-2xl shadow overflow-hidden ${className}`}
      style={{ borderRadius: 16 }}
    >
      {/* Bild */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.jpg"}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
          priority={false}
        />

        {/* Kampanjbanderoll (med snyggt ”maskade” snedskurna kanter) */}
        {promo?.text && (
          <div
            className="absolute left-0 top-7 -rotate-10"
            style={{ transformOrigin: "left center" }}
          >
            <span
              className={`
                inline-block text-white font-semibold text-[15px] px-5 py-2
                shadow-md
              `}
              style={{
                background:
                  promo.color === "blue"
                    ? "#2d70b3"
                    : "#EB4747", // röd default
                borderRadius: 6,
                display: "inline-block",
                // gör snygg parallellogram utan vassa vita hörn
                clipPath:
                  "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0% 100%)",
              }}
            >
              {promo.text}
            </span>
          </div>
        )}
      </div>

      {/* Kategori-tag i hörnet på bilden */}
      {tag && (
        <div className="absolute left-4 top-4">
          <span className="inline-block rounded-full bg-white/90 backdrop-blur px-3 py-1 text-[12px] font-medium text-[#194C66] shadow">
            {tag}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        <h3 className="text-[#0f172a] text-lg font-semibold">{title}</h3>

        {(heading || body) && (
          <div className="mt-2 text-[15px] leading-relaxed text-[#0f172a]/80">
            {heading && <div className="font-semibold text-[#0f172a]">{heading}</div>}
            {body && <div className="mt-1">{body}</div>}
          </div>
        )}
      </div>

      {/* Nedre remsa: vänster text + höger pris-piller ELLER knapp */}
      <div className="px-5 pb-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {introTitle && (
              <div className="text-[#0f172a] font-semibold">{introTitle}</div>
            )}
            {introSub && (
              <div className="text-[#0f172a]/70 text-sm truncate">{introSub}</div>
            )}
          </div>

          {/* Höger sida */}
          {price?.mode === "pill" && "from" in price ? (
            <div
              className="shrink-0 px-4 py-2 rounded-full text-white font-semibold"
              style={{
                background: "#EB4747",
                boxShadow: "0 6px 14px rgba(235,71,71,.25)",
              }}
              aria-label="Pris från"
            >
              <span className="text-[12px] align-middle opacity-90 mr-1">
                {price.prefix ?? "fr."}
              </span>
              <span className="text-[18px] leading-none align-middle">
                {fmtPrice(price.from)}
                {price.suffix ?? ":-"}
              </span>
            </div>
          ) : price?.mode === "button" ? (
            <Link
              href={href}
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#194C66] text-white text-sm font-medium hover:opacity-90"
            >
              {price.label}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Klickbar över hela kortet om href finns */}
      {href && (
        <Link href={href} className="absolute inset-0" aria-label={title} />
      )}
    </article>
  );
}
