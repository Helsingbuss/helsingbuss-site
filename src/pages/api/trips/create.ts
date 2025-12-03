// src/pages/api/trips/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

type SaveResp = {
  ok: boolean;
  id?: string;
  error?: string;
};

type DepartureRow = {
  dep_date?: string | null;
  date?: string | null;
  day?: string | null;
  when?: string | null;
  dep_time?: string | null;
  time?: string | null;
  line_name?: string | null;
  line?: string | null;
  stops?: any[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveResp>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed (use POST)." });
  }

  try {
    const body = req.body || {};

    const {
      id,
      title,
      subtitle,
      trip_kind,
      badge,
      ribbon,
      city,
      country,
      price_from,
      hero_image,
      published,
      external_url,
      year,
      summary,
      departures,
      lines,
      departures_coming_soon,
      slug,
      operator_id,
      bus_model_id,
    } = body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Titel saknas.",
      });
    }

    if (!hero_image || !String(hero_image).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Hero-bild saknas.",
      });
    }

    const numericPrice =
      price_from === null || price_from === undefined || price_from === ""
        ? null
        : Number(price_from);

    if (numericPrice !== null && Number.isNaN(numericPrice)) {
      return res.status(400).json({
        ok: false,
        error: "Ogiltigt prisvärde i 'price_from'.",
      });
    }

    const yearValue =
      year === null || year === undefined || year === ""
        ? null
        : Number(year);

    // Normalisera textfält
    const payload: any = {
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : null,
      trip_kind: trip_kind || "dagsresa",
      badge: badge ? String(badge).trim() : null,
      ribbon: ribbon ? String(ribbon).trim() : null,
      city: city ? String(city).trim() : null,
      country: country ? String(country).trim() : null,
      price_from: numericPrice,
      hero_image: String(hero_image).trim(),
      published: !!published,
      external_url: external_url ? String(external_url).trim() : null,
      year: yearValue,
      summary: summary ? String(summary).trim() : null,
      departures: Array.isArray(departures) ? departures : [],
      lines: Array.isArray(lines) ? lines : [],
      departures_coming_soon: !!departures_coming_soon,
      slug: slug ? String(slug).trim() : null,
      operator_id: operator_id || null,
      bus_model_id: bus_model_id || null,
    };

    let tripId: string;

    if (id) {
      // Uppdatera befintlig resa
      const { data, error } = await supabase
        .from("trips")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single();

      if (error) throw error;
      tripId = data.id;
    } else {
      // Skapa ny resa
      const { data, error } = await supabase
        .from("trips")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      tripId = data.id;
    }

    // Koppla avgångar + kapacitet
    await syncDeparturesWithCapacity(
      tripId,
      Array.isArray(departures) ? (departures as DepartureRow[]) : [],
      bus_model_id || null
    );

    return res.status(200).json({ ok: true, id: tripId });
  } catch (e: any) {
    console.error("trips/create error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel när resan skulle sparas.",
    });
  }
}

async function syncDeparturesWithCapacity(
  tripId: string,
  departures: DepartureRow[],
  busModelId: string | null
) {
  // 1) Hämta kapacitet från bussmodell (om finns)
  let capacity: number | null = null;

  if (busModelId) {
    try {
      const { data: bm, error: bmErr } = await supabase
        .from("bus_models")
        .select("capacity")
        .eq("id", busModelId)
        .limit(1)
        .single();

      if (!bmErr && bm && bm.capacity != null) {
        const num = Number(bm.capacity);
        capacity = Number.isNaN(num) ? null : num;
      }
    } catch (e) {
      // Om detta failar vill vi inte stoppa hela sparningen
      console.warn("Kunde inte läsa bus_models.capacity", e);
    }
  }

  // 2) Normalisera avgångar från JSON (dep_date, dep_time osv)
  const rowsToInsert: any[] = [];

  for (const d of departures) {
    const rawDate =
      d.dep_date || d.date || d.day || d.when || null;

    const dateStr = rawDate ? String(rawDate).slice(0, 10) : "";
    if (!dateStr) continue;

    const rawTime = (d.dep_time || d.time || "") as string;
    const timeStr = rawTime ? rawTime.slice(0, 5) : null;

    const lineName = (d.line_name || d.line || "") as string;
    const normLine = lineName.trim() || null;

    rowsToInsert.push({
      trip_id: tripId,
      depart_date: dateStr,
      dep_time: timeStr,
      line_name: normLine,
      seats_total: capacity,      // HÄR kopplar vi kapacitet
      seats_reserved: 0,          // startar på 0
    });
  }

  // 3) Rensa gamla rader och lägg in nya
  // OBS: detta nollställer seats_reserved. Det är OK nu när du inte har riktiga bokningar ännu.
  const { error: delErr } = await supabase
    .from("trip_departures")
    .delete()
    .eq("trip_id", tripId);

  if (delErr) {
    console.error("Kunde inte rensa trip_departures", delErr);
    // vi fortsätter ändå, men loggar
  }

  if (rowsToInsert.length > 0) {
    const { error: insErr } = await supabase
      .from("trip_departures")
      .insert(rowsToInsert);

    if (insErr) {
      console.error("Kunde inte skapa trip_departures", insErr);
      // vi låter resan vara sparad, men avgångar kan saknas om detta failar
    }
  }
}
