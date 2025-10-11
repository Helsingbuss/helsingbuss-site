// src/pages/api/offers/[id]/quote.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query as { id: string };
  const { mode, input, breakdown } = req.body as {
    mode: "draft" | "send";
    input: any;
    breakdown: {
      grandExVat: number;
      grandVat: number;
      grandTotal: number;
      serviceFeeExVat: number;
      legs: { subtotExVat: number; vat: number; total: number }[];
    };
  };

  try {
    const patch: any = {
      amount_ex_vat: breakdown.grandExVat,
      vat_amount: breakdown.grandVat,
      total_amount: breakdown.grandTotal,
      calc_json: input,
      vat_breakdown: breakdown,
      updated_at: new Date().toISOString(),
    };

    if (mode === "send") {
      patch.status = "skickad";
      patch.sent_at = new Date().toISOString();
    }

    const { error } = await supabase.from("offers").update(patch).eq("id", id);
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
