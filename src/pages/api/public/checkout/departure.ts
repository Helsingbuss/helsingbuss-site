// src/pages/api/public/checkout/departure.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type ApiDeparture = {
  id: string;
  trip_id: string;
  trip_title: string;
  slug?: string | null;
  hero_image?: string | null;
  date: string;        // YYYY-MM-DD
  weekday: string;     // t.ex. "Lör"
  time: string | null; // "06:00"
  line_name?: string | null;
  stops: string[];
  price_from: number | null;
  seats_left: number;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  departure?: ApiDeparture;
};

function normalizeStops(stops: any): string[] {
  if (!stops) return [];
  if (Array.isArray(stops)) {
    return stops.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(stops)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickDateInfo(dep: any): { date: string; weekday: string } | null {
  const raw =
    dep.depart_date ||
    dep.dep_date ||
    dep.date ||
    dep.day ||
    dep.when ||
    null;

  if (!raw) return null;
  const iso = String(raw).slice(0, 10);
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;

  const date = d.toISOString().slice(0, 10);
  const wd = d.toLocaleDateString("sv-SE", { weekday: "short" });
  const weekday =
    wd.length > 0 ? wd.charAt(0).toUpperCase() + wd.slice(1) : "";

  return { date, weekday };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed (use GET)." });
  }

  const departureId = req.query.departure_id;
  if (!departureId || Array.isArray(departureId)) {
    return res.status(400).json({
      ok: false,
      error: "departure_id saknas.",
    });
  }

  try {
    // 1) Hämta avgång
    const { data: dep, error: depErr } = await supabase
      .from("trip_departures")
      .select("*")
      .eq("id", departureId)
      .single();

    if (depErr || !dep) {
      console.error("checkout/departure depErr", depErr);
      return res.status(404).json({
        ok: false,
        error: "Avgången kunde inte hittas.",
      });
    }

    // 2) Hämta resa
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("*")
      .eq("id", dep.trip_id)
      .single();

    if (tripErr || !trip) {
      console.error("checkout/departure tripErr", tripErr);
      return res.status(404).json({
        ok: false,
        error: "Resan för avgången kunde inte hittas.",
      });
    }

    // 3) Datum / tid / hållplatser / kapacitet
    const dateInfo = pickDateInfo(dep);
    if (!dateInfo) {
      return res.status(500).json({
        ok: false,
        error: "Avgången saknar giltigt datum.",
      });
    }

    const timeRaw = dep.dep_time || dep.time || null;
    const time = timeRaw ? String(timeRaw).slice(0, 5) : null;

    const total =
      Number(dep.capacity_total ?? dep.seats_total ?? 0) || 0;
    const reserved = Number(dep.seats_reserved ?? 0) || 0;
    const seats_left = total > 0 ? Math.max(total - reserved, 0) : 0;

    const departure: ApiDeparture = {
      id: String(dep.id),
      trip_id: String(dep.trip_id),
      trip_title: String(trip.title || ""),
      slug: trip.slug ?? null,
      hero_image: trip.hero_image ?? null,
      date: dateInfo.date,
      weekday: dateInfo.weekday,
      time,
      line_name: dep.line_name ?? null,
      stops: normalizeStops(dep.stops),
      price_from:
        trip.price_from != null ? Number(trip.price_from) : null,
      seats_left,
    };

    return res.status(200).json({ ok: true, departure });
  } catch (e: any) {
    console.error("checkout/departure error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid hämtning av avgång.",
    });
  }
}
