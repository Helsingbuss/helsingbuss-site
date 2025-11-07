// src/pages/api/public/trips/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // cachea 1 min + SWR 5 min
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
}

type TripRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  hero_image?: string | null;
  trip_kind?: "flerdagar" | "dagsresa" | "shopping" | string | null;
  city?: string | null;
  country?: string | null;
  year?: number | null;
  price_from?: number | null;
  next_date?: string | null;
  external_url?: string | null;
  ribbon?: string | null;
  published?: boolean | null;
  created_at?: string | null;
  slug?: string | null;
};

function mapRow(t: TripRow) {
  return {
    id: t.id,
    title: t.title,
    subtitle: t.subtitle ?? undefined,
    image: t.hero_image ?? undefined,
    ribbon: t.ribbon ?? undefined,
    badge: t.trip_kind ?? undefined,
    city: t.city ?? undefined,
    country: t.country ?? undefined,
    year: t.year ?? undefined,
    price_from: t.price_from ?? undefined,
    next_date: t.next_date ?? undefined,
    external_url: t.external_url ?? undefined,
    slug: t.slug ?? undefined,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const slugOrId = String(req.query.slug || "").trim();
  if (!slugOrId) return res.status(400).json({ ok: false, error: "Missing slug" });

  try {
    // Första försök: slug
    let { data, error } = await supabase
      .from("trips")
      .select(`
        id, title, subtitle, hero_image, trip_kind, city, country,
        year, price_from, next_date, external_url, ribbon, published, created_at, slug
      `)
      .eq("slug", slugOrId)
      .eq("published", true)
      .maybeSingle<TripRow>();

    // Om ingen träff via slug: prova id (UUID)
    if (!data && !error) {
      const byId = await supabase
        .from("trips")
        .select(`
          id, title, subtitle, hero_image, trip_kind, city, country,
          year, price_from, next_date, external_url, ribbon, published, created_at, slug
        `)
        .eq("id", slugOrId)
        .eq("published", true)
        .maybeSingle<TripRow>();
      data = byId.data as any;
      error = byId.error as any;
    }

    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data) return res.status(404).json({ ok: false, error: "Not found" });

    return res.status(200).json({ ok: true, trip: mapRow(data) });
  } catch (e: any) {
    console.error("/api/public/trips/[slug]", e?.message || e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
