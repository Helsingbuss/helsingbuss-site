// src/pages/api/admin/discounts/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type SaveResponse = {
  ok: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      id,
      name,
      description,
      code,
      trip_id,
      discount_type,
      discount_value,
      min_quantity,
      start_date,
      end_date,
      active,
    } = req.body || {};

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Ange ett namn på kampanjen." });
    }

    const row: any = {
      name: name.trim(),
      description: description ? String(description).trim() : null,
      code: code ? String(code).trim() : null,
      trip_id: trip_id || null,
      discount_type: discount_type || "fixed",
      discount_value:
        discount_value !== undefined && discount_value !== null
          ? Number(discount_value)
          : null,
      min_quantity:
        min_quantity !== undefined && min_quantity !== null
          ? Number(min_quantity)
          : null,
      start_date: start_date || null,
      end_date: end_date || null,
      active: active !== false,
    };

    if (id) {
      row.id = id;
    }

    const { error } = await supabase
      .from("discount_campaigns")
      .upsert(row, { onConflict: "id" });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("discounts/save error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Tekniskt fel." });
  }
}
