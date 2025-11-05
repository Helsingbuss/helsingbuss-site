// src/pages/api/public/trips.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ---------- Typer ---------- */
type TripRow = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  hero_image?: string | null;
  badge?: string | null;
  city?: string | null;
  country?: string | null;
  price_from?: number | null;
  ribbon?: string | null;
  start_date?: string | null; // kan saknas i din DB
};

type PublicTrip = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  badge: string | null;
  city: string | null;
  country: string | null;
  price_from: number | null;
  ribbon: string | null;
  next_date: string | null;
};

type Handler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>;

/* ---------- CORS-wrapper ---------- */
function withCors(handler: Handler): Handler {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).end(); // returnerar inget = håller sig till void
      return;
    }
    await handler(req, res);
  };
}

/* ---------- Hjälpare ---------- */
function env(name: string) {
  return process.env[name];
}

function getSupabase(): SupabaseClient {
  // Stöder både server- och NEXT_PUBLIC-variabler
  const url =
    env("SUPABASE_URL") ||
    env("NEXT_PUBLIC_SUPABASE_URL");

  const key =
    env("SUPABASE_SERVICE_ROLE_KEY") ||
    env("SUPABASE_SERVICE_KEY") || // du använde detta namnet
    env("SUPABASE_ANON_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_KEY");

  if (!url || !key) {
    throw new Error("Servern saknar Supabase-inställningar.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseLimit(raw: unknown, fallback = 6) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(1, Math.min(50, Math.floor(n))) : fallback;
}

/* ---------- Handler ---------- */
export default withCors(async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const limit = parseLimit(req.query.limit, 6);

    const BASE_COLS =
      "id,title,subtitle,hero_image,badge,city,country,price_from,ribbon";

    // Typed select-byggare. Välj om vi ska sortera på start_date eller inte.
    const selectTrips = (cols: string, orderByStartDate: boolean) => {
      let q = supabase
        .from<TripRow>("trips")
        .select(cols)
        .eq("published", true)
        .limit(limit);
      if (orderByStartDate) {
        q = q.order("start_date", { ascending: true, nullsFirst: false });
      }
      return q;
    };

    let rows: TripRow[] = [];

    // 1) Försök med start_date (kolumn kan saknas i din prod-DB)
    const r1 = await selectTrips(`${BASE_COLS},start_date`, true);
    if (r1.error) {
      if (r1.error.code === "42703") {
        // 2) Fallback utan start_date och utan sortering
        const r2 = await selectTrips(BASE_COLS, false);
        if (r2.error) throw r2.error;
        rows = r2.data ?? [];
      } else {
        throw r1.error;
      }
    } else {
      rows = r1.data ?? [];
    }

    const trips: PublicTrip[] = rows.map((t) => ({
      id: t.id,
      title: t.title ?? null,
      subtitle: t.subtitle ?? null,
      image: t.hero_image ?? null,
      badge: t.badge ?? null,
      city: t.city ?? null,
      country: t.country ?? null,
      price_from: t.price_from ?? null,
      ribbon: t.ribbon ?? null,
      next_date: t.start_date ?? null,
    }));

    res.status(200).json({ trips });
  } catch (err: any) {
    console.error("public/trips error:", err?.code, err?.message || err);
    const msg =
      err?.message === "Servern saknar Supabase-inställningar."
        ? err.message
        : "Kunde inte hämta resor.";
    res.status(500).json({ error: msg });
  }
});
