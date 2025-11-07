// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";

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
};

type WidgetTrip = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  ribbon?: string | null | { text: string };
  badge?: string | null;
  city?: string | null;
  country?: string | null;
  year?: number | null;
  price_from?: number | null;
  next_date?: string | null;
  external_url?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CORS för widget
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 12));

    const { data, error } = await supabase
      .from("trips")
      .select(`
        id,
        title,
        subtitle,
        hero_image,
        trip_kind,
        city,
        country,
        year,
        price_from,
        next_date,
        external_url,
        ribbon,
        published,
        created_at
      `)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ ok: false, error: error.message });

    const trips: WidgetTrip[] = (data as TripRow[]).map((t) => ({
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
    }));

    return res.status(200).json({ ok: true, trips });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Serverfel" });
  }
}
