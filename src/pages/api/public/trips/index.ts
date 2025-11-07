// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
const sb: any = (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

type TripRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  hero_image?: string | null;
  ribbon?: string | null;
  trip_kind?: string | null;   // dagsresa | shopping | flerdagar
  badge?: string | null;       // om du använder separat badge
  city?: string | null;
  country?: string | null;
  price_from?: number | null;
  year?: number | null;
  external_url?: string | null;
};

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
    // 1) Hämta publicerade resor
    const { data: trips, error } = await sb
      .from("trips")
      .select(
        "id,title,subtitle,hero_image,ribbon,trip_kind,badge,city,country,price_from,year,external_url"
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    const rows: TripRow[] = trips ?? [];
    if (rows.length === 0) return res.status(200).json({ ok: true, trips: [] });

    // 2) Hämta kommande avgångar och räkna ut next_date per trip
    const tripIds = rows.map((r) => r.id);
    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data: dep, error: depErr } = await sb
      .from("trip_departures")
      .select("trip_id,date")
      .in("trip_id", tripIds)
      .gte("date", todayISO);

    if (depErr) throw depErr;

    const nextDateByTrip = new Map<string, string>();
    for (const d of dep || []) {
      const cur = nextDateByTrip.get(d.trip_id);
      if (!cur || d.date < cur) nextDateByTrip.set(d.trip_id, d.date);
    }

    // 3) Mappa till widget-format
    const items = rows.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle ?? "",                        // ← visas som “Kort om resan”
      image: t.hero_image ?? "",
      ribbon: t.ribbon ?? undefined,                      // string räcker i widgeten
      badge: t.badge || t.trip_kind || null,             // piller (dagsresa/shopping/…)
      city: t.city ?? null,
      country: t.country ?? null,
      price_from: t.price_from ?? null,
      year: t.year ?? null,                               // piller “2025”
      external_url: t.external_url ?? null,              // klicklänk från admin
      next_date: nextDateByTrip.get(t.id) || null,       // “Nästa avgång”
    }));

    return res.status(200).json({ ok: true, trips: items });
  } catch (e: any) {
    console.error("/api/public/trips", e?.message || e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
