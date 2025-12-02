// src/pages/api/trips/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type DepartureRow = {
  dep_date?: string;
  dep_time?: string;
  line_name?: string;
  stops?: string[];
  // fallback-fält om något gammalt UI skickar andra namn
  date?: string;
  datum?: string;
  day?: string;
  when?: string;
  depart_date?: string;
  departure_date?: string;
};

type LineStopPayload = {
  name: string;
  time?: string | null;
};

type LinePayload = {
  title: string;
  stops: LineStopPayload[];
};

type Body = {
  id?: string; // om satt: uppdatera befintlig resa
  title: string;
  subtitle?: string | null;
  trip_kind?: "flerdagar" | "dagsresa" | "shopping" | string | null;
  badge?: string | null;
  ribbon?: string | null;
  city?: string | null;
  country?: string | null;
  price_from?: number | null;
  hero_image: string | null;
  published: boolean;
  external_url?: string | null;
  year?: number | null;
  summary?: string | null; // "Kort om resan"
  categories?: string[] | null;
  tags?: string[] | null;
  departures?: DepartureRow[];
  departures_coming_soon?: boolean | null;
  slug?: string | null;
  lines?: LinePayload[] | null; // linjer & hållplatser
};

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function slugify(title: string): string {
  const base = (title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // ta bort accent-tecken
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "resa";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const b = (req.body || {}) as Body;

  // Grundvalidering
  if (!b?.title || !b?.hero_image) {
    return res
      .status(400)
      .json({ ok: false, error: "Titel och bild krävs." });
  }

  // --- Rensa/sanera lines ---
  let linesClean: LinePayload[] | null = null;
  if (Array.isArray(b.lines)) {
    linesClean = b.lines
      .map((ln) => ({
        title: String(ln?.title || "").trim(),
        stops: Array.isArray(ln?.stops)
          ? ln.stops
              .map((st) => ({
                name: String(st?.name || "").trim(),
                time: st?.time ? String(st.time) : null,
              }))
              .filter((st) => st.name || st.time)
          : [],
      }))
      .filter((ln) => ln.title || ln.stops.length > 0);
  }

  const tagsArray = Array.isArray(b.tags)
    ? b.tags
    : Array.isArray(b.categories)
    ? b.categories
    : null;

  const base: Record<string, any> = {
    title: (b.title || "").trim(),
    subtitle: b.subtitle ?? null,
    trip_kind: b.trip_kind ?? null,
    badge: b.badge ?? null,
    ribbon: b.ribbon ?? null,
    city: b.city ?? null,
    country: b.country ?? null,
    price_from: b.price_from ?? null,
    hero_image: b.hero_image ?? null,
    published: !!b.published,
    external_url: b.external_url ?? null,
    year: b.year ?? null,
    summary: typeof b.summary === "string" ? b.summary : b.summary ?? null,
    departures_coming_soon: !!b.departures_coming_soon,
    slug:
      (b.slug && String(b.slug).trim()) ||
      slugify(b.title || ""),
  };

  if (tagsArray) {
    base["tags"] = tagsArray.filter(Boolean);
  }

  // spara lines i trips.lines (jsonb)
  if (linesClean) {
    base["lines"] = linesClean;
  } else {
    base["lines"] = null;
  }

  let tripId: string | null = b.id || null;

  // --- Skapa eller uppdatera resa ---
  try {
    if (b.id) {
      // uppdatera befintlig resa
      const { data, error } = await supabase
        .from("trips")
        .update(base)
        .eq("id", b.id)
        .select("id")
        .single();

      if (error) throw error;
      tripId = data?.id || b.id;
    } else {
      // skapa ny resa
      const { data, error } = await supabase
        .from("trips")
        .insert(base)
        .select("id")
        .single();

      if (error) throw error;
      tripId = data?.id || null;
    }
  } catch (e: any) {
    console.error("create/update trip failed:", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Kunde inte spara resa.",
    });
  }

  if (!tripId) {
    return res
      .status(500)
      .json({ ok: false, error: "Kunde inte spara resa (saknar id)." });
  }

  // --- Uppdatera avgångar (turlista) ---
  let departuresSaved = 0;

  try {
    // ta bort gamla avgångar för denna resa
    await supabase.from("trip_departures").delete().eq("trip_id", tripId);

    const depRows: any[] = [];

    if (Array.isArray(b.departures)) {
      for (const r of b.departures) {
        const rawDate =
          r?.date ||
          r?.datum ||
          r?.day ||
          r?.when ||
          r?.dep_date ||
          r?.depart_date ||
          r?.departure_date ||
          null;

        if (!rawDate) continue;

        const s = String(rawDate).slice(0, 10); // YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) continue;

        depRows.push({
          trip_id: tripId,
          date: s,
          dep_time: r?.dep_time || null,
          line_name: r?.line_name || null,
          stops: Array.isArray(r?.stops) ? r.stops : null,
        });
      }
    }

    if (depRows.length) {
      const { error: depErr } = await supabase
        .from("trip_departures")
        .insert(depRows);
      if (depErr) {
        console.warn(
          "create/update: could not insert departures:",
          depErr.message || depErr
        );
      } else {
        departuresSaved = depRows.length;
      }
    }
  } catch (e: any) {
    console.warn(
      "create/update: departures update failed:",
      e?.message || e
    );
    // men vi låter resan vara sparad ändå
  }

  return res.status(200).json({
    ok: true,
    id: tripId,
    departures_saved: departuresSaved,
  });
}
