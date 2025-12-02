// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
}

function findNextDateFromDepartures(rows: any[] | null | undefined): string | null {
  if (!rows || !Array.isArray(rows)) return null;

  const todayMs = new Date(new Date().toDateString()).getTime();
  const timestamps: number[] = [];

  for (const r of rows) {
    const raw =
      r?.dep_date ||
      r?.date ||
      r?.datum ||
      r?.day ||
      r?.when ||
      r?.depart_date ||
      r?.departure_date ||
      null;

    if (!raw) continue;

    const iso = String(raw).slice(0, 10); // YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;

    const ms = new Date(iso).getTime();
    if (!isNaN(ms) && ms >= todayMs) timestamps.push(ms);
  }

  if (!timestamps.length) return null;
  timestamps.sort((a, b) => a - b);
  return new Date(timestamps[0]).toISOString().slice(0, 10);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const limit = Math.max(1, Math.min(24, Number(req.query.limit || 6)));

  try {
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
          "city",
          "country",
          "price_from",
          "year",
          "external_url",
          "summary",
          "published",
          "slug",
          "departures_coming_soon",
          "departures_raw",
        ].join(",")
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tripsErr) throw tripsErr;

    const out: any[] = [];

    for (const t of trips || []) {
      const next_date = findNextDateFromDepartures(t.departures_raw);

      out.push({
        id: t.id,
        title: t.title || "",
        subtitle: t.subtitle || "",
        image: t.hero_image || null,
        ribbon: t.ribbon || null,
        badge: t.badge || t.trip_kind || null,
        trip_kind: t.trip_kind || null,
        categories: [],
        city: t.city || null,
        country: t.country || null,
        price_from: t.price_from ?? null,
        year: t.year ?? null,
        external_url: t.external_url || null,
        summary: t.summary || "",
        next_date,
        slug: t.slug || null,
        departures_coming_soon: !!t.departures_coming_soon,
      });
    }

    return res.status(200).json({ ok: true, trips: out });
  } catch (e: any) {
    console.error("/api/public/trips error:", e?.message || e);
    return res
      .status(200)
      .json({ ok: false, error: "Server error" });
  }
}
