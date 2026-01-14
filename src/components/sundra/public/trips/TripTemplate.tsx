import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  Info,
  PlayCircle,
  Star,
  Bus,
  Hotel,
  MapPin,
  User,
  Sparkles,
  Check,
} from "lucide-react";
import type { TripRecord } from "@/lib/sundra/trips/types";

type PickupOption = { id: string; label: string };

type TripTemplateProps = {
  trip: TripRecord;

  pickupId: string;
  date: string; // "" eller YYYY-MM-DD
  adults: number;
  children: number;

  pickupOptions: PickupOption[];
  onChangePickup: (pickupId: string) => void; // lämnas kvar i props, men används inte på res-sidan

  bookHref: { pathname: string; query: Record<string, string> };

  onScrollToFacts?: () => void;

  otherTrips?: TripRecord[];
};

function Stars({ average, count }: { average?: number; count?: number }) {
  const avgNum = typeof average === "number" && Number.isFinite(average) ? average : null;
  const countNum = typeof count === "number" && Number.isFinite(count) ? count : null;

  const label = avgNum === null ? "—" : avgNum.toFixed(1);
  const sub = countNum === null ? "" : `Baserad på ${countNum} svar`;

  return (
    <div className="group inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4"
            fill="currentColor"
            style={{
              color: i < Math.round(avgNum ?? 0) ? "#F59E0B" : "#E5E7EB",
            }}
          />
        ))}
      </div>

      <div className="text-sm font-semibold text-gray-900">{label}</div>
      {sub ? <div className="text-sm text-gray-600">{sub}</div> : null}
    </div>
  );
}

function coverForTrip(t: TripRecord) {
  const anyT = t as any;
  const media = anyT.media ?? {};
  const g = media.gallery ?? [];
  return media.heroImageUrl || g?.[0]?.url || "";
}

// -------------------- VIDEO HELPERS --------------------
function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function safeUrl(u: string) {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

function toEmbedUrl(raw: string) {
  const u = safeUrl(raw);
  if (!u) return raw;

  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    if (u.pathname.startsWith("/embed/")) return raw;
    return raw;
  }

  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    return raw;
  }

  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    return raw;
  }

  if (host === "player.vimeo.com") return raw;

  return raw;
}

