// src/pages/api/public/trips.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function withCors(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    await handler(req, res);
  };
}

type TripRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  badge: string | null;
  city: string | null;
  country: string | null;
  price_from: number | null;
  hero_image: string | null;
  image: string | null;
  start_date: string | null;
};

type DepRow = { trip_id: string; departure_date: string };

export default withCors(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const limit = Math.max(1, Math.min(24, parseInt(String(req.query.limit ?? "6"), 10) || 6));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1) hämta publicerade resor
  const { data: trips, error: tripsErr } = await supabase
    .from("trips")
    .select(
      "id,title,subtitle,badge,city,country,price_from,hero_image,image,start_date,published"
    )
    .eq("published", true)
    .order("start_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (tripsErr) {
    return res
      .status(500)
      .json({ error: "Kunde inte hämta resor (trips)", details: tripsErr.message });
  }

  const rows = (trips || []) as (TripRow & { published?: boolean })[];

  // 2) hämta närmsta avresedatum – prova "departure_date", annars fallback till "date"
  let depMap = new Map<string, string>();
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);

    // försök med departure_date
    let { data: deps, error: depErr } = await supabase
      .from("trip_departures")
      .select("trip_id, departure_date")
      .in("trip_id", ids)
      .order("departure_date", { ascending: true });

    // fallback om kolumnen inte finns (42703)
    if (depErr && (depErr as any).code === "42703") {
      const alt = await supabase
        .from("trip_departures")
        .select('trip_id, "date"') // "date" behöver citattecken
        .in("trip_id", ids)
        .order("date", { ascending: true });

      if (!alt.error && alt.data) {
        deps = (alt.data as any[]).map((d) => ({
          trip_id: d.trip_id,
          departure_date: d.date as string,
        })) as DepRow[];
        depErr = null;
      }
    }

    if (!depErr && deps && deps.length) {
      const seen = new Set<string>();
      (deps as DepRow[]).forEach((d) => {
        if (!seen.has(d.trip_id)) {
          depMap.set(d.trip_id, d.departure_date);
          seen.add(d.trip_id);
        }
      });
    }
  }

  // 3) forma svaret för widgeten
  const out = rows.map((t) => ({
    id: t.id,
    title: t.title ?? "",
    subtitle: t.subtitle ?? null,
    image: t.hero_image || t.image || null,
    badge: t.badge || null,
    city: t.city || null,
    country: t.country || null,
    price_from: t.price_from ?? null,
    ribbon: null as string | null,
    next_date: depMap.get(t.id) || t.start_date || null,
  }));

  res.status(200).json({ trips: out });
});
