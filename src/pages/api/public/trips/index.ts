// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const sb: any =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

type TripRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  hero_image?: string | null;
  ribbon?: string | null;
  trip_kind?: string | null;
  badge?: string | null;
  city?: string | null;
  country?: string | null;
  price_from?: number | null;
  year?: number | null;
  external_url?: string | null;
  published?: boolean | null;
};

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 6)));

  try {
    // 1) Resor (bara fält vi vet finns)
    const { data: trips, error: tripsErr } = await sb
      .from("trips")
      .select(
        "id,title,subtitle,hero_image,ribbon,trip_kind,badge,city,country,price_from,year,external_url,published"
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tripsErr) throw tripsErr;

    const rows: TripRow[] = trips ?? [];
    const itemsBase = rows.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle ?? "",
      image: t.hero_image ?? "",
      ribbon: t.ribbon ? { text: t.ribbon } : null,
      badge: t.trip_kind || t.badge || null,
      city: t.city ?? null,
      country: t.country ?? null,
      price_from: t.price_from ?? null,
      year: t.year ?? null,
      external_url: t.external_url ?? null,
      next_date: null as string | null,
    }));

    // 2) Försök hämta avgångar – men krascha aldrig om schemat skiljer
    let depWarning: string | null = null;
    try {
      if (rows.length) {
        const tripIds = rows.map((r) => r.id);
        const { data: dep, error: depErr } = await sb
          .from("trip_departures")     // BYT om din tabell heter annat
          .select("*")                 // läs allt → vi letar datumfält i JS
          .in("trip_id", tripIds);

        if (depErr) {
          depWarning = `departures_error: ${depErr.message}`;
        } else if (dep && dep.length) {
          const today = new Date();
          const byTrip = new Map<string, string>();

          // Hjälpfunktion: plocka första giltiga datum-sträng
          function firstDateISO(row: any): string | null {
            const candidates = [
              row?.date,
              row?.departure_date,
              row?.start_date,
              row?.dep_date,
              row?.dt,
              row?.start_at,
              row?.day,
            ].filter(Boolean);
            for (const c of candidates) {
              const d = new Date(c);
              if (!isNaN(d.getTime())) {
                // normalisera till YYYY-MM-DD
                return d.toISOString().slice(0, 10);
              }
            }
            return null;
          }

          for (const d of dep) {
            const iso = firstDateISO(d);
            if (!iso) continue;
            // endast framtid/idag
            const dObj = new Date(iso + "T00:00:00Z");
            if (dObj < new Date(today.toISOString().slice(0, 10) + "T00:00:00Z")) continue;

            const cur = byTrip.get(d.trip_id);
            if (!cur || iso < cur) byTrip.set(d.trip_id, iso);
          }

          for (const it of itemsBase) {
            if (byTrip.has(it.id)) it.next_date = byTrip.get(it.id)!;
          }
        }
      }
    } catch (e: any) {
      depWarning = `departures_catch: ${e?.message || String(e)}`;
    }

    return res.status(200).json({
      ok: true,
      trips: itemsBase,
      warning: depWarning || undefined,
    });
  } catch (e: any) {
    console.error("/api/public/trips", e?.message || e);
    // Returnera tom lista istället för 500 → widgeten kan ändå visa “Inga resor…”
    return res.status(200).json({ ok: true, trips: [], warning: e?.message || "Server warning" });
  }
}
