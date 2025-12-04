// src/pages/api/admin/discounts/delete.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type DeleteResponse = {
  ok: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed (use POST).",
    });
  }

  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Saknar id.",
      });
    }

    const { error } = await supabase
      .from("discount_campaigns")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("admin/discounts/delete error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid borttagning.",
    });
  }
}
