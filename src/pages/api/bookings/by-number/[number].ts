// src/pages/api/bookings/by-number.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/bookings/by-number?no=BK25XXXX
 * Returnerar { booking } eller 404
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const no = String(req.query.no || req.query.number || "").trim();
    if (!no) {
      return res.status(400).json({ error: "Missing booking number (?no=...)" });
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(
        [
          "id",
          "booking_number",
          "passengers",
          "contact_person",
          "customer_email",
          "customer_phone",
          "departure_place",
          "destination",
          "departure_date",
          "departure_time",
          "end_time",
          "on_site_minutes",
          "stopover_places",
          "return_departure",
          "return_destination",
          "return_date",
          "return_time",
          "return_end_time",
          "return_on_site_minutes",
          "notes",
        ].join(",")
      )
      .eq("booking_number", no)
      .maybeSingle();

    if (error) {
      console.error("[by-number] supabase error:", error);
      return res.status(500).json({ error: "Database error" });
    }
    if (!data) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.status(200).json({ booking: data });
  } catch (e: any) {
    console.error("/api/bookings/by-number error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
}
