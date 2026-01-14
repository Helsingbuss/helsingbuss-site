// src/components/sundra/public/TripPreviewTemplate.tsx
import React from "react";

/**
 * ✅ Lokal typ för preview (så vi slipper bero på TripDraft-export i types.ts)
 * Matchar exakt det som denna template använder.
 */
export type TripDraft = {
  id?: string;
  type: "DAY" | "MULTI" | "FUN" | "WINTER" | "CRUISE" | string;

  title: string;
  intro?: string | null;

  eyebrow?: string | null;

  media?: {
    images?: string[];
    videoUrl?: string | null;
  } | null;

  highlights?: {
    chips?: string[];
  } | null;

  rating?: {
    average: number;
    count: number;
  } | null;

  facts?: {
    durationLabel?: string | null;
    accommodation?: string | null;
    meals?: string | null;
  } | null;

  aboutTitle?: string | null;
  aboutBody?: string | null;

  itinerary?: Array<{
    id?: string;
    title: string;
    body: string;
  }>;
};

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="inline-flex items-center gap-1" aria-label={`Betyg ${value}`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <span key={i} className={filled ? "text-amber-500" : "text-gray-300"}>
            ★
          </span>
        );
      })}
    </div>
  );
}

export function TripPreviewTemplate({ trip }: { trip: TripDraft }) {
  const imgs = (trip.media?.images ?? []).filter(Boolean).slice(0, 5);

  const chips = trip.highlights?.chips ?? [];
  const ratingAvg = Number(trip.rating?.average ?? 0);
  const ratingCount = Number(trip.rating?.count ?? 0);

  const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6">
      {/* minska “luft” mot toppraden – tajtare */}
      <div className="mt-2 rounded-3xl border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-12 gap-3">
          {/* Video/hero */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative h-[240px] overflow-hidden rounded-2xl bg-gray-100 md:h-[360px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-sm font-semibold text-gray-700">
                  {trip.media?.videoUrl ? "Video kan spelas här" : "Video kan läggas här"}
                </div>
                <div className="mt-1 text-xs text-gray-500">Fallback: hero-bild om du vill</div>
              </div>
            </div>
          </div>

          {/* Höger bilder */}
          <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-1">
            <div className="h-[175px] overflow-hidden rounded-2xl bg-gray-100 md:h-[174px]">
              {imgs[0] ? <img src={imgs[0]} alt="Miljöbild" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="h-[175px] overflow-hidden rounded-2xl bg-gray-100 md:h-[174px]">
              {imgs[1] ? <img src={imgs[1]} alt="Miljöbild" className="h-full w-full object-cover" /> : null}
            </div>
          </div>

          {/* Botten 3 bilder – lika stora */}
          <div className="col-span-12 grid grid-cols-1 gap-3 md:col-span-12 md:grid-cols-3">
            <div className="h-[170px] overflow-hidden rounded-2xl bg-gray-100">
              {imgs[2] ? <img src={imgs[2]} alt="Miljöbild" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="h-[170px] overflow-hidden rounded-2xl bg-gray-100">
              {imgs[3] ? <img src={imgs[3]} alt="Miljöbild" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="h-[170px] overflow-hidden rounded-2xl bg-gray-100">
              {imgs[4] ? <img src={imgs[4]} alt="Miljöbild" className="h-full w-full object-cover" /> : null}
            </div>
          </div>
        </div>
      </div>

      {/* Textblock */}
      <div className="mt-6">
        <div className="text-sm text-gray-600">
          {trip.eyebrow ?? (trip.type === "MULTI" ? "Flerdagsresa" : "Dagsresa")}
        </div>

        <h1 className="mt-1 text-3xl font-semibold text-gray-900">{trip.title}</h1>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">{trip.intro ?? ""}</p>

        {/* chips + rating */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c} className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-gray-800">
              {c}
            </span>
          ))}

          <span
            className="ml-2 inline-flex items-center gap-2 text-sm text-gray-700"
            title={`Baserad på ${ratingCount} svar`}
          >
            <Stars value={ratingAvg} />
            <span className="font-semibold">{ratingAvg ? ratingAvg.toFixed(1) : "0.0"}</span>
            <span className="text-xs text-gray-500">Baserad på {ratingCount} svar</span>
          </span>
        </div>

        {/* Boxar (din stil) – INGA avgångar, INGEN “Öppna sökaren”-knapp */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Välj datum & upphämtning i sökaren ovan</div>
            <div className="mt-1 text-sm text-gray-600">
              Val nu: <span className="font-semibold text-gray-900">—</span> • <span>—</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-2xl border bg-gray-50 px-4 py-3">
                <div className="text-xs font-semibold text-gray-500">Lägsta pris</div>
                <div className="text-sm font-bold text-gray-900">Från 399 kr</div>
              </div>

              <div className="flex items-center gap-2">
                <select className="h-10 rounded-xl border bg-white px-3 text-sm text-gray-900">
                  <option>Helsingborg C</option>
                  <option>Ängelholm</option>
                  <option>Landskrona</option>
                  <option>Malmö C</option>
                </select>

                <button
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "var(--hb-accent)" }}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  Boka
                </button>
              </div>
            </div>

            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:opacity-80"
              onClick={() => alert("Här länkar vi sen till er avgångs-sida (separat modul).")}
            >
              <span aria-hidden>☰</span> Se alla avgångar
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span aria-hidden>ⓘ</span> Mer fakta
            </div>

            <div className="mt-3 space-y-2 text-sm text-gray-700">
              {trip.facts?.durationLabel ? (
                <div>
                  <span className="text-gray-500">Reslängd:</span>{" "}
                  <span className="font-semibold">{trip.facts.durationLabel}</span>
                </div>
              ) : null}

              {trip.type === "MULTI" && trip.facts?.accommodation ? (
                <div>
                  <span className="text-gray-500">Boende:</span>{" "}
                  <span className="font-semibold">{trip.facts.accommodation}</span>
                </div>
              ) : null}

              {trip.type === "MULTI" && trip.facts?.meals ? (
                <div>
                  <span className="text-gray-500">Måltider:</span>{" "}
                  <span className="font-semibold">{trip.facts.meals}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Om resan */}
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">{trip.aboutTitle ?? "Om resan"}</div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">{trip.aboutBody ?? ""}</p>
        </div>

        {/* Resplan bara på flerdags */}
        {trip.type === "MULTI" && itinerary.length ? (
          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Resplan</div>
            <div className="mt-4 space-y-4">
              {itinerary.map((d, idx) => (
                <div key={d.id ?? `${idx}`} className="rounded-2xl border bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">{d.title}</div>
                  <div className="mt-1 whitespace-pre-line text-sm text-gray-700">{d.body}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
