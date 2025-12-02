// src/pages/api/trips/list.ts
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

  try {
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select(
        [
          "id",
          "title",
          "subtitle",
          "trip_kind",
          "country",
          "year",
          "price_from",
          "published",
          "hero_image",
          "departures_raw",
        ].join(",")
      )
      .order("created_at", { ascending: false });

    if (tripsErr) throw tripsErr;

    const out = (trips || []).map((t: any) => ({
      id: t.id,
      title: t.title || "",
      subtitle: t.subtitle || "",
      trip_kind: t.trip_kind || null,
      country: t.country || null,
      year: t.year ?? null,
      price_from: t.price_from ?? null,
      published: !!t.published,
      hero_image: t.hero_image || null,
      next_date: findNextDateFromDepartures(t.departures_raw),
    }));

    return res.status(200).json({ ok: true, trips: out });
  } catch (e: any) {
    console.error("/api/trips/list error:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Server error" });
  }
}
