// src/pages/api/bookings/by-number.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isUndefinedColumn(err: any) {
  const m = String(err?.message || "").toLowerCase();
  return err?.code === "42703" || m.includes("does not exist") || m.includes("column");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const bookingNo = ((req.query.number as string) || "").trim().toUpperCase();

    if (!bookingNo || !/^BK[A-Z0-9]+$/.test(bookingNo)) {
      return res.status(400).json({ error: "Ogiltigt eller saknat bokningsnummer." });
    }

    const cols = ["booking_number", "booking_no", "bookingid"];
    let row: any = null;
    let lastErr: any = null;

    for (const col of cols) {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq(col, bookingNo)
        .maybeSingle();

      if (!error && data) {
        row = data;
        break;
      }
      if (error && !isUndefinedColumn(error)) {
        lastErr = error;
      }
    }

    if (lastErr) throw lastErr;
    if (!row) return res.status(404).json({ error: "Bokningen hittades inte." });

    return res.status(200).json({ ok: true, booking: row });
  } catch (e: any) {
    console.error("/api/bookings/by-number (query) error:", e?.message || e);
    return res.status(500).json({ error: "Kunde inte läsa bokningen" });
  }
}
