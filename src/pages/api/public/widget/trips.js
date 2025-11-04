// src/pages/api/public/trips.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Enkel CORS-helper (tillåt GET från alla origins)
function withCors(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (withCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const limitParam = parseInt(String(req.query.limit ?? "6"), 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 6;

    // Hämta publika resor – anpassa fälten mot din trips-tabell
    const { data, error } = await supabase
      .from("trips")
      .select("id,title,subtitle,hero_image,price_from,badge,ribbon,city,country,start_date,published")
      .eq("published", true)
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const trips = (data ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle ?? null,
      image: t.hero_image ?? null,   // visa valfri bild-URL
      badge: t.badge ?? null,        // "Flerdagarsresa", "Dagsresa", "Shoppingresa"
      ribbon: t.ribbon ?? null,      // t.ex. kampanj-text
      city: t.city ?? null,
      country: t.country ?? null,
      price_from: t.price_from ?? null,
      next_date: t.start_date ?? null,
    }));

    // Cachea i edge/CDN (1 min) + SWR ett dygn
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=86400");
    res.status(200).json({ trips });
  } catch (e: any) {
    console.error("public/trips error:", e);
    res.status(500).json({ error: "Kunde inte hämta resor." });
  }
}
