// src/pages/api/admin/fleet/delete-operator.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type Resp = {
  ok: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed (use POST)." });
  }

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ ok: false, error: "id saknas." });
  }

  try {
    // Finns fordon kopplade?
    const { data: buses, error: busErr } = await supabase
      .from("bus_models")
      .select("id")
      .eq("operator_id", id)
      .limit(1);

    if (busErr) throw busErr;

    if (buses && buses.length > 0) {
      return res.status(400).json({
        ok: false,
        error:
          "Kan inte ta bort operatör som har fordon. Ändra eller ta bort fordonen först.",
      });
    }

    const { error: delErr } = await supabase
      .from("bus_operators")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("delete-operator error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid borttagning av operatör.",
    });
  }
}
