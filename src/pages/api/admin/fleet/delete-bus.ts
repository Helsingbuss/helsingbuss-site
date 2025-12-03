// src/pages/api/admin/fleet/delete-bus.ts
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
    // Kolla om någon resa använder bus_model_id
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select("id")
      .eq("bus_model_id", id)
      .limit(1);

    if (tripsErr) throw tripsErr;

    if (trips && trips.length > 0) {
      return res.status(400).json({
        ok: false,
        error:
          "Kan inte ta bort fordon som är kopplat till en resa. Ändra resan först.",
      });
    }

    const { error: delErr } = await supabase
      .from("bus_models")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("delete-bus error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid borttagning av fordon.",
    });
  }
}
