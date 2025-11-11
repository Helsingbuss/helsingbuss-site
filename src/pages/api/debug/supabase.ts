// src/pages/api/debug/supabase.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function httpErr(res: NextApiResponse, code: number, msg: string) {
  return res.status(code).json({ ok: false, error: msg });
}

function env(v?: string, fallback = "") {
  return (v ?? "").trim() || fallback;
}

function generateBookingNo(): string {
  const yy = new Date().getFullYear().toString().slice(-2);
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `BK${yy}${rnd}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return httpErr(res, 405, "Method not allowed");
    }

    const tokenFromEnv = env(process.env.DEBUG_EMAIL_TOKEN); // återanvänd samma token
    const tokenFromReq =
      (req.query.token as string) ||
      (req.headers["x-debug-token"] as string) ||
      (req.body?.token as string) ||
      "";

    if (tokenFromEnv) {
      if (tokenFromReq !== tokenFromEnv) {
        return httpErr(res, 401, "Unauthorized (bad or missing token)");
      }
    } else if (process.env.NODE_ENV === "production") {
      return httpErr(res, 401, "Unauthorized (DEBUG_EMAIL_TOKEN not set)");
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const booking_number = generateBookingNo();

    const payload = {
      booking_number,
      status: "bokad",
      contact_person: "Debug Kund",
      customer_email: "debug@helsingbuss.se",
      customer_phone: "+4640123456",
      passengers: 10,
      departure_place: "Helsingborg",
      destination: "Malmö",
      departure_date: date,
      departure_time: time,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(payload)
      .select("id, booking_number, departure_place, destination, departure_date, departure_time")
      .single();

    if (error) {
      return httpErr(res, 500, `Supabase insert error: ${error.message || String(error)}`);
    }

    return res.status(200).json({ ok: true, inserted: data });
  } catch (e: any) {
    return httpErr(res, 500, e?.message || "Unexpected error");
  }
}
