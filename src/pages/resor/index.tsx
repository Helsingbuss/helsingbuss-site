import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { PublicLayout } from "@/components/sundra/public/PublicLayout";

type TabKey = "ALL" | "DAY" | "MULTI" | "FUN" | "WINTER" | "CRUISE";
type TripType = "DAY" | "MULTI" | "FUN";

type PublicFilters = {
  tab: TabKey;
  pickupId: string;
  date: string; // YYYY-MM-DD
  adults: number;
  children: number;
};

type Trip = {
  id: string;
  slug: string;
  type: TripType;
  title: string;
  intro: string;
  fromPriceSEK?: number;
  coverUrl?: string;
  published: boolean;

  // ✅ används för kategori-filter (jul/kryssning)
  tags: string[];
};

type Departure = {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  pickupId: string;
  pickupLabel: string;
  seatsLeft: number;
  status: "OPEN" | "SOLD_OUT" | "CANCELLED";
};

function typeLabel(type: TripType) {
  if (type === "DAY") return "Dagsresa";
  if (type === "MULTI") return "Flerdagsresa";
  return "Nöjesresa";
}

function typeBadgeClass(type: TripType) {
  if (type === "DAY") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (type === "MULTI") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
}

function parseIntSafe(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toUpperTripType(v: any): TripType {
  const t = String(v ?? "DAY").toUpperCase();
  return t === "MULTI" || t === "FUN" ? (t as TripType) : "DAY";
}

function normalizeTab(t: unknown): TabKey {
  // ✅ Om inget valt -> visa ALLA
  if (t === undefined || t === null || String(t).trim() === "") return "ALL";

  const s = String(t).toUpperCase();
  if (s === "ALL") return "ALL";
  if (s === "DAY" || s === "MULTI" || s === "FUN") return s as TabKey;
  if (s === "WINTER" || s === "CRUISE") return s as TabKey;
  return "ALL";
}

function normalizeTags(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function hasAnyTag(tripTags: string[], wanted: string[]) {
  const set = new Set(tripTags.map((t) => t.toLowerCase()));
  return wanted.some((w) => set.has(w.toLowerCase()));
}

// --- Supabase (server-side) ---
function getSupabasePublic() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env (URL/ANON KEY).");
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeTripRow(row: any): Trip {
  const media = row?.media ?? {};
  const coverUrl =
    media?.heroImageUrl ||
    row?.hero_image_url ||
    row?.cover_url ||
    row?.coverUrl ||
    undefined;

  const fromPrice =
    row?.from_price_sek ??
    row?.fromPriceSEK ??
    row?.price_from_sek ??
    row?.from_price ??
    undefined;

  const statusRaw = String(row?.status ?? "").toLowerCase();

  // ✅ tags kan ligga i row.tags eller i media.tags (om någon gång)
  const tags = normalizeTags(row?.tags ?? media?.tags ?? []);

  return {
    id: String(row?.id ?? ""),
    slug: String(row?.slug ?? ""),
    type: toUpperTripType(row?.type),
    title: String(row?.title ?? ""),
    intro: String(row?.intro ?? ""),
    fromPriceSEK: typeof fromPrice === "number" ? fromPrice : undefined,
    coverUrl,
    published: statusRaw === "published",
    tags,
  };
}

export async function getServerSideProps() {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      props: {
        initialTrips: [],
        departuresEnabled: false,
      },
    };
  }

  const initialTrips: Trip[] = (data ?? [])
    .map(normalizeTripRow)
    .filter((t) => t.id && t.slug && t.title);

  return {
    props: {
      initialTrips,
      departuresEnabled: false,
    },
  };
}

