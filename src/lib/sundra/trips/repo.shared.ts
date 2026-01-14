import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "./slug";
import type { TripRecord, TripStatus, TripType } from "./types";

/**
 * ⚠️ Om dina kolumnnamn skiljer sig i SQL:
 * ÄNDRA BARA HÄR så slipper du jaga i hela koden.
 */
const COL = {
  table: "trips",
  id: "id",
  createdAt: "created_at",
  updatedAt: "updated_at",
  status: "status",
  type: "type", // om du i DB har "trip_type" -> ändra här till "trip_type"
  title: "title",
  slug: "slug",
  subtitle: "subtitle",
  lead: "lead",
  about: "about",
  durationDays: "duration_days",
  priceFromSek: "price_from_sek",
  badges: "badges",
  facts: "facts",
  ratingAverage: "rating_average",
  ratingCount: "rating_count",
  itinerary: "itinerary",
  media: "media",
} as const;

const SELECT = [
  COL.id,
  COL.createdAt,
  COL.updatedAt,
  COL.status,
  COL.type,
  COL.title,
  COL.slug,
  COL.subtitle,
  COL.lead,
  COL.about,
  COL.durationDays,
  COL.priceFromSek,
  COL.badges,
  COL.facts,
  COL.ratingAverage,
  COL.ratingCount,
  COL.itinerary,
  COL.media,
].join(", ");

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeTrip(row: any): TripRecord {
  const media = row?.[COL.media] ?? null;

  return {
    id: row?.[COL.id],
    createdAt: row?.[COL.createdAt] ?? null,
    updatedAt: row?.[COL.updatedAt] ?? null,

    status: (row?.[COL.status] ?? "draft") as TripStatus,
    type: (row?.[COL.type] ?? "day") as TripType,

    title: row?.[COL.title] ?? "",
    slug: row?.[COL.slug] ?? "",

    subtitle: row?.[COL.subtitle] ?? null,
    lead: row?.[COL.lead] ?? null,
    about: row?.[COL.about] ?? null,

    durationDays: num(row?.[COL.durationDays]),
    priceFromSek: num(row?.[COL.priceFromSek]),

    badges: row?.[COL.badges] ?? [],
    facts: row?.[COL.facts] ?? null,

    ratingAverage: num(row?.[COL.ratingAverage]),
    ratingCount: num(row?.[COL.ratingCount]),

    itinerary: row?.[COL.itinerary] ?? null,
    media: media ?? null,
  };
}

async function getUniqueSlug(supabase: SupabaseClient, base: string): Promise<string> {
  const safeBase = slugify(base) || "resa";
  const { data, error } = await supabase
    .from(COL.table)
    .select(`${COL.slug}`)
    .ilike(COL.slug, `${safeBase}%`);

  if (error) throw error;

  const existing = new Set((data ?? []).map((r: any) => r?.[COL.slug]).filter(Boolean));
  if (!existing.has(safeBase)) return safeBase;

  let i = 2;
  while (existing.has(`${safeBase}-${i}`)) i++;
  return `${safeBase}-${i}`;
}

export function makeTripRepo(supabase: SupabaseClient) {
  return {
    async listTrips(opts?: { status?: TripStatus; limit?: number }) {
      const limit = opts?.limit ?? 200;

      let q = supabase.from(COL.table).select(SELECT).order(COL.createdAt, { ascending: false }).limit(limit);
      if (opts?.status) q = q.eq(COL.status, opts.status);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(normalizeTrip);
    },

    async listPublishedTrips(limit = 200) {
      const { data, error } = await supabase
        .from(COL.table)
        .select(SELECT)
        .eq(COL.status, "published")
        .order(COL.createdAt, { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(normalizeTrip);
    },

    async getTripById(id: string) {
      const { data, error } = await supabase
        .from(COL.table)
        .select(SELECT)
        .eq(COL.id, id)
        .maybeSingle();

      if (error) throw error;
      return data ? normalizeTrip(data) : null;
    },

    async getTripBySlug(slug: string, status?: TripStatus) {
      let q = supabase.from(COL.table).select(SELECT).eq(COL.slug, slug);
      if (status) q = q.eq(COL.status, status);

      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data ? normalizeTrip(data) : null;
    },

    async createDraftTrip(input: { title: string; type: TripType }) {
      const slug = await getUniqueSlug(supabase, input.title);

      const payload: any = {
        [COL.status]: "draft",
        [COL.type]: input.type,
        [COL.title]: input.title,
        [COL.slug]: slug,

        // säkra defaults (så UI aldrig kraschar)
        [COL.badges]: [],
        [COL.media]: { gallery: [] },
        [COL.facts]: {},
      };

      const { data, error } = await supabase
        .from(COL.table)
        .insert(payload)
        .select(SELECT)
        .single();

      if (error) throw error;
      return normalizeTrip(data);
    },

    async updateTrip(id: string, patch: Partial<TripRecord>) {
      const payload: any = {};

      if (patch.status) payload[COL.status] = patch.status;
      if (patch.type) payload[COL.type] = patch.type;

      if (patch.title !== undefined) payload[COL.title] = patch.title;
      if (patch.slug !== undefined) payload[COL.slug] = patch.slug;

      if (patch.subtitle !== undefined) payload[COL.subtitle] = patch.subtitle;
      if (patch.lead !== undefined) payload[COL.lead] = patch.lead;
      if (patch.about !== undefined) payload[COL.about] = patch.about;

      if (patch.durationDays !== undefined) payload[COL.durationDays] = patch.durationDays;
      if (patch.priceFromSek !== undefined) payload[COL.priceFromSek] = patch.priceFromSek;

      if (patch.badges !== undefined) payload[COL.badges] = patch.badges ?? [];
      if (patch.facts !== undefined) payload[COL.facts] = patch.facts ?? {};
      if (patch.media !== undefined) payload[COL.media] = patch.media ?? { gallery: [] };
      if (patch.itinerary !== undefined) payload[COL.itinerary] = patch.itinerary ?? null;

      const { data, error } = await supabase
        .from(COL.table)
        .update(payload)
        .eq(COL.id, id)
        .select(SELECT)
        .single();

      if (error) throw error;
      return normalizeTrip(data);
    },

    async publishTrip(id: string) {
      return this.updateTrip(id, { status: "published" });
    },

    async archiveTrip(id: string) {
      return this.updateTrip(id, { status: "archived" });
    },

    async listSimilarTrips(currentId: string, type: TripType, limit = 4) {
      const { data, error } = await supabase
        .from(COL.table)
        .select(SELECT)
        .eq(COL.status, "published")
        .eq(COL.type, type)
        .neq(COL.id, currentId)
        .order(COL.createdAt, { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(normalizeTrip);
    },
  };
}
