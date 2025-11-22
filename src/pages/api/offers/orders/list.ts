// src/pages/api/orders/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

// Rå-rad från databasen (driver_orders / orders)
type RawOrder = {
  id: string;
  order_number?: string | null;
  booking_id?: string | null;

  status?: string | null; // t.ex. "planerad" | "pågående" | "avslutad" | "annullerad"

  driver_id?: string | null;
  vehicle_id?: string | null;

  // Datum/tid kan heta olika i olika versioner
  departure_date?: string | null;
  departure_time?: string | null;
  start_date?: string | null;
  start_time?: string | null;

  return_date?: string | null;
  return_time?: string | null;
  // ev. framtida alias
  out_date?: string | null;
  out_time?: string | null;
  ret_date?: string | null;
  ret_time?: string | null;
};

// Den form vi skickar till frontend-tabellen
export type OrderRow = {
  id: string;
  order_number: string | null;
  booking_id: string | null;
  status: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  departure_date: string | null;
  departure_time: string | null;
  return_date: string | null;
  return_time: string | null;
};

function normalizeOrder(o: RawOrder): OrderRow {
  const statusNorm = (o.status ?? "").toLowerCase();

  return {
    id: o.id,
    order_number: o.order_number ?? null,
    booking_id: o.booking_id ?? null,
    status: statusNorm || null,
    driver_id: o.driver_id ?? null,
    vehicle_id: o.vehicle_id ?? null,

    // Försök plocka datum/tid från alla tänkbara kolumner
    departure_date:
      o.departure_date ??
      o.start_date ??
      o.out_date ??
      null,
    departure_time:
      o.departure_time ??
      o.start_time ??
      o.out_time ??
      null,
    return_date:
      o.return_date ??
      o.ret_date ??
      null,
    return_time:
      o.return_time ??
      o.ret_time ??
      null,
  };
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const scope = String(req.query.scope || "all"); // "all" | "upcoming"
    const page =
      Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(
        5,
        parseInt(String(req.query.pageSize ?? "10"), 10) || 10
      )
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Basfråga – läs från driver_orders (byt till "orders" om din tabell heter så)
    let q = supabase.from("driver_orders").select("*", {
      count: "exact",
    });

    if (scope === "upcoming") {
      // Kommande körordrar: från idag och INTE avslutad/annullerad
      const today = ymd(new Date());

      q = q
        .gte("departure_date", today)
        .not("status", "in", '("avslutad","annullerad")')
        .order("departure_date", { ascending: true })
        .order("departure_time", { ascending: true });
    } else {
      // Alla – sortera nyast först
      q = q
        .order("departure_date", { ascending: false })
        .order("departure_time", { ascending: false });
    }

    const { data, error, count } = await q.range(from, to);
    if (error) throw error;

    const rows = (data || []).map(normalizeOrder);

    return res.status(200).json({
      rows,
      page,
      pageSize,
      total: count ?? rows.length,
    });
  } catch (e: any) {
    console.error("/api/orders/list error:", e?.message || e);
    return res
      .status(500)
      .json({ error: "Kunde inte hämta körordrar" });
  }
}
