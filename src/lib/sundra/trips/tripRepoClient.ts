import { getSupabaseClient } from "@/lib/sundra/supabaseClient";

export type TripType = "DAY" | "MULTI" | "FUN";

export type PublicTripCard = {
  id: string;
  slug: string;
  type: TripType;
  title: string;
  intro: string;
  fromPriceSEK?: number | null;
  coverUrl?: string | null;
  tags?: string[];
};

export type PublicTripFull = PublicTripCard & {
  metaLine?: string | null;
  description?: string | null;
  media?: any;
  status?: "draft" | "published" | "archived";
};

function mapRowToTrip(row: any): PublicTripFull {
  const media = row.media ?? {};
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: row.title ?? "",
    intro: row.intro ?? "",
    description: row.description ?? null,
    metaLine: row.meta_line ?? null,
    fromPriceSEK: row.from_price_sek ?? null, // ✅ snake_case i DB
    tags: row.tags ?? [],
    media,
    coverUrl: media?.heroImageUrl ?? null,
    status: row.status,
  };
}

export async function fetchPublishedTrips(): Promise<PublicTripCard[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client saknas (env ej laddad).");

  const { data, error } = await supabase
    .from("trips")
    .select("id,slug,type,title,intro,from_price_sek,media,tags,status,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapRowToTrip);
}

export async function fetchPublishedTripBySlug(slug: string): Promise<PublicTripFull | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client saknas (env ej laddad).");

  const { data, error } = await supabase
    .from("trips")
    .select("id,slug,type,title,intro,description,meta_line,from_price_sek,media,tags,status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToTrip(data) : null;
}

export async function fetchTripByIdForPreview(id: string): Promise<PublicTripFull | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client saknas (env ej laddad).");

  const { data, error } = await supabase
    .from("trips")
    .select("id,slug,type,title,intro,description,meta_line,from_price_sek,media,tags,status")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToTrip(data) : null;
}

export async function fetchOtherPublishedTrips(excludeId: string, limit = 3): Promise<PublicTripCard[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client saknas (env ej laddad).");

  const { data, error } = await supabase
    .from("trips")
    .select("id,slug,type,title,intro,from_price_sek,media,tags,status,created_at")
    .eq("status", "published")
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapRowToTrip);
}
