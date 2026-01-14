import type { TripRecord, TripType } from "@/lib/sundra/trips/types";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

type TripStatus = "draft" | "published" | "archived";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTripRow(row: any): TripRecord {
  const data = row?.data ?? row?.content ?? {};
  const trip_type = row?.trip_type ?? row?.type ?? data?.type ?? "day";
  const status = row?.status ?? row?.state ?? data?.status ?? "draft";

  return {
    id: row.id,
    slug: row.slug ?? data.slug ?? "",
    title: row.title ?? data.title ?? "",
    type: trip_type,
    status,
    metaLine: data.metaLine ?? row.meta_line ?? null,
    intro: data.intro ?? null,
    tags: data.tags ?? [],
    fromPriceSEK: data.fromPriceSEK ?? row.from_price_sek ?? null,
    ratings: data.ratings ?? { average: null, count: null },
    media: data.media ?? { heroImageUrl: null, heroVideoUrl: null, gallery: [] },
    facts: data.facts ?? {},
    description: data.description ?? null,
    itinerary: data.itinerary ?? [],
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    publishedAt: row.published_at ?? null,
    archivedAt: row.archived_at ?? null,
  } as TripRecord;
}

async function tryInsertTrip(payloadBase: any, type: TripType, dataObj: any) {
  const variants = [
    { typeCol: "trip_type", dataCol: "data" },
    { typeCol: "type", dataCol: "data" },
    { typeCol: "trip_type", dataCol: "content" },
    { typeCol: "type", dataCol: "content" },
    { typeCol: "trip_type", dataCol: null },
    { typeCol: "type", dataCol: null },
  ];

  for (const v of variants) {
    const payload = { ...payloadBase, [v.typeCol]: type };
    if (v.dataCol) payload[v.dataCol] = dataObj;

    const { data, error } = await supabaseAdmin
      .from("trips")
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) return data;
  }

  throw new Error("Kunde inte skapa resa i Supabase (kolumnnamn matchar inte).");
}

async function tryUpdateTrip(id: string, patchBase: any, type: TripType, dataObj: any) {
  const variants = [
    { typeCol: "trip_type", dataCol: "data" },
    { typeCol: "type", dataCol: "data" },
    { typeCol: "trip_type", dataCol: "content" },
    { typeCol: "type", dataCol: "content" },
    { typeCol: "trip_type", dataCol: null },
    { typeCol: "type", dataCol: null },
  ];

  for (const v of variants) {
    const patch = { ...patchBase, [v.typeCol]: type };
    if (v.dataCol) patch[v.dataCol] = dataObj;

    const { data, error } = await supabaseAdmin
      .from("trips")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) return data;
  }

  throw new Error("Kunde inte uppdatera resa i Supabase (kolumnnamn matchar inte).");
}

async function tryStatusUpdate(id: string, patch: any) {
  const variants = [
    { statusCol: "status" },
    { statusCol: "state" },
  ];

  for (const v of variants) {
    const { data, error } = await supabaseAdmin
      .from("trips")
      .update({ ...patch, [v.statusCol]: patch.status ?? patch.state })
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) return data;
  }

  throw new Error("Kunde inte uppdatera status (status/state saknas).");
}

export async function adminListTrips(params: { status?: TripStatus | "all"; q?: string }) {
  const { status = "all", q = "" } = params;

  let query = supabaseAdmin.from("trips").select("*").order("updated_at", { ascending: false });

  if (status !== "all") {
    // testar både status/state genom att filtrera på status först, om DB använder state så får du ändra i SQL
    query = query.eq("status", status as any);
  }

  if (q.trim()) {
    // enkel sök (title/slug)
    query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(normalizeTripRow);
}

export async function adminGetTripById(id: string) {
  const { data, error } = await supabaseAdmin.from("trips").select("*").eq("id", id).single();
  if (error) return null;
  return normalizeTripRow(data);
}

export async function adminCreateDraftTrip(input: { title: string; type: TripType }) {
  const now = new Date().toISOString();
  const baseSlug = slugify(input.title);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const dataObj = {
    title: input.title,
    slug,
    type: input.type,
    status: "draft",
    tags: [],
    fromPriceSEK: null,
    metaLine: null,
    intro: null,
    description: null,
    ratings: { average: null, count: null },
    media: { heroImageUrl: null, heroVideoUrl: null, gallery: [] },
    facts: {},
    itinerary: [],
  };

  const row = await tryInsertTrip(
    {
      title: input.title,
      slug,
      status: "draft",
      created_at: now,
      updated_at: now,
    },
    input.type,
    dataObj
  );

  return normalizeTripRow(row);
}

export async function adminUpsertTrip(trip: TripRecord) {
  const now = new Date().toISOString();

  const dataObj = {
    title: trip.title,
    slug: trip.slug,
    type: trip.type,
    status: trip.status ?? "draft",
    metaLine: trip.metaLine ?? null,
    intro: trip.intro ?? null,
    tags: trip.tags ?? [],
    fromPriceSEK: trip.fromPriceSEK ?? null,
    ratings: trip.ratings ?? { average: null, count: null },
    media: trip.media ?? { heroImageUrl: null, heroVideoUrl: null, gallery: [] },
    facts: trip.facts ?? {},
    description: trip.description ?? null,
    itinerary: trip.itinerary ?? [],
  };

  const row = await tryUpdateTrip(
    trip.id,
    {
      title: trip.title,
      slug: trip.slug,
      updated_at: now,
      status: trip.status ?? "draft",
    },
    trip.type,
    dataObj
  );

  return normalizeTripRow(row);
}

export async function adminPublishTrip(id: string) {
  const now = new Date().toISOString();
  const row = await tryStatusUpdate(id, { status: "published", published_at: now, updated_at: now });
  return normalizeTripRow(row);
}

export async function adminArchiveTrip(id: string) {
  const now = new Date().toISOString();
  const row = await tryStatusUpdate(id, { status: "archived", archived_at: now, updated_at: now });
  return normalizeTripRow(row);
}
