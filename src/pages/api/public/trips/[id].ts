// src/pages/api/public/trips/[id].ts
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

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
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

  const rawId = Array.isArray(req.query.id)
    ? req.query.id[0]
    : req.query.id;

  if (!rawId) {
    return res.status(400).json({ ok: false, error: "Saknar id/slug." });
  }

  const selectCols = [
    "id",
    "title",
    "subtitle",
    "trip_kind",
    "badge",
    "ribbon",
    "city",
    "country",
    "price_from",
    "hero_image",
    "year",
    "external_url",
    "summary",
    "published",
    "slug",
    "departures_coming_soon",
    "lines",
    "departures_raw",
  ].join(",");

  try {
    let tripRes;
    if (isUuid(rawId)) {
      tripRes = await supabase
        .from("trips")
        .select(selectCols)
        .eq("id", rawId)
        .single();
    } else {
      // fallback: hämta via slug om någon gång behövs offentligt
      tripRes = await supabase
        .from("trips")
        .select(selectCols)
        .eq("slug", rawId)
        .single();
    }

    const { data: t, error } = tripRes;
    if (error) throw error;
    if (!t) {
      return res
        .status(404)
        .json({ ok: false, error: "Resan hittades inte." });
    }

    const departures = Array.isArray(t.departures_raw)
      ? t.departures_raw
      : [];

    return res.status(200).json({
      ok: true,
      trip: {
        id: t.id,
        title: t.title || "",
        subtitle: t.subtitle || "",
        trip_kind: t.trip_kind || null,
        badge: t.badge || null,
        ribbon: t.ribbon || null,
        city: t.city || null,
        country: t.country || null,
        price_from: t.price_from ?? null,
        hero_image: t.hero_image || null,
        year: t.year ?? null,
        external_url: t.external_url || null,
        summary: t.summary || "",
        published: !!t.published,
        slug: t.slug || "",
        departures_coming_soon: !!t.departures_coming_soon,
        lines: Array.isArray(t.lines) ? t.lines : [],
        departures,
      },
    });
  } catch (e: any) {
    console.error("/api/public/trips/[id] error:", e?.message || e);
    return res
      .status(500)
      .json({ ok: false, error: "Server error" });
  }
}
