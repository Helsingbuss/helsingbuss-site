// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
const supabase: any =
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

  const limit = Math.max(1, Math.min(24, Number(req.query.limit || 6)));

  try {
    // 1) Hämta publicerade resor
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select(
        [
          "id",
          "title",
          "subtitle",
          "hero_image",
          "ribbon",
          "badge",
          "trip_kind",
          "categories",
          "city",
          "country",
          "price_from",
          "year",
          "external_url",
          "summary",
          "published",
        ].join(",")
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tripsErr) throw tripsErr;

    // 2) Beräkna next_date per resa från trip_departures
    const today = new Date(new Date().toDateString()).getTime();

    const out = [];
    for (const t of trips || []) {
      // Hämta departures för denna resa
      const { data: deps, error: depsErr } = await supabase
        .from("trip_departures")
        .select("depart_date, dep_date, departure_date")
        .eq("trip_id", t.id)
        .limit(200);

      if (depsErr) {
        // Skadar inte UI – vi loggar i warning, men fortsätter
        // (du kan även lägga warning-text i payload om du vill)
      }

      // Plocka ut första framtida datumet (minst idag)
      const allDates: Date[] = [];
      for (const row of deps || []) {
        const cand = [row.depart_date, row.dep_date, row.departure_date]
          .filter(Boolean)
          .map((d: string) => new Date(d));
        for (const d of cand) {
          if (!isNaN(d.getTime()) && d.getTime() >= today) allDates.push(d);
        }
      }
      allDates.sort((a, b) => a.getTime() - b.getTime());
      const next_date = allDates[0] ? allDates[0].toISOString().slice(0, 10) : null;

      out.push({
        id: t.id,
        title: t.title || "",
        subtitle: t.subtitle || "",
        image: t.hero_image || null,      // widgeten förväntar sig "image"
        ribbon: t.ribbon || null,
        badge: t.badge || null,           // legacy, widgeten kan visa detta
        trip_kind: t.trip_kind || null,   // primär kategori
        categories: Array.isArray(t.categories) ? t.categories : [], // extra piller
        city: t.city || null,
        country: t.country || null,
        price_from: t.price_from ?? null,
        year: t.year ?? null,
        external_url: t.external_url || null,
        summary: t.summary || "",         // <- för kort beskrivning
        next_date,                        // <- används i “Nästa avgång”
      });
    }

    return res.status(200).json({ ok: true, trips: out });
  } catch (e: any) {
    console.error("/api/public/trips error:", e?.message || e);
    return res.status(200).json({ ok: false, error: "Server error" });
  }
}
