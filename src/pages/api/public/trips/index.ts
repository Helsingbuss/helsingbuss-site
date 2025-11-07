// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
const sb =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 6)));

  try {
    // Hämta publicerade trips
    const { data: trips, error: tripsErr } = await sb
      .from("trips")
      .select(
        [
          "id",
          "title",
          "subtitle",            // kort om resan
          "hero_image",          // -> image
          "ribbon",
          "badge",
          "city",
          "country",
          "price_from",
          "year",
          "external_url",
          "published",
        ].join(",")
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tripsErr) throw tripsErr;

    // Hämta nästa avgång per trip med COALESCE (behöver inte kolumnen "date")
    const { data: depRows, error: depErr } = await sb
      .from("trip_departures")
      .select("trip_id, depart_date, departure_date, dep_date")
      .in(
        "trip_id",
        trips.map((t: any) => t.id)
      );

    if (depErr) throw depErr;

    // Map trip_id -> minsta datum (nästa)
    const nextMap = new Map<string, string | null>();
    for (const r of depRows ?? []) {
      const d: string | null =
        r.depart_date || r.departure_date || r.dep_date || null;
      if (!d) continue;
      const prev = nextMap.get(r.trip_id);
      if (!prev || d < prev) nextMap.set(r.trip_id, d);
    }

    // Forma svar för widgeten
    const payload = (trips ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle ?? null,                // <-- visas under titel
      image: t.hero_image ?? null,
      ribbon: t.ribbon ?? null,
      badge: t.badge ?? null,
      city: t.city ?? null,
      country: t.country ?? null,
      price_from: t.price_from ?? null,
      year: t.year ?? null,                        // <-- piller "2025"
      external_url: t.external_url ?? null,        // <-- widget-länk prioriterar denna
      next_date: nextMap.get(t.id) ?? null,        // <-- "Nästa avgång: ..."
    }));

    return res.status(200).json({ ok: true, trips: payload });
  } catch (e: any) {
    console.error("/api/public/trips", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
