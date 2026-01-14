import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";
import { slugifyTitle } from "@/lib/sundra/trips/slug";
import type { TripRecord, TripType, TripStatus } from "@/lib/sundra/trips/types";

function dbToTrip(row: any): TripRecord {
  return {
    id: row.id,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    status: row.status,
    type: row.type,
    title: row.title,
    slug: row.slug,
    metaLine: row.meta_line ?? null,
    intro: row.intro ?? null,
    description: row.description ?? null,
    fromPriceSEK: row.from_price_sek ?? null,
    tags: row.tags ?? null,
    facts: row.facts ?? null,
    itinerary: row.itinerary ?? null,
    media: row.media ?? null,
    ratings: { average: row.rating_average ?? null, count: row.rating_count ?? null },
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const status = (req.query.status as TripStatus | undefined) || undefined;
      const type = (req.query.type as TripType | undefined) || undefined;
      const q = (req.query.q as string | undefined) || "";

      let query = supabaseAdmin.from("trips").select("*").order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (type) query = query.eq("type", type);
      if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ trips: (data ?? []).map(dbToTrip) });
    }

    if (req.method === "POST") {
      const { title, type } = req.body as { title?: string; type?: TripType };

      if (!title?.trim()) return res.status(400).json({ error: "Titel saknas." });
      if (!type) return res.status(400).json({ error: "Typ saknas." });

      const baseSlug = slugifyTitle(title);
      let slug = baseSlug || `resa-${Date.now()}`;

      // försök undvika duplicate slug
      const { data: existing } = await supabaseAdmin.from("trips").select("id").eq("slug", slug).maybeSingle();
      if (existing?.id) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

      const insertRow = {
        status: "draft",
        type,
        title: title.trim(),
        slug,
        meta_line: null,
        intro: null,
        description: null,
        from_price_sek: null,
        tags: [],
        facts: null,
        itinerary: [],
        media: { heroVideoUrl: null, heroImageUrl: null, gallery: [] },
        rating_average: null,
        rating_count: null,
      };

      const { data, error } = await supabaseAdmin.from("trips").insert(insertRow).select("*").single();
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json(dbToTrip(data));
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