export default function PublicTripsIndexPage(props: {
  initialTrips: Trip[];
  departuresEnabled: boolean;
}) {
  const router = useRouter();

  // === Upphämtningsplatser ===
  const pickupOptions = useMemo(
    () => [
      { id: "hb", label: "Helsingborg C" },
      { id: "ag", label: "Ängelholm Station" },
      { id: "la", label: "Landskrona Station" },
      { id: "ma", label: "Malmö C" },
    ],
    []
  );

  // ✅ Resor från Supabase
  const trips: Trip[] = useMemo(() => props.initialTrips ?? [], [props.initialTrips]);

  // Avgångar – kopplas senare
  const departures: Departure[] = useMemo(() => [], []);

  // ✅ Läs filter från query (stöder flera param-namn så den "kopplas" mot header-sök)
  const qTab = (router.query.t ?? router.query.type ?? router.query.tab) as any;
  const qPickup = (router.query.p ?? router.query.pickup ?? router.query.pickupId) as any;
  const qDate = (router.query.d ?? router.query.date) as any;
  const qAdults = (router.query.a ?? router.query.adults) as any;
  const qChildren = (router.query.c ?? router.query.children) as any;

  const initialTab = normalizeTab(qTab);
  const initialPickup = (qPickup as string) || pickupOptions[0]?.id || "";
  const initialDate = (qDate as string) || "";
  const initialAdults = parseIntSafe(qAdults, 2);
  const initialChildren = parseIntSafe(qChildren, 0);

  const [filters, setFilters] = useState<PublicFilters>({
    tab: initialTab,
    pickupId: initialPickup,
    date: initialDate,
    adults: initialAdults,
    children: initialChildren,
  });

  // Sync state om query ändras (back/forward)
  useEffect(() => {
    const t = normalizeTab(router.query.t ?? router.query.type ?? router.query.tab);
    const p =
      (router.query.p ?? (router.query.pickup ?? router.query.pickupId) as any) ||
      pickupOptions[0]?.id ||
      "";
    const d = (router.query.d ?? router.query.date as any) || "";
    const a = parseIntSafe(router.query.a ?? router.query.adults, 2);
    const c = parseIntSafe(router.query.c ?? router.query.children, 0);

    setFilters({
      tab: t,
      pickupId: String(p),
      date: String(d),
      adults: a,
      children: c,
    });
  }, [
    router.query.t,
    router.query.type,
    router.query.tab,
    router.query.p,
    router.query.pickup,
    router.query.pickupId,
    router.query.d,
    router.query.date,
    router.query.a,
    router.query.adults,
    router.query.c,
    router.query.children,
    pickupOptions,
  ]);

  function pushFilters(values: PublicFilters) {
    setFilters(values);

    const nextQuery: Record<string, string> = {
      p: values.pickupId,
      d: values.date || "",
      a: String(values.adults),
      c: String(values.children),
    };

    // ✅ Om ALL: skicka ingen t (då blir “alla resor” standard)
    if (values.tab !== "ALL") nextQuery.t = values.tab;

    router.push(
      {
        pathname: "/resor",
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    );
  }

  // === Filtrera resor (publicerade + ev typ/kategori) ===
  const visibleTrips = useMemo(() => {
    const base = trips.filter((t) => t.published);

    if (filters.tab === "ALL") return base;

    // ✅ Nya kategorier via tags
    if (filters.tab === "WINTER") {
      return base.filter((t) =>
        hasAnyTag(t.tags ?? [], ["julmarknad", "jul", "vinter", "julresa", "julmarknader"])
      );
    }
    if (filters.tab === "CRUISE") {
      return base.filter((t) => hasAnyTag(t.tags ?? [], ["kryssning", "kryssningar", "cruise"]));
    }

    // ✅ Gamla typer
    const wantedType: TripType =
      filters.tab === "MULTI" ? "MULTI" : filters.tab === "FUN" ? "FUN" : "DAY";
    return base.filter((t) => t.type === wantedType);
  }, [trips, filters.tab]);

  // === Matchande avgångar per resa (pickup + datum om angivet) ===
  const departuresByTrip = useMemo(() => {
    const map = new Map<string, Departure[]>();
    for (const trip of visibleTrips) {
      const list = departures
        .filter((d) => d.tripId === trip.id)
        .filter((d) => d.pickupId === filters.pickupId)
        .filter((d) => (filters.date ? d.date === filters.date : true))
        .filter((d) => d.status !== "CANCELLED")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      map.set(trip.id, list);
    }
    return map;
  }, [visibleTrips, departures, filters.pickupId, filters.date]);

  const pickupLabel = useMemo(() => {
    return pickupOptions.find((p) => p.id === filters.pickupId)?.label || "—";
  }, [filters.pickupId, pickupOptions]);

  const currentTypeLabel = useMemo(() => {
    if (filters.tab === "ALL") return "Alla resor";
    if (filters.tab === "WINTER") return "Vinter/jul";
    if (filters.tab === "CRUISE") return "Kryssningar";

    const t: TripType =
      filters.tab === "MULTI" ? "MULTI" : filters.tab === "FUN" ? "FUN" : "DAY";
    return typeLabel(t);
  }, [filters.tab]);

  return (
    <PublicLayout>
      <Head>
        <title>Resor | Sundra</title>
      </Head>

      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Resor</h1>
            <div className="mt-1 text-sm text-gray-600">
              {currentTypeLabel} • Upphämtning:{" "}
              <span className="font-semibold text-gray-900">{pickupLabel}</span>
              {filters.date ? (
                <>
                  {" "}
                  • Datum: <span className="font-semibold text-gray-900">{filters.date}</span>
                </>
              ) : null}{" "}
              • {filters.adults} vuxna, {filters.children} barn
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              pushFilters({
                tab: "ALL",
                pickupId: pickupOptions[0]?.id || "",
                date: "",
                adults: 2,
                children: 0,
              })
            }
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Rensa filter
          </button>
        </div>

        {visibleTrips.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-700">
            Inga resor hittades för vald kategori.
          </div>
        ) : (
          <>
            {/* ✅ MOBIL + SURFPLATTA: KARUSELL */}
            <div className="flex gap-5 overflow-x-auto pb-2 lg:hidden">
              {visibleTrips.map((trip) => {
                const list = departuresByTrip.get(trip.id) ?? [];
                const hasDateFilter = Boolean(filters.date);

                return (
                  <div
                    key={trip.id}
                    className="snap-start"
                    style={{ minWidth: "320px", width: "320px" }}
                  >
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
                      <div className="relative h-44 bg-gray-200">
                        {trip.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={trip.coverUrl}
                            alt={trip.title}
                            className="h-full w-full object-cover"
                          />
                        ) : null}

                        <div className="absolute left-4 top-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${typeBadgeClass(
                              trip.type
                            )}`}
                          >
                            {typeLabel(trip.type)}
                          </span>
                        </div>

                        {typeof trip.fromPriceSEK === "number" ? (
                          <div className="absolute bottom-4 right-4 rounded-2xl border bg-white/90 px-4 py-2 text-right backdrop-blur">
                            <div className="text-[11px] font-semibold text-gray-500">Från</div>
                            <div className="text-lg font-bold text-gray-900">{trip.fromPriceSEK} kr</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="text-lg font-semibold text-gray-900">{trip.title}</div>
                        <div className="mt-2 text-sm text-gray-600">{trip.intro}</div>

                        <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                          <div className="text-xs font-semibold text-gray-500">
                            Tillgängliga avgångar från{" "}
                            <span className="text-gray-900">{pickupLabel}</span>
                            {hasDateFilter ? (
                              <>
                                {" "}
                                den <span className="text-gray-900">{filters.date}</span>
                              </>
                            ) : null}
                          </div>

                          {!props.departuresEnabled ? (
                            <div className="mt-2 text-sm text-gray-700">
                              Avgångar kopplas in snart – resan är publicerad och redo ✅
                            </div>
                          ) : list.length === 0 ? (
                            <div className="mt-2 text-sm text-gray-700">
                              Inga avgångar matchade just nu. Prova annat datum eller upphämtning.
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {list.slice(0, 2).map((d) => (
                                <div
                                  key={d.id}
                                  className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2"
                                >
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {d.date} • {d.time}
                                    </div>
                                    <div className="text-xs text-gray-500">{d.pickupLabel}</div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={[
                                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                                        d.status === "OPEN" && d.seatsLeft > 0
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-gray-100 text-gray-700",
                                      ].join(" ")}
                                    >
                                      {d.status === "SOLD_OUT" || d.seatsLeft === 0
                                        ? "Fullbokad"
                                        : `${d.seatsLeft} platser`}
                                    </span>

                                    <Link
                                      href={{
                                        pathname: `/resor/${trip.slug}`,
                                        query: {
                                          ...(filters.tab !== "ALL" ? { t: filters.tab } : {}),
                                          p: filters.pickupId,
                                          d: filters.date || d.date,
                                          a: String(filters.adults),
                                          c: String(filters.children),
                                          dep: d.id,
                                        },
                                      }}
                                      className="rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
                                      style={{ background: "var(--hb-primary)" }}
                                    >
                                      Välj
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <Link
                            href={`/resor/${trip.slug}`}
                            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Läs mer
                          </Link>

                          <Link
                            href={{
                              pathname: `/resor/${trip.slug}`,
                              query: {
                                ...(filters.tab !== "ALL" ? { t: filters.tab } : {}),
                                p: filters.pickupId,
                                d: filters.date || "",
                                a: String(filters.adults),
                                c: String(filters.children),
                              },
                            }}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: "var(--hb-accent)" }}
                          >
                            Boka
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ DESKTOP: GRID */}
            <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid xl:grid-cols-3 lg:grid-cols-3">
              {visibleTrips.map((trip) => {
                const list = departuresByTrip.get(trip.id) ?? [];
                const hasDateFilter = Boolean(filters.date);

                return (
                  <div key={trip.id} className="flex overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="flex w-full flex-col">
                      <div className="relative h-44 bg-gray-200">
                        {trip.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={trip.coverUrl} alt={trip.title} className="h-full w-full object-cover" />
                        ) : null}

                        <div className="absolute left-4 top-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${typeBadgeClass(
                              trip.type
                            )}`}
                          >
                            {typeLabel(trip.type)}
                          </span>
                        </div>

                        {typeof trip.fromPriceSEK === "number" ? (
                          <div className="absolute bottom-4 right-4 rounded-2xl border bg-white/90 px-4 py-2 text-right backdrop-blur">
                            <div className="text-[11px] font-semibold text-gray-500">Från</div>
                            <div className="text-lg font-bold text-gray-900">{trip.fromPriceSEK} kr</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="p-5">
                        <div className="text-lg font-semibold text-gray-900">{trip.title}</div>
                        <div className="mt-2 text-sm text-gray-600">{trip.intro}</div>

                        <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                          <div className="text-xs font-semibold text-gray-500">
                            Tillgängliga avgångar från{" "}
                            <span className="text-gray-900">{pickupLabel}</span>
                            {hasDateFilter ? (
                              <>
                                {" "}
                                den <span className="text-gray-900">{filters.date}</span>
                              </>
                            ) : null}
                          </div>

                          {!props.departuresEnabled ? (
                            <div className="mt-2 text-sm text-gray-700">
                              Avgångar kopplas in snart – resan är publicerad och redo ✅
                            </div>
                          ) : list.length === 0 ? (
                            <div className="mt-2 text-sm text-gray-700">
                              Inga avgångar matchade just nu. Prova annat datum eller upphämtning.
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {list.slice(0, 3).map((d) => (
                                <div
                                  key={d.id}
                                  className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2"
                                >
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {d.date} • {d.time}
                                    </div>
                                    <div className="text-xs text-gray-500">{d.pickupLabel}</div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={[
                                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                                        d.status === "OPEN" && d.seatsLeft > 0
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-gray-100 text-gray-700",
                                      ].join(" ")}
                                    >
                                      {d.status === "SOLD_OUT" || d.seatsLeft === 0
                                        ? "Fullbokad"
                                        : `${d.seatsLeft} platser`}
                                    </span>

                                    <Link
                                      href={{
                                        pathname: `/resor/${trip.slug}`,
                                        query: {
                                          ...(filters.tab !== "ALL" ? { t: filters.tab } : {}),
                                          p: filters.pickupId,
                                          d: filters.date || d.date,
                                          a: String(filters.adults),
                                          c: String(filters.children),
                                          dep: d.id,
                                        },
                                      }}
                                      className="rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
                                      style={{ background: "var(--hb-primary)" }}
                                    >
                                      Välj
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <Link
                            href={`/resor/${trip.slug}`}
                            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Läs mer
                          </Link>

                          <Link
                            href={{
                              pathname: `/resor/${trip.slug}`,
                              query: {
                                ...(filters.tab !== "ALL" ? { t: filters.tab } : {}),
                                p: filters.pickupId,
                                d: filters.date || "",
                                a: String(filters.adults),
                                c: String(filters.children),
                              },
                            }}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: "var(--hb-accent)" }}
                          >
                            Boka
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .lg\\:hidden {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </PublicLayout>
  );
}
