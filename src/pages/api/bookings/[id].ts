// src/pages/api/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type JsonError = { error: string };

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s || ""
  );
}

// Om du vill stödja "BK123..." också (rekommenderas)
function looksLikeBookingNo(s: string) {
  return /^BK\d{3,}$/i.test(s || "");
}

function pickLabel(row: any): string | null {
  if (!row) return null;
  return (
    row.label ??
    row.name ??
    row.full_name ??
    row.title ??
    row.registration_number ??
    row.reg_no ??
    row.plate ??
    row.number ??
    null
  );
}

async function safeLookup(table: string, id: string): Promise<string | null> {
  if (!supabase || !id) return null;
  try {
    // INTE single() här heller – ta max 1 rad
    const { data, error } = await supabase.from(table).select("*").eq("id", id).limit(1);
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : null;
    return pickLabel(row);
  } catch {
    return null;
  }
}

function toNull(v: any) {
  return v === "" || v === undefined ? null : v;
}

function toNumOrNull(v: any): number | null {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Hämtar 0-2 rader för att undvika PostgREST "Cannot coerce..."
 * och för att kunna hantera ev. dubletter utan att krascha.
 */
async function getBookingBy(keyCol: "id" | "booking_number", id: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq(keyCol, id)
    .limit(2);

  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return rows;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any | JsonError>) {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase-admin är inte korrekt initierad." });
    }

    const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const idRaw = String(rawId || "").trim();
    if (!idRaw) return res.status(400).json({ error: "Saknar id" });

    // SUPERVIKTIGT: Om Next råkar route:a /api/bookings/calender till [id]
    // så ska vi INTE försöka köra single/uuid osv.
    const lower = idRaw.toLowerCase();
    if (lower === "calender" || lower === "calendar") {
      return res.status(404).json({ error: "Not found" });
    }

    // Avgör kolumn
    // - UUID => id
    // - annars booking_number (t.ex. BKxxxxx)
    // - annars fallback booking_number (tolerant)
    const keyCol: "id" | "booking_number" = isUUID(idRaw)
      ? "id"
      : "booking_number";

    // -------- GET --------
    if (req.method === "GET") {
      const rows = await getBookingBy(keyCol, idRaw);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Bokning hittades inte" });
      }

      const data = rows[0];

      const driver_label = data?.assigned_driver_id
        ? await safeLookup("drivers", String(data.assigned_driver_id))
        : null;

      const vehicle_label = data?.assigned_vehicle_id
        ? await safeLookup("vehicles", String(data.assigned_vehicle_id))
        : null;

      // OBS: om rows.length > 1 betyder det dublett i DB på booking_number.
      // Vi kraschar inte – vi tar första.
      return res.status(200).json({
        ok: true,
        booking: data,
        driver_label,
        vehicle_label,
        duplicate_warning: rows.length > 1 ? true : undefined,
      });
    }

    // -------- PUT (update) --------
    if (req.method === "PUT") {
      const p = req.body ?? {};

      const update: Record<string, any> = {
        status: toNull(p.status),

        contact_person: toNull(p.contact_person),
        customer_email: toNull(p.customer_email),
        customer_phone: toNull(p.customer_phone),

        passengers: toNumOrNull(p.passengers),

        departure_place: toNull(p.departure_place),
        destination: toNull(p.destination),
        departure_date: toNull(p.departure_date),
        departure_time: toNull(p.departure_time),
        end_time: toNull(p.end_time),
        on_site_minutes: toNumOrNull(p.on_site_minutes),
        stopover_places: toNull(p.stopover_places),

        return_departure: toNull(p.return_departure),
        return_destination: toNull(p.return_destination),
        return_date: toNull(p.return_date),
        return_time: toNull(p.return_time),
        return_end_time: toNull(p.return_end_time),
        return_on_site_minutes: toNumOrNull(p.return_on_site_minutes),

        notes: toNull(p.notes),

        assigned_driver_id: toNull(p.assigned_driver_id),
        assigned_vehicle_id: toNull(p.assigned_vehicle_id),

        total_price: toNumOrNull(p.total_price),

        updated_at: new Date().toISOString(),
      };

      // 1) Hämta först en rad (så vi får ett säkert uuid-id att uppdatera)
      const rows = await getBookingBy(keyCol, idRaw);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Bokning hittades inte" });
      }
      const row = rows[0];
      const realId = String(row.id);

      // 2) Uppdatera på uuid (alltid säkrast)
      const { data, error } = await supabase
        .from("bookings")
        .update(update)
        .eq("id", realId)
        .select("*")
        .limit(1);

      if (error) throw error;

      const updated = Array.isArray(data) ? data[0] : null;
      if (!updated) return res.status(500).json({ error: "Kunde inte spara (ingen rad returnerades)" });

      return res.status(200).json({ ok: true, booking: updated });
    }

    // -------- DELETE --------
    if (req.method === "DELETE") {
      // samma logik: hitta riktig uuid först
      const rows = await getBookingBy(keyCol, idRaw);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Bokning hittades inte" });
      }
      const realId = String(rows[0].id);

      const { data, error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", realId)
        .select("id")
        .limit(1);

      if (error) throw error;

      const deleted = Array.isArray(data) ? data[0] : null;
      return res.status(200).json({ ok: true, deleted });
    }

    res.setHeader("Allow", "GET,PUT,DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    console.error("/api/bookings/[id] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