function renderHeroMedia(opts: { title: string; heroVideoUrl?: string | null; heroImageUrl?: string | null }) {
  const { title, heroVideoUrl, heroImageUrl } = opts;

  const v = typeof heroVideoUrl === "string" ? heroVideoUrl.trim() : "";
  const img = typeof heroImageUrl === "string" ? heroImageUrl.trim() : "";

  if (v) {
    if (isVideoFile(v)) {
      return (
        <video className="h-full w-full object-cover" controls playsInline preload="metadata" poster={img || undefined}>
          <source src={v} />
        </video>
      );
    }

    const embed = toEmbedUrl(v);
    return (
      <iframe
        className="h-full w-full"
        src={embed}
        title={title ? `Video – ${title}` : "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (img) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img} alt={title} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center text-center">
      <div className="text-gray-500">
        <div className="mx-auto mb-2 flex w-fit items-center justify-center rounded-full border bg-white px-3 py-2">
          <PlayCircle className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold">Video kan läggas här</div>
        <div className="text-xs">Fallback: hero-bild om du vill</div>
      </div>
    </div>
  );
}
// ------------------------------------------------------------

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizeArray(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function pickItinerary(anyTrip: any): any[] {
  const candidates = [
    anyTrip?.itinerary,
    anyTrip?.days,
    anyTrip?.dayPrograms,
    anyTrip?.day_programs,
    anyTrip?.itinerary_json,
    anyTrip?.dagsprogram,
    anyTrip?.programDays,
    anyTrip?.program,
    anyTrip?.schedule,
  ];

  for (const c of candidates) {
    const arr = normalizeArray(c);
    if (arr.length) return arr;
  }
  return [];
}

/**
 * ✅ FIX: PRIORITERA media.programSummary först
 * annars vinner "gammal" root programSummary i DB.
 */
function pickProgramSummary(anyTrip: any): string | null {
  const v =
    anyTrip?.media?.programSummary ??
    anyTrip?.media?.program_summary ??
    anyTrip?.programSummary ??
    anyTrip?.itinerarySummary ??
    anyTrip?.programShort ??
    anyTrip?.programIntro ??
    anyTrip?.program_summary ??
    anyTrip?.itinerary_summary ??
    null;

  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// -------- "Detta ingår" (sparas i media.includes) --------
type IncludeItem = { id: string; label: string };

function normalizeIncludes(raw: any): IncludeItem[] {
  if (!raw) return [];

  // already array
  const arr = normalizeArray(raw);
  if (!arr.length) return [];

  // objects?
  if (typeof arr[0] === "object" && arr[0] && "label" in (arr[0] as any)) {
    return arr
      .map((x: any, i: number) => ({
        id: String(x?.id ?? `custom_${i}`),
        label: String(x?.label ?? "").trim(),
      }))
      .filter((x) => x.label);
  }

  // strings
  return arr
    .map((s: any, i: number) => ({
      id: `custom_${i}`,
      label: String(s ?? "").trim(),
    }))
    .filter((x) => x.label);
}

function iconForInclude(id: string) {
  const k = id.toLowerCase();
  if (k.includes("bus")) return Bus;
  if (k.includes("hotel")) return Hotel;
  if (k.includes("guide") || k.includes("leader")) return User;
  if (k.includes("stop") || k.includes("experience") || k.includes("program")) return MapPin;
  if (k.includes("onboard") || k.includes("quiz") || k.includes("welcome")) return Sparkles;
  return Check;
}

export function TripTemplate(props: TripTemplateProps) {
  const {
    trip,
    pickupId,
    date,
    adults,
    children,
    pickupOptions,
    onChangePickup: _onChangePickup,
    bookHref,
    onScrollToFacts,
    otherTrips = [],
  } = props;

  const anyTrip = trip as any;

  const media = anyTrip.media ?? {};
  const heroVideoUrl: string | null = media?.heroVideoUrl ?? null;
  const heroImageUrl: string | null = media?.heroImageUrl ?? null;
  const gallery: Array<{ url: string; alt?: string | null }> = media?.gallery ?? [];

  const metaLine: string | null = anyTrip.metaLine ?? anyTrip.subtitle ?? null;
  const intro: string | null = anyTrip.intro ?? anyTrip.lead ?? null;

  const tags: string[] = (anyTrip.tags ?? anyTrip.badges ?? []) as string[];

  const ratingAverage: number | undefined = anyTrip?.ratings?.average ?? anyTrip?.ratingAverage ?? undefined;
  const ratingCount: number | undefined = anyTrip?.ratings?.count ?? anyTrip?.ratingCount ?? undefined;

  const fromPriceSEK: number | undefined = anyTrip.fromPriceSEK ?? anyTrip.priceFromSek ?? undefined;

  const description: string | null = anyTrip.description ?? anyTrip.about ?? null;

  const facts = (anyTrip.facts ?? {}) as any;
  const factDuration = facts.durationLabel ?? facts.travelLength ?? null;
  const factAccommodation = facts.accommodation ?? null;
  const factMeals = facts.meals ?? null;

  const itinerary = pickItinerary(anyTrip);
  const programSummary = pickProgramSummary(anyTrip);

  const includes: IncludeItem[] = normalizeIncludes(media?.includes ?? anyTrip?.includes ?? null);

  const tripType = String(anyTrip.type ?? "").toUpperCase();
  const isMultiTrip = tripType === "MULTI";

  const [openDay, setOpenDay] = useState<number>(-1);

  const pickupLabel = useMemo(() => {
    return pickupOptions.find((p) => p.id === pickupId)?.label ?? pickupId ?? "—";
  }, [pickupOptions, pickupId]);

  const prettyDate = date?.trim() ? date : "—";

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16">
      <div className="pt-6" />

      {/* Media grid */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 p-2">
          {/* Hero */}
          <div className="col-span-12 md:col-span-9">
            <div className="relative aspect-[16/8] w-full overflow-hidden rounded-2xl bg-gray-100">
              {renderHeroMedia({ title: trip.title, heroVideoUrl, heroImageUrl })}
            </div>
          </div>

          {/* Side images (2) */}
          <div className="col-span-12 md:col-span-3">
            <div className="grid h-full grid-rows-2 gap-2">
              {[gallery[2], gallery[3]].map((g, idx) => (
                <div key={idx} className="overflow-hidden rounded-2xl bg-gray-100">
                  {g?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.url} alt={g.alt ?? "Miljöbild"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">Miljöbild {idx + 3}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom images (3) */}
          <div className="col-span-12">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {[gallery[0], gallery[1], gallery[4]].map((g, idx) => (
                <div key={idx} className="aspect-[16/7] overflow-hidden rounded-2xl bg-gray-100">
                  {g?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.url} alt={g.alt ?? "Miljöbild"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">Miljöbild {idx + 1}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Title + intro */}
      <div className="mt-6">
        {metaLine ? <div className="text-sm text-gray-500">{metaLine}</div> : null}
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">{trip.title}</h1>
        {intro ? <p className="mt-2 text-sm text-gray-600">{intro}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.slice(0, 6).map((t) => (
            <span key={t} className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              {t}
            </span>
          ))}

          <div className="ml-1">
            <Stars average={ratingAverage} count={ratingCount} />
          </div>
        </div>
      </div>

      {/* BOKNINGSBOXAR */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Välj datum &amp; upphämtning i sökaren ovan</div>

          <div className="mt-1 text-sm text-gray-600">
            Val nu: <span className="font-semibold text-gray-900">{pickupLabel}</span> • Datum:{" "}
            <span className="font-semibold text-gray-900">{prettyDate}</span> • {adults} vuxna, {children} barn
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-2xl border bg-white px-4 py-3">
              <div className="text-xs font-semibold text-gray-500">Lägsta pris</div>
              <div className="text-sm font-semibold text-gray-900">
                Från {typeof fromPriceSEK === "number" ? `${fromPriceSEK} kr` : "—"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="h-10 inline-flex items-center rounded-xl border bg-white px-3 text-sm font-semibold text-gray-900">
                Från: {pickupLabel}
              </div>

              <div className="h-10 inline-flex items-center rounded-xl border bg-white px-3 text-sm font-semibold text-gray-900">
                Datum: {prettyDate}
              </div>

              <Link
                href={bookHref}
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white hover:opacity-95"
                style={{ background: "var(--hb-accent)" }}
              >
                Boka
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Info className="h-4 w-4 text-gray-700" />
            Mer fakta
          </div>
          <div className="mt-2 text-sm text-gray-600">Praktisk info, tider, vad som ingår.</div>

          {onScrollToFacts ? (
            <button
              type="button"
              onClick={onScrollToFacts}
              className="mt-4 inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Visa mer
            </button>
          ) : null}
        </div>
      </div>

      {/* Om resan */}
      {description ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Om resan</div>
          <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{description}</div>
        </div>
      ) : null}

      {/* Mer fakta */}
      {factDuration || factAccommodation || factMeals ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm" id="facts">
          <div className="text-sm font-semibold text-gray-900">Mer fakta</div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Reslängd</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{factDuration ?? "—"}</div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Boende</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{factAccommodation ?? "—"}</div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Måltider</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{factMeals ?? "—"}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Detta ingår */}
      {includes.length ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Detta ingår</div>
          <div className="mt-3 space-y-2">
            {includes.map((it) => {
              const Icon = iconForInclude(it.id);
              return (
                <div key={it.id} className="flex items-start gap-3 rounded-xl border bg-gray-50 px-4 py-3">
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4 text-gray-700" />
                  </div>
                  <div className="text-sm text-gray-800">{it.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ✅ PROGRAM (Flerdags) */}
      {isMultiTrip && (programSummary || itinerary.length > 0) ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Program</div>

          {programSummary ? (
            <div className="mt-3 rounded-2xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Program i korthet</div>
              <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{programSummary}</div>
            </div>
          ) : null}

          {itinerary.length ? (
            <div className="mt-4 space-y-3">
              {itinerary.map((d, idx) => {
                const title = String(d?.title ?? d?.dayTitle ?? d?.name ?? `Dag ${idx + 1}`);
                const body = d?.body ?? d?.description ?? d?.content ?? d?.program ?? "";

                const open = openDay === idx;

                return (
                  <div key={idx} className="rounded-2xl border bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setOpenDay((cur) => (cur === idx ? -1 : idx))}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        Dag {idx + 1} • {title}
                      </div>

                      <div className="text-gray-700">
                        <Chevron open={open} />
                      </div>
                    </button>

                    {open ? (
                      <div className="px-4 pb-4">
                        <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                          {String(body || "").trim() ? body : "—"}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-600">Dagsrader saknas just nu.</div>
          )}
        </div>
      ) : null}

      {/* Liknande resor */}
      {otherTrips.length ? (
        <div className="mt-8">
          <div className="text-sm font-semibold text-gray-900">Du kanske också gillar</div>

          <div className="mt-3 flex gap-3 overflow-x-auto pb-2 md:hidden">
            {otherTrips.map((t) => {
              const anyT = t as any;
              const cover = coverForTrip(t);
              const tIntro = anyT.intro ?? anyT.lead ?? null;
              const tFrom = anyT.fromPriceSEK ?? anyT.priceFromSek ?? undefined;

              return (
                <Link
                  key={t.id}
                  href={`/resor/${t.slug}`}
                  className="min-w-[260px] snap-start overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="h-28 bg-gray-200">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={t.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                    {tIntro ? <div className="mt-1 text-xs text-gray-600">{tIntro}</div> : null}
                    <div className="mt-3 text-xs font-semibold text-gray-900">
                      Från {typeof tFrom === "number" ? `${tFrom} kr` : "—"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 hidden grid-cols-3 gap-4 md:grid">
            {otherTrips.map((t) => {
              const anyT = t as any;
              const cover = coverForTrip(t);
              const tMeta = anyT.metaLine ?? anyT.subtitle ?? null;
              const tIntro = anyT.intro ?? anyT.lead ?? null;
              const tFrom = anyT.fromPriceSEK ?? anyT.priceFromSek ?? undefined;

              return (
                <Link
                  key={t.id}
                  href={`/resor/${t.slug}`}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="h-32 bg-gray-200">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={t.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    {tMeta ? <div className="text-xs text-gray-500">{tMeta}</div> : null}
                    <div className="mt-1 text-sm font-semibold text-gray-900">{t.title}</div>
                    {tIntro ? <div className="mt-1 text-xs text-gray-600">{tIntro}</div> : null}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-900">
                        Från {typeof tFrom === "number" ? `${tFrom} kr` : "—"}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: "var(--hb-accent)" }}>
                        Läs mer →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
