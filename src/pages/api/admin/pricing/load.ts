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
};

type TicketType = {
  id: number;
  name: string;
  code?: string | null;
};

type Departure = {
  trip_id: string | null;
  date: string | null;
};

type PricingRow = {
  id: number;
  trip_id: string;
  ticket_type_id: number;
  departure_date: string | null;
  price: number;
  currency: string;
};

type LoadResponse = {
  ok: boolean;
  trips: Trip[];
  ticket_types: TicketType[];
  departures: Departure[];
  pricing: PricingRow[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoadResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, trips: [], ticket_types: [], departures: [], pricing: [], error: "Method not allowed" });
  }

  try {
    const [tripsRes, ticketTypesRes, departuresRes, pricingRes] =
      await Promise.all([
        // Alla resor
        supabase
          .from("trips")
          .select("id,title,year,published,slug")
          .order("title", { ascending: true }),

        // Alla biljetttyper
        supabase
          .from("ticket_types")
          .select("id,name,code")
          .order("id", { ascending: true }),

        // Alla avgångar – endast trip_id + date
        supabase
          .from("trip_departures")
          .select("trip_id,date")
          .order("date", { ascending: true }),

        // Prissättning (om du redan har rader där)
        supabase
          .from("trip_ticket_pricing")
          .select("id,trip_id,ticket_type_id,departure_date,price,currency")
          .order("trip_id", { ascending: true }),
      ]);

    if (tripsRes.error) throw tripsRes.error;
    if (ticketTypesRes.error) throw ticketTypesRes.error;
    if (departuresRes.error) throw departuresRes.error;
    if (pricingRes.error) throw pricingRes.error;

    const trips = (tripsRes.data || []) as Trip[];
    const ticket_types = (ticketTypesRes.data || []) as TicketType[];
    const departures = (departuresRes.data || []) as Departure[];
    const pricing = (pricingRes.data || []) as PricingRow[];

    return res.status(200).json({
      ok: true,
      trips,
      ticket_types,
      departures,
      pricing,
    });
  } catch (e: any) {
    console.error("pricing/load failed:", e);
    return res.status(500).json({
      ok: false,
      trips: [],
      ticket_types: [],
      departures: [],
      pricing: [],
      error: e?.message || "Tekniskt fel vid läsning.",
    });
  }
}
