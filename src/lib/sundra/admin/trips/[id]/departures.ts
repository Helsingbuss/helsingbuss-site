// src/pages/api/sundra/admin/trips/[id]/departures.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tripId = String(req.query.id || "");
  if (!tripId) return res.status(400).json({ error: "Missing trip id" });

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("trip_departures")
      .select("*")
      .eq("trip_id", tripId)
      .order("depart_date", { ascending: true })
      .order("dep_time", { ascending: true, nullsFirst: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ departures: data ?? [] });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};

    const depart_date = String(body.depart_date ?? "").slice(0, 10);
    if (!depart_date || !isYYYYMMDD(depart_date)) {
      return res.status(400).json({ error: "Ogiltigt datum (depart_date). Använd YYYY-MM-DD." });
    }

    const dep_time_raw = body.dep_time == null ? null : String(body.dep_time);
    const dep_time = dep_time_raw ? dep_time_raw.slice(0, 5) : null;

    const seats_total_num =
      body.seats_total === null || body.seats_total === undefined || body.seats_total === ""
        ? null
        : Number(body.seats_total);

    if (seats_total_num !== null && Number.isNaN(seats_total_num)) {
      return res.status(400).json({ error: "Ogiltigt seats_total." });
    }

    const operator_id = body.operator_id ? String(body.operator_id) : null;
    const operator_name = body.operator_name ? String(body.operator_name) : null;
    const line_name = body.line_name ? String(body.line_name) : operator_name; // fallback

    const stops = Array.isArray(body.stops) ? body.stops : null;

    const insertRow: any = {
      trip_id: tripId,
      depart_date,
      dep_time,
      seats_total: seats_total_num ?? 0,
      seats_reserved: 0,
      status: "open",
      operator_id,
      operator_name,
      line_name,
      stops,
    };

    const { data, error } = await supabaseAdmin
      .from("trip_departures")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ departure: data });
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).end("Method Not Allowed");
}
