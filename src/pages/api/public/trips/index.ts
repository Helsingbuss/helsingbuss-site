// src/pages/api/public/trips/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const limit = Math.max(1, Math.min(Number(req.query.limit ?? 6) || 6, 24));

  try {
    // 1) Hämta publicerade resor
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select(
        [
          "id",
          "title",
          "subtitle",
          "hero_image:image",
          "ribbon",
          "badge",
          "city",
          "country",
          "price_from",
          "year",
          "external_url",
          "summary",
          "trip_kind",
          "categories",
        ].join(",")
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tripsErr) throw tripsErr;

    // 2) Slå upp nästa avgång per resa (tål olika kolumnnamn)
    // Vi använder COALESCE över de varianter som kan finnas och filtrerar mot dagens datum.
    const out = [];
    for (const t of trips || []) {
      let next_date: string | null = null;

      const { data: dep, error: depErr } = await supabase
        .rpc("exec_sql", {
          // Kräver Postgres-funktion exec_sql i din instans. Om du inte har den:
          // byt till en vanlig select på trip_departures och hantera i JS (se kommentar nedan).
          sql: `
            SELECT to_char(MIN(d), 'YYYY-MM-DD') AS next_date FROM (
              SELECT
                CASE
                  WHEN depart_date IS NOT NULL THEN depart_date
                  WHEN dep_date     IS NOT NULL THEN dep_date
                  WHEN date         IS NOT NULL THEN date
                  ELSE NULL
                END AS d
              FROM trip_departures
              WHERE trip_id = $1
            ) s
            WHERE d IS NOT NULL AND d >= CURRENT_DATE
          `,
          params: [t.id],
        } as any);

      if (!depErr && dep && dep[0]?.next_date) {
        next_date = dep[0].next_date;
      } else {
        // Fallback utan exec_sql: enkel SELECT och JS-beräkning
        const { data: plain, error: plainErr } = await supabase
          .from("trip_departures")
          .select("depart_date, dep_date, date")
          .eq("trip_id", t.id);
        if (!plainErr && plain?.length) {
          const dates = plain
            .map((r: any) => r.depart_date || r.dep_date || r.date || null)
            .filter(Boolean)
            .map((d: string) => new Date(d))
            .filter(d => !isNaN(d.getTime()) && d >= new Date(new Date().toDateString()))
            .sort((a, b) => a.getTime() - b.getTime());
          if (dates[0]) next_date = dates[0].toISOString().slice(0, 10);
        }
      }

      out.push({
        id: t.id,
        title: t.title,
        subtitle: t.subtitle,
        image: t.hero_image,
        ribbon: t.ribbon,
        badge: t.badge,             // eller här kan du kombinera trip_kind + categories om du vill
        city: t.city,
        country: t.country,
        price_from: t.price_from,
        year: t.year,
        external_url: t.external_url,
        summary: t.summary,         // <- beskrivningen följer nu med
        trip_kind: t.trip_kind,
        categories: t.categories,
        next_date,
      });
    }

    return res.status(200).json({ ok: true, trips: out });
  } catch (e: any) {
    console.error("/api/public/trips error:", e?.message || e);
    return res.status(200).json({ ok: false, error: e?.message || "Server error" });
  }
}
