import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/bookings/by-number?no=BK25XXXX
 * Returnerar { booking } eller 404
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const no = (req.query.no as string | undefined)?.trim();
    if (!no) return res.status(400).json({ error: "Missing ?no=BK…" });

    // Antag att kolumnen heter booking_number (justera om din DB skiljer sig)
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, booking_number, passengers, contact_person, customer_email, customer_phone, departure_place, destination, departure_date, departure_time, notes"
      )
      .ilike("booking_number", no)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });

    return res.status(200).json({ booking: data });
  } catch (e: any) {
    console.error("/api/bookings/by-number error:", e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
