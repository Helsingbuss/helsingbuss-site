// src/pages/api/bookings/by-number/[number].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/bookings/by-number/BK25XXXX
 *    eller
 * GET /api/bookings/by-number?no=BK25XXXX
 *
 * Svar: { booking } eller relevant 4xx/5xx
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const raw =
      (req.query.number as string | undefined)?.trim() ||
      (req.query.no as string | undefined)?.trim() ||
      "";

    if (!raw) {
      return res.status(400).json({ error: "Missing booking number (?no=BK… eller /by-number/{no})" });
    }

    // Normalisera: ta bort whitespace, håll originalfall men säkra upp
    const no = raw.replace(/\s+/g, "");

    // Fälten vi vill visa i admin-detaljvyn
    const selectCols =
      "id, booking_number, status, " +
      "passengers, contact_person, customer_email, customer_phone, " +
      "departure_place, destination, departure_date, departure_time, end_time, on_site_minutes, stopover_places, " +
      "return_departure, return_destination, return_date, return_time, return_end_time, return_on_site_minutes, " +
      "notes, created_at, updated_at";

    // 1) Försök EXAKT match (säkrast)
    let { data, error } = await supabaseAdmin
      .from("bookings")
      .select(selectCols)
      .eq("booking_number", no)
      .maybeSingle();

    // 2) Om ej träff: försök case-insensitiv exaktmatch via ilike utan wildcards
    if (!error && !data) {
      const { data: data2, error: err2 } = await supabaseAdmin
        .from("bookings")
        .select(selectCols)
        .ilike("booking_number", no) // ingen %/_ här → fungerar som case-insensitive exact i praktiken
        .maybeSingle();

      data = data2 ?? null;
      error = err2 ?? null;
    }

    if (error) {
      // Supabase-fel → 500
      return res.status(500).json({ error: "Database error" });
    }
    if (!data) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.status(200).json({ booking: data });
  } catch (e: any) {
    // Kort och säker loggning
    console.error("GET /api/bookings/by-number failed:", e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
