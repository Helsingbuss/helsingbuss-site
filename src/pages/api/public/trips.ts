import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type TripOut = {
  id: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  badge?: string | null; // t.ex. "dagsresa", "shopping", "flerdagars"
  city?: string | null;
  country?: string | null;
  price_from?: number | null;
  ribbon?: string | null; // kampanjbanderoll
  next_date?: string | null; // YYYY-MM-DD
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ trips: TripOut[] } | { error: string }>
) {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 6)));
    const todayISO = new Date().toISOString().slice(0, 10);

    // 1) Hämta resor. Vi gör "snäll" select(*) så att vi inte kraschar om kolumn saknas.
    let trips: any[] = [];
    {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .limit(200);
      if (error) {
        console.error("/api/public/trips select trips error:", error);
        return bail(res, "Kunde inte hämta resor.");
      }
      // om published-kolumn finns, filtrera på true – annars visa alla
      trips = (data || []).filter((t: any) =>
        typeof t.published === "boolean" ? t.published : true
      );
    }

    if (!trips.length) {
      return ok(res, []);
    }

    // 2) Försök plocka nästkommande avgång per trip via trip_departures (om tabellen finns)
    const idList = trips.map((t: any) => t.id).filter(Boolean);
    const nextDates = new Map<string, string>();
    if (idList.length) {
      const { data: deps, error: depErr } = await supabase
        .from("trip_departures")
        .select("trip_id,date")
        .in("trip_id", idList)
        .gte("date", todayISO)
        .order("date", { ascending: true });
      if (!depErr && deps) {
        for (const row of deps as any[]) {
          const k = String(row.trip_id);
          const v = String(row.date);
          if (!nextDates.has(k)) nextDates.set(k, v); // första (tidigaste) vinner
        }
      } else {
        // om tabellen saknas – skippa datum
        if (depErr && String(depErr.code) !== "42P01") {
          console.warn("trip_departures error:", depErr);
        }
      }
    }

    // 3) Mappa till publikt format
    const out: TripOut[] = trips.map((t: any) => {
      return {
        id: String(t.id),
        title: t.title ?? t.name ?? "Resa",
        subtitle: t.subtitle ?? null,
        image: t.hero_image ?? t.image_url ?? null,
        badge: t.badge ?? t.category ?? null, // ex. "dagsresa"
        city: t.city ?? null,
        country: t.country ?? null,
        price_from: numberOrNull(t.price_from ?? t.price ?? null),
        ribbon: t.ribbon ?? t.promo_text ?? null, // kampanjbanderoll
        next_date: nextDates.get(String(t.id)) ?? null,
      };
    });

    // 4) Sortera på närmast datum om vi har det, annars oförändrat
    out.sort((a, b) => {
      const da = a.next_date ? Date.parse(a.next_date) : Number.MAX_SAFE_INTEGER;
      const db = b.next_date ? Date.parse(b.next_date) : Number.MAX_SAFE_INTEGER;
      return da - db;
    });

    // 5) Begränsa och skicka
    const limited = out.slice(0, limit);

    // CORS & cache – viktigt för WP
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

    return res.status(200).json({ trips: limited });
  } catch (e: any) {
    console.error("/api/public/trips fatal:", e?.message || e);
    return bail(res, "Kunde inte hämta resor.");
  }
}

function numberOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ok(res: NextApiResponse, trips: TripOut[]) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json({ trips });
}

function bail(res: NextApiResponse, msg: string) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  return res.status(200).json({ error: msg });
}
