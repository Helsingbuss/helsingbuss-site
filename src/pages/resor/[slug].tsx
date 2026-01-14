// src/pages/resor/[slug].tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

import { PublicLayout } from "@/components/sundra/public/PublicLayout";
import { TripTemplate } from "@/components/sundra/public/trips/TripTemplate";

// ---------- helpers ----------
function parseIntSafe(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toUpperTripType(v: any) {
  const t = String(v ?? "DAY").toUpperCase();
  return t === "MULTI" || t === "FUN" ? t : "DAY";
}

function toNumberOrNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

function normalizeMedia(v: any) {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? v : {};
}

// ✅ NYTT: itinerary/dagsprogram kan ligga som array, json-string eller under annat fältnamn
function normalizeItinerary(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function extractLikelyItinerary(row: any): any[] {
  if (!row || typeof row !== "object") return [];

  const directCandidates = [
    row.itinerary,
    row.itinerary_json,
    row.itineraryRaw,
    row.itinerary_raw,
    row.day_programs,
    row.dayPrograms,
    row.days_program,
    row.programDays,
    row.days,
    row.program,
    row.schedule,
    row.dagsprogram,
    row.dagsprogram_json,
  ];

  for (const c of directCandidates) {
    const arr = normalizeItinerary(c);
    if (arr.length) return arr;
  }

  // Scanna keys som ser relevanta ut
  for (const [key, value] of Object.entries(row)) {
    if (!/itinerary|program|dag|day|schema|schedule/i.test(key)) continue;
    const arr = normalizeItinerary(value);
    if (arr.length) return arr;
  }

  // Scanna vanliga nestade objekt
  const nestedCandidates = [row.data, row.content, row.details].filter(
    (x: any) => x && typeof x === "object"
  );

  for (const obj of nestedCandidates) {
    for (const [key, value] of Object.entries(obj)) {
      if (!/itinerary|program|dag|day|schema|schedule/i.test(key)) continue;
      const arr = normalizeItinerary(value);
      if (arr.length) return arr;
    }
  }

  return [];
}

function extractProgramSummary(row: any): string | null {
  if (!row || typeof row !== "object") return null;

  const direct = [
    row.programSummary,
    row.program_summary,
    row.itinerarySummary,
    row.itinerary_summary,
    row.program_short,
    row.program_intro,
    row.short_program,
    row.kort_program,
  ].find((v: any) => typeof v === "string" && v.trim().length);

  if (typeof direct === "string") return direct.trim();

  for (const [key, value] of Object.entries(row)) {
    if (!/summary|kort|intro/i.test(key)) continue;
    if (typeof value === "string" && value.trim().length) return value.trim();
  }

  return null;
}

// Mappar DB-row -> samma shape som TripTemplate gillar
function normalizeTrip(row: any) {
  if (!row) return null;

  const media = normalizeMedia(row.media);

  // ✅ NYTT: fånga dagsprogram/itinerary + kort programtext
  const itinerary = extractLikelyItinerary(row);
  const programSummary = extractProgramSummary(row);

  return {
    ...row,

    metaLine: row.metaLine ?? row.meta_line ?? "",
    fromPriceSEK: toNumberOrNull(
      row.fromPriceSEK ?? row.from_price_sek ?? row.price_from_sek ?? row.from_price
    ),
    tags: normalizeTags(row.tags),
    media,

    intro: row.intro ?? "",
    description: row.description ?? row.about ?? "",

    // ✅ Viktigt: dessa två används i TripTemplate
    itinerary,
    programSummary,

    title: row.title ?? "",
    slug: row.slug ?? "",
    status: String(row.status ?? "draft").toLowerCase(),
    type: toUpperTripType(row.type),
  };
}

function getSupabasePublic() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env (URL/ANON KEY).");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------- SSR ----------
export async function getServerSideProps(ctx: any) {
  const slug = typeof ctx.params?.slug === "string" ? ctx.params.slug : "";
  const preview = ctx.query?.preview === "1";
  const previewId = typeof ctx.query?.previewId === "string" ? ctx.query.previewId : null;

  if (!slug) return { notFound: true };

  const supabase = getSupabasePublic();

  // 1) Hämta resa
  let tripRow: any = null;

  if (preview && previewId) {
    const { data, error } = await supabase.from("trips").select("*").eq("id", previewId).single();
    if (error || !data) return { notFound: true };
    tripRow = data;
  } else {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return { notFound: true };
    tripRow = data;
  }

  const trip = normalizeTrip(tripRow);
  if (!trip || !trip.id) return { notFound: true };

  // 2) Hämta andra publicerade resor
  const { data: otherRows } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "published")
    .neq("id", trip.id)
    .order("updated_at", { ascending: false })
    .limit(3);

  const otherTrips = (otherRows ?? []).map(normalizeTrip).filter(Boolean);

  return {
    props: {
      trip,
      otherTrips,
      isPreview: preview && !!previewId,
      previewId: previewId,
    },
  };
}

// ---------- Page ----------
export default function PublicTripPage(props: {
  trip: any;
  otherTrips: any[];
  isPreview: boolean;
  previewId: string | null;
}) {
  const router = useRouter();

  const trip = props.trip;
  const otherTrips = props.otherTrips ?? [];

  const routeSlug = typeof router.query.slug === "string" ? router.query.slug : "";
  const effectiveSlug = String(trip?.slug || routeSlug || "");

  const pickupOptions = useMemo(
    () => [
      { id: "hb", label: "Helsingborg C" },
      { id: "ag", label: "Ängelholm Station" },
      { id: "la", label: "Landskrona Station" },
      { id: "ma", label: "Malmö C" },
    ],
    []
  );

  const pickupId = (router.query.p as string) || pickupOptions[0]?.id || "hb";
  const date = (router.query.d as string) || "";
  const adults = parseIntSafe(router.query.a, 2);
  const children = parseIntSafe(router.query.c, 0);

  const onChangePickup = useCallback(
    (nextPickupId: string) => {
      router.replace(
        {
          pathname: `/resor/${effectiveSlug}`,
          query: {
            ...router.query,
            p: nextPickupId,
          },
        },
        undefined,
        { shallow: true }
      );
    },
    [router, effectiveSlug]
  );

  const bookHref = useMemo(() => {
    const base: any = {
      pathname: "/bokning",
      query: {
        trip: effectiveSlug,
        p: pickupId,
        d: date || "",
        a: String(adults),
        c: String(children),
      },
    };

    if (props.isPreview && props.previewId) {
      base.query.preview = "1";
      base.query.previewId = props.previewId;
    }

    return base;
  }, [effectiveSlug, pickupId, date, adults, children, props.isPreview, props.previewId]);

  const onScrollToFacts = useCallback(() => {
    const el = document.getElementById("facts");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!trip) {
    return (
      <PublicLayout>
        <Head>
          <title>Resa | Sundra</title>
        </Head>
        <div className="mx-auto max-w-[1100px] px-4 py-14">
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-700">
            Resan hittades inte (eller är inte publicerad).
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Head>
        <title>{trip.title} | Sundra</title>
        {props.isPreview ? <meta name="robots" content="noindex,nofollow" /> : null}
      </Head>

      {props.isPreview ? (
        <div className="mx-auto max-w-[1100px] px-4 pt-4">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-900">
            Förhandsvisning (utkast) – bara du ser detta
          </div>
        </div>
      ) : null}

      <TripTemplate
        trip={trip}
        pickupId={pickupId}
        date={date}
        adults={adults}
        children={children}
        pickupOptions={pickupOptions}
        onChangePickup={onChangePickup}
        bookHref={bookHref}
        onScrollToFacts={onScrollToFacts}
        otherTrips={otherTrips}
      />
    </PublicLayout>
  );
}
