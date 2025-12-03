// src/pages/api/admin/fleet/save-bus.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type SaveResp = {
  ok: boolean;
  row?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveResp>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed (use POST)." });
  }

  const { id, operator_id, name, capacity, notes, active } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({
      ok: false,
      error: "Ange ett namn för bussmodellen/fordonet.",
    });
  }

  const patch: any = {
    name: String(name).trim(),
    operator_id: operator_id || null,
    notes: notes ? String(notes).trim() : null,
    active: active === false ? false : true,
  };

  if (capacity !== undefined && capacity !== null && String(capacity).trim()) {
    const num = Number(capacity);
    if (Number.isNaN(num) || num <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Kapacitet måste vara ett positivt tal eller lämnas tomt.",
      });
    }
    patch.capacity = num;
  } else {
    patch.capacity = null;
  }

  try {
    let row: any;

    if (id) {
      const { data, error } = await supabase
        .from("bus_models")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      row = data;
    } else {
      const { data, error } = await supabase
        .from("bus_models")
        .insert(patch)
        .select("*")
        .single();

      if (error) throw error;
      row = data;
    }

    return res.status(200).json({ ok: true, row });
  } catch (e: any) {
    console.error("save-bus error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid sparande av fordon.",
    });
  }
}
