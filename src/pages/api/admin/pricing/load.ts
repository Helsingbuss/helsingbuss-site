// src/pages/api/admin/pricing/load.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type Trip = {
  id: string;
  title: string;
  year: number | null;
  slug?: string | null;
  published: boolean;
  departures?: any; // JSONB med turlista
};

type TicketType = {
  id: number;
  name: string;
  code?: string | null;
};

type DepartureRow = {
  trip_id: string;
  depart_date: string | null; // från tabellen trip_departures
};

type PricingRow = {
  id: number;
  trip_id: string;
  ticket_type_id: number;
  departure_date: string | null;
  price: number;
  currency: string;
};

type Resp = {
  ok: boolean;
  trips: Trip[];
  ticket_types: TicketType[];
  departures: DepartureRow[];
  pricing: PricingRow[];
  error?: string;
};

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      trips: [],
      ticket_types: [],
      departures: [],
      pricing: [],
      error: "Method not allowed",
    });
  }

  try {
    // 1) Resor (inkl. departures-JSON)
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select("id, title, year, slug, published, departures")
      .order("title", { ascending: true });

    if (tripsErr) throw tripsErr;

    // 2) Biljetttyper
    const { data: ticketTypes, error: ttErr } = await supabase
      .from("ticket_types")
      .select("id, name, code")
      .order("name", { ascending: true });

    if (ttErr) throw ttErr;

    // 3) Avgångar från trip_departures
    const { data: depRows, error: depErr } = await supabase
      .from("trip_departures")
      .select("trip_id, depart_date");

    if (depErr) throw depErr;

    // 4) Priser
    const { data: pricing, error: prErr } = await supabase
      .from("trip_ticket_pricing")
      .select("id, trip_id, ticket_type_id, departure_date, price, currency");

    if (prErr) throw prErr;

    return res.status(200).json({
      ok: true,
      trips: trips || [],
      ticket_types: ticketTypes || [],
      departures: depRows || [],
      pricing: pricing || [],
    });
  } catch (e: any) {
    console.error("pricing/load error", e);
    return res.status(500).json({
      ok: false,
      trips: [],
      ticket_types: [],
      departures: [],
      pricing: [],
      error: e?.message || "Tekniskt fel.",
    });
  }
}
