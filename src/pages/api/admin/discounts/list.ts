// src/pages/api/admin/discounts/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type DiscountCampaign = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  trip_id?: string | null;
  discount_type: string;
  discount_value: number | null;
  min_quantity: number | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

type ListResponse = {
  ok: boolean;
  error?: string;
  campaigns?: DiscountCampaign[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("discount_campaigns")
      .select(
        "id, name, description, code, trip_id, discount_type, discount_value, min_quantity, start_date, end_date, active"
      )
      .order("start_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      campaigns: (data || []) as DiscountCampaign[],
    });
  } catch (e: any) {
    console.error("discounts/list error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Tekniskt fel." });
  }
}
