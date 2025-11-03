// src/pages/api/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function looksMissingColumn(err: any) {
  const m = String(err?.message || "").toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("column") ||
    err?.code === "42703" // undefined_column
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: "Saknar id" });

  try {
    // Försök med rik selekt – backa till en minimal om kolumner saknas i ditt schema.
    const fullCols =
      "id, booking_number, status, contact_person, customer_email, customer_phone, " +
      "passengers, departure_place, destination, departure_date, departure_time, end_time, " +
      "on_site_minutes, stopover_places, return_departure, return_destination, return_date, " +
      "return_time, return_end_time, return_on_site_minutes, notes, " +
      "assigned_driver_id, assigned_vehicle_id, created_at, updated_at";

    let { data, error } = await supabaseAdmin
      .from("bookings")
      .select(fullCols)
      .eq("id", id)
      .single();

    if (error && looksMissingColumn(error)) {
      // Minimal fallback – funkar även i äldre/mindre schema
      const fb = await supabaseAdmin
        .from("bookings")
        .select("id, passengers, departure_place, destination, departure_date, departure_time, notes, created_at, assigned_driver_id, assigned_vehicle_id")
        .eq("id", id)
        .single();

      if (fb.error) throw fb.error;
      data = fb.data;
    } else if (error) {
      throw error;
    }

    // Slå upp etiketter för tilldelade resurser (tolerant om tabeller saknas)
    let driver_label: string | null = null;
    let vehicle_label: string | null = null;

    try {
      if (data?.assigned_driver_id) {
        const d = await supabaseAdmin
          .from("drivers")
          .select("first_name, last_name, email, phone")
          .eq("id", data.assigned_driver_id)
          .single();
        if (!d.error && d.data) {
          const name = [d.data.first_name, d.data.last_name].filter(Boolean).join(" ");
          driver_label = name || d.data.email || d.data.phone || "Chaufför";
        }
      }
    } catch { /* ignore */ }

    try {
      if (data?.assigned_vehicle_id) {
        const v = await supabaseAdmin
          .from("vehicles")
          .select("reg_no, name, call_sign")
          .eq("id", data.assigned_vehicle_id)
          .single();
        if (!v.error && v.data) {
          vehicle_label = v.data.reg_no || v.data.name || v.data.call_sign || "Fordon";
        }
      }
    } catch { /* ignore */ }

    return res.status(200).json({ booking: data, driver_label, vehicle_label });
  } catch (e: any) {
    console.error("/api/bookings/[id] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
