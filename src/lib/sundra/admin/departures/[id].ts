// src/pages/api/sundra/admin/departures/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const depId = String(req.query.id || "");
  if (!depId) return res.status(400).json({ error: "Missing id" });

  if (req.method === "PUT") {
    const body = req.body ?? {};
    const patch: any = {};

    if (body.depart_date !== undefined) {
      const v = body.depart_date == null ? "" : String(body.depart_date).slice(0, 10);
      if (v && !isYYYYMMDD(v)) return res.status(400).json({ error: "Ogiltigt depart_date (YYYY-MM-DD)." });
      patch.depart_date = v || null;
    }

    if (body.dep_time !== undefined) {
      const v = body.dep_time == null ? null : String(body.dep_time).slice(0, 5);
      patch.dep_time = v;
    }

    if (body.seats_total !== undefined) {
      const num =
        body.seats_total === null || body.seats_total === "" ? null : Number(body.seats_total);
      if (num !== null && Number.isNaN(num)) return res.status(400).json({ error: "Ogiltigt seats_total." });

      // säkerhet: seats_total får inte bli mindre än reserved
      const { data: current, error: readErr } = await supabaseAdmin
        .from("trip_departures")
        .select("seats_reserved")
        .eq("id", depId)
        .single();

      if (readErr) return res.status(500).json({ error: readErr.message });
      const reserved = Number(current?.seats_reserved ?? 0);
      const nextTotal = Number(num ?? 0);
      if (nextTotal < reserved) {
        return res.status(400).json({ error: `seats_total kan inte vara mindre än seats_reserved (${reserved}).` });
      }

      patch.seats_total = num ?? 0;
    }

    if (body.status !== undefined) patch.status = body.status ?? "open";

    if (body.operator_id !== undefined) patch.operator_id = body.operator_id ? String(body.operator_id) : null;
    if (body.operator_name !== undefined) patch.operator_name = body.operator_name ? String(body.operator_name) : null;
    if (body.line_name !== undefined) patch.line_name = body.line_name ? String(body.line_name) : null;

    if (body.stops !== undefined) {
      patch.stops = Array.isArray(body.stops) ? body.stops : null;
    }

    const { data, error } = await supabaseAdmin
      .from("trip_departures")
      .update(patch)
      .eq("id", depId)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ departure: data });
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin.from("trip_departures").delete().eq("id", depId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "PUT,DELETE");
  return res.status(405).end("Method Not Allowed");
}
