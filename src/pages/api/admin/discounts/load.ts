// src/pages/api/admin/discounts/load.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type DiscountCampaignRow = {
  id: string;
  name: string;
  label: string | null;
  description: string | null;
  type: string | null;
  value: number | null;
  trip_id: string | null;
  ticket_type_code: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

type TripOption = {
  id: string;
  title: string;
};

type TicketTypeOption = {
  code: string;
  name: string;
};

type LoadResponse = {
  ok: boolean;
  error?: string;
  campaigns?: DiscountCampaignRow[];
  trips?: TripOption[];
  ticket_types?: TicketTypeOption[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoadResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed (use GET).",
    });
  }

  try {
    // Kampanjer
    const { data: campaignRows, error: campErr } = await supabase
      .from("discount_campaigns")
      .select(
        "id, name, label, description, type, value, trip_id, ticket_type_code, start_date, end_date, active"
      )
      .order("created_at", { ascending: false });

    if (campErr) throw campErr;

    // Resor (för dropdown)
    const { data: tripRows, error: tripErr } = await supabase
      .from("trips")
      .select("id, title")
      .order("title", { ascending: true });

    if (tripErr) throw tripErr;

    // Biljettyper (för dropdown, vi kör via code)
    const { data: ticketTypeRows, error: ttErr } = await supabase
      .from("ticket_types")
      .select("code, name")
      .order("name", { ascending: true });

    if (ttErr) throw ttErr;

    return res.status(200).json({
      ok: true,
      campaigns: (campaignRows || []) as DiscountCampaignRow[],
      trips: (tripRows || []) as TripOption[],
      ticket_types: (ticketTypeRows || []) as TicketTypeOption[],
    });
  } catch (e: any) {
    console.error("admin/discounts/load error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid laddning av kampanjer.",
    });
  }
}
