// src/pages/api/admin/pricing/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

// Samma namn som i load.ts
const PRICING_TABLE = "trip_ticket_pricing";

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

type Body = {
  trip_id?: string;
  ticket_type_id?: number;
  departure_date?: string | null; // YYYY-MM-DD eller null (standardpris)
  price?: number;
};

function isMissingTable(err: any): boolean {
  const msg = String(err?.message || "");
  return /schema cache|does not exist/i.test(msg);
}

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

  const body = (req.body || {}) as Body;
  const trip_id = body.trip_id?.trim();
  const ticket_type_id = body.ticket_type_id;
  const departure_date = body.departure_date || null;
  const price = body.price;

  if (!trip_id) {
    return res
      .status(400)
      .json({ ok: false, error: "trip_id saknas." });
  }
  if (!ticket_type_id) {
    return res
      .status(400)
      .json({ ok: false, error: "ticket_type_id saknas." });
  }
  if (!price || isNaN(price)) {
    return res
      .status(400)
      .json({ ok: false, error: "Ogiltigt pris." });
  }

  try {
    const { data, error } = await supabase
      .from(PRICING_TABLE)
      .upsert(
        {
          trip_id,
          ticket_type_id,
          departure_date, // null = standardpris
          price,
          currency: "SEK",
        },
        {
          onConflict: "trip_id,ticket_type_id,departure_date",
        }
      )
      .select("id, trip_id, ticket_type_id, departure_date, price, currency")
      .single();

    if (error) {
      if (isMissingTable(error)) {
        throw new Error(
          `Tabellen ${PRICING_TABLE} finns inte i databasen. Kontrollera SQL-skriptet.`
        );
      }
      throw error;
    }

    return res.status(200).json({ ok: true, row: data });
  } catch (e: any) {
    console.error("/api/admin/pricing/save error:", e?.message || e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Kunde inte spara pris.",
    });
  }
}
