import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Endast kolumner vi vet finns i din DB just nu.
// Vi skickar city/country som null tills de kolumnerna läggs till.
type TripRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  hero_image: string | null;
  price_from: number | null;
  badge: string | null;
  ribbon: string | null;
  start_date: string | null;
  published?: boolean | null;
};

type WidgetTrip = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  city: string | null;     // null tills kolumn finns
  country: string | null;  // null tills kolumn finns
  price_from: number | null;
  badge: string | null;
  ribbon: string | null;
  next_date: string | null;
};

const COLS =
  "id,title,subtitle,hero_image,price_from,badge,ribbon,start_date,published";

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

export default withCors(async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_KEY;

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

  // Basfråga: välj enbart säkra kolumner, filtrera publicerade, sortera på id
  let query = supabase.from("trips").select(COLS).eq("published", true).limit(limit);
  query = query.order("id", { ascending: false });

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const trips: WidgetTrip[] = (data as TripRow[]).map((t) => ({
    id: t.id,
    title: t.title ?? "—",
    subtitle: t.subtitle ?? null,
    image: t.hero_image ?? null,
    city: null,     // tills kolumn finns
    country: null,  // tills kolumn finns
    price_from: t.price_from ?? null,
    badge: t.badge ?? null,
    ribbon: t.ribbon ?? null,
    next_date: t.start_date ?? null,
  }));

  res.status(200).json({ trips });
});
