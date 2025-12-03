// src/pages/api/admin/fleet/save-operator.ts
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

  const { id, name, code, phone, email, notes, active } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({
      ok: false,
      error: "Ange ett namn för operatören.",
    });
  }

  const patch = {
    name: String(name).trim(),
    code: code ? String(code).trim() : null,
    phone: phone ? String(phone).trim() : null,
    email: email ? String(email).trim() : null,
    notes: notes ? String(notes).trim() : null,
    active: active === false ? false : true,
  };

  try {
    let row: any;

    if (id) {
      const { data, error } = await supabase
        .from("bus_operators")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      row = data;
    } else {
      const { data, error } = await supabase
        .from("bus_operators")
        .insert(patch)
        .select("*")
        .single();

      if (error) throw error;
      row = data;
    }

    return res.status(200).json({ ok: true, row });
  } catch (e: any) {
    console.error("save-operator error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid sparande av operatör.",
    });
  }
}
