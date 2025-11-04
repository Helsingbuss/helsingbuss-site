// src/pages/api/public/trips.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type TripCard = {
  id: string;
  slug: string | null;
  title: string | null;
  tagline: string | null;
  category: string | null;   // ex. "dagsresa" | "flerdagarsresa" | "shopping"
  price_from: number | null;
  days: number | null;
  city: string | null;
  country: string | null;
  hero_image: string | null; // bild-url
  featured: boolean | null;  // visa röd banderoll tex
  badge: string | null;      // text i banderollen ("Gör ett klipp!" etc)
  published: boolean | null; // om kolumnen finns
  start_date?: string | null; // om du lagt till den
  publish_at?: string | null; // ev. publiceringsdatum
};

type ErrorJson = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ trips: TripCard[] } | ErrorJson>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const url = new URL(req.url || "", "http://localhost");
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 6)));
    const tag = url.searchParams.get("tag");       // valfritt filter på badge
    const cat = url.searchParams.get("category");  // valfritt filter på category
    const q   = url.searchParams.get("q");         // enkel fritext på title

    const baseSelect =
      "id, slug, title, tagline, category, price_from, days, city, country, hero_image, featured, badge, published, start_date, publish_at";

    // 1) Försök med published-filter
    let query = supabase
      .from("trips")
      .select(baseSelect)
      .eq("published", true);

    if (tag) query = query.eq("badge", tag);
    if (cat) query = query.eq("category", cat);
    if (q)   query = query.ilike("title", `%${q}%`);

    // sortera nyast först om du har publish_at/start_date, annars created_at
    query = query
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("start_date", { ascending: true, nullsFirst: true })
      .limit(limit);

    let { data, error } = await query;

    // 2) Om kolumn saknas (t.ex. "published"), kör utan filtret
    // Postgres felkod 42703 = "undefined_column"
    const isMissingColumn =
      error && (error.code === "42703" || /column .* does not exist/i.test(error.message || ""));

    if (isMissingColumn) {
      let q2 = supabase.from("trips").select(baseSelect);
      if (tag) q2 = q2.eq("badge", tag);
      if (cat) q2 = q2.eq("category", cat);
      if (q)   q2 = q2.ilike("title", `%${q}%`);

      q2 = q2
        .order("publish_at", { ascending: false, nullsFirst: false })
        .order("start_date", { ascending: true, nullsFirst: true })
        .limit(limit);

      const r2 = await q2;
      data = r2.data as any;
      error = r2.error;
    }

    if (error) throw error;
    return res.status(200).json({ trips: (data || []) as TripCard[] });
  } catch (e: any) {
    console.error("/api/public/trips error:", e?.message || e);
    return res.status(500).json({ error: "Kunde inte hämta resor." });
  }
}
