// src/pages/api/public/trips.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/** Rader vi använder i widgeten */
type TripRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  hero_image: string | null;
  city: string | null;
  country: string | null;
  price_from: number | null;
  badge: string | null;   // "dagsresa" | "flerdagar" | "shopping" eller valfri text
  ribbon: string | null;  // kampanjbanderoll (valfritt)
  start_date: string | null; // YYYY-MM-DD (kan vara null)
};

type ApiOut = { trips: Array<{
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  city: string | null;
  country: string | null;
  price_from: number | null;
  badge: string | null;
  ribbon: string | null;
  next_date: string | null;
}> };

const COLS =
  "id,title,subtitle,hero_image,city,country,price_from,badge,ribbon,start_date";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// CORS-wrapper (måste returnera Promise<void> för att TS ska vara nöjd)
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
function withCors(handler: Handler): Handler {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    await handler(req, res);
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!url || !anon) {
    res.status(500).json({ error: "Servern saknar Supabase-inställningar." });
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Endast GET stöds." });
    return;
  }

  const supabase = createClient(url, anon);

  const limit = Math.max(1, Math.min(24, Number(req.query.limit) || 6));
  const kind = (req.query.kind as string | undefined) || undefined; // t.ex. "dagsresa"
  const publishedOnly = (req.query.published as string | undefined) !== "all";
  const orderByNextDate = (req.query.order as string | undefined) === "date";

  // Bygg queryn – OBS: .returns<T>() läggs sist
  let q = supabase.from("trips").select(COLS).limit(limit);

  if (publishedOnly) q = q.eq("published", true);
  if (kind) q = q.eq("trip_kind", kind);
  if (orderByNextDate) {
    q = q.order("start_date", { ascending: true, nullsFirst: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data, error } = await q.returns<TripRow[]>();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const trips = (data || []).map((t) => ({
    id: t.id,
    title: t.title ?? "—",
    subtitle: t.subtitle ?? null,
    image: t.hero_image ?? null,
    city: t.city ?? null,
    country: t.country ?? null,
    price_from: t.price_from ?? null,
    badge: t.badge ?? null,
    ribbon: t.ribbon ?? null,
    next_date: t.start_date ?? null,
  }));

  const out: ApiOut = { trips };
  res.status(200).json(out);
}

export default withCors(handler);
