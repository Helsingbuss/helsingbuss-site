import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

// Tillåt WordPress-domänen. Lägg fler med kommatecken om du har både www och utan www.
const ALLOW_ORIGIN =
  process.env.PUBLIC_WIDGET_ALLOW_ORIGIN || "https://www.helsingbuss.se";

const supabase = (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "6"), 10) || 6, 50);

    // Hämta publicerade (published = true) och framtida resor först, fyll ev. på med övriga
    const today = new Date().toISOString().slice(0, 10);

    const q1 = supabase
      .from("trips")
      .select(
        [
          "id",
          "slug",
          "title",
          "summary",
          "category",
          "start_date",
          "end_date",
          "price_from",
          "city_from",
          "city_to",
          "hero_image",
          "badge_text",
          "badge_color",
          "promo_text",
          "promo_color",
          "published",
        ].join(",")
      )
      .eq("published", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(limit);

    const { data: primary, error: e1 } = await q1;
    if (e1) throw e1;

    let rows = primary ?? [];

    if (rows.length < limit) {
      const { data: fill, error: e2 } = await supabase
        .from("trips")
        .select(
          [
            "id",
            "slug",
            "title",
            "summary",
            "category",
            "start_date",
            "end_date",
            "price_from",
            "city_from",
            "city_to",
            "hero_image",
            "badge_text",
            "badge_color",
            "promo_text",
            "promo_color",
            "published",
          ].join(",")
        )
        .eq("published", true)
        .lt("start_date", today)
        .order("start_date", { ascending: false })
        .limit(limit - rows.length);

      if (e2) throw e2;
      rows = [...rows, ...(fill ?? [])];
    }

    // Mappa till ett snyggt, stabilt schema för widgeten
    const trips = (rows ?? []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      category: r.category,
      start_date: r.start_date,
      end_date: r.end_date,
      price_from: r.price_from,
      city_from: r.city_from,
      city_to: r.city_to,
      hero_image: r.hero_image, // absolut eller relativ (widgeten klarar båda)
      badge: r.badge_text ? { text: r.badge_text, color: r.badge_color || "#f04343" } : null,
      promo: r.promo_text ? { text: r.promo_text, color: r.promo_color || "#f04343" } : null,
      url: r.slug ? `/resor/${r.slug}` : null, // din publika detaljsida i portalen (ändra om du har annan URL)
    }));

    return res.status(200).json({ trips });
  } catch (e: any) {
    console.error("/api/public/trips error:", e?.message || e);
    return res.status(500).json({ error: "Failed to load trips" });
  }
}
