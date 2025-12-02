// src/pages/api/admin/pricing/load.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

// ÄNDRA HÄR om tabellen har annat namn (t.ex. "trip_ticket_prices")
const PRICING_TABLE = "trip_ticket_pricing";

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

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
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Resor
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select("id, title, year, slug, published")
      .order("title", { ascending: true });

    if (tripsErr) throw tripsErr;

    // Biljetttyper
    const { data: ticketTypes, error: ttErr } = await supabase
      .from("ticket_types")
      .select("id, name, code")
      .order("id", { ascending: true });

    if (ttErr && !isMissingTable(ttErr)) throw ttErr;

    // Avgångar
    const { data: departures, error: depErr } = await supabase
      .from("trip_departures")
      .select("trip_id, date, depart_date, dep_date, departure_date")
      .limit(1000);

    if (depErr && !isMissingTable(depErr)) throw depErr;

    // Prissättning
    let pricing: any[] = [];
    const { data: pricingData, error: pricingErr } = await supabase
      .from(PRICING_TABLE)
      .select(
        "id, trip_id, ticket_type_id, departure_date, price, currency"
      );

    if (pricingErr) {
      if (isMissingTable(pricingErr)) {
        console.warn(
          "[pricing/load] Tabell",
          PRICING_TABLE,
          "saknas – returnerar tom lista"
        );
        pricing = [];
      } else {
        throw pricingErr;
      }
    } else {
      pricing = pricingData || [];
    }

    return res.status(200).json({
      ok: true,
      trips: trips || [],
      ticket_types: ticketTypes || [],
      departures: departures || [],
      pricing,
    });
  } catch (e: any) {
    console.error("/api/admin/pricing/load error:", e?.message || e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid hämtning av prissättning.",
    });
  }
}
