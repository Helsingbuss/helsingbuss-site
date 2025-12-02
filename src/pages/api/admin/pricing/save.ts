// src/pages/api/admin/pricing/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

type SaveBody = {
  trip_id: string;
  ticket_type_id: number;
  departure_date: string | null;
  price: number;
  sales_valid_from?: string | null;
  sales_valid_to?: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const b = (req.body || {}) as SaveBody;

  if (!b.trip_id) {
    return res.status(400).json({ ok: false, error: "Saknar trip_id." });
  }
  if (!b.ticket_type_id) {
    return res
      .status(400)
      .json({ ok: false, error: "Saknar ticket_type_id." });
  }
  if (!b.price || isNaN(Number(b.price))) {
    return res
      .status(400)
      .json({ ok: false, error: "Ogiltigt pris." });
  }

  const depDate =
    b.departure_date && b.departure_date.length >= 10
      ? b.departure_date.slice(0, 10)
      : null;

  const salesFrom =
    b.sales_valid_from && b.sales_valid_from.length >= 10
      ? b.sales_valid_from.slice(0, 10)
      : null;

  const salesTo =
    b.sales_valid_to && b.sales_valid_to.length >= 10
      ? b.sales_valid_to.slice(0, 10)
      : null;

  try {
    const { data, error } = await supabase
      .from("trip_ticket_pricing")
      .upsert(
        {
          trip_id: b.trip_id,
          ticket_type_id: b.ticket_type_id,
          departure_date: depDate,
          price: Number(b.price),
          currency: "SEK",
          sales_valid_from: salesFrom,
          sales_valid_to: salesTo,
        },
        {
          onConflict: "trip_id,ticket_type_id,departure_date",
        }
      )
      .select(
        "id,trip_id,ticket_type_id,departure_date,price,currency,sales_valid_from,sales_valid_to"
      )
      .single();

    if (error) throw error;

    return res.status(200).json({ ok: true, row: data });
  } catch (e: any) {
    console.error("/api/admin/pricing/save error:", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Serverfel vid sparande." });
  }
}
