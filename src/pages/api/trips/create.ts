import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Endast POST" });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_KEY!;
  if (!url || !service) return res.status(500).json({ error: "Saknar server-nyckel" });

  const sb = createClient(url, service);

  try {
    const {
      title, subtitle, teaser, hero_image, price_from, badge, ribbon, published = true,
      departures = []
    } = req.body || {};

    if (!title || typeof title !== "string") throw new Error("Titel krävs");

    const { data: trip, error } = await sb
      .from("trips")
      .insert([{
        title,
        subtitle,
        teaser,
        hero_image,
        price_from,
        badge,
        ribbon,
        published
      }])
      .select("id")
      .single();

    if (error) throw error;
    const tripId = trip!.id;

    if (Array.isArray(departures) && departures.length) {
      const rows = departures.map((d: any) => ({
        trip_id: tripId,
        dep_date: d.dep_date,
        dep_time: d.dep_time || null,
        line: d.line || null,
        stops: Array.isArray(d.stops) ? d.stops : [],
        price: d.price ?? null,
        seats: d.seats ?? null,
        published: d.published !== false
      }));
      const { error: dErr } = await sb.from("trip_departures").insert(rows);
      if (dErr) throw dErr;
    }

    return res.status(200).json({ ok: true, id: tripId });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Kunde inte spara" });
  }
}
