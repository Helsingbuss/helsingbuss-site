import type { NextApiRequest, NextApiResponse } from "next";
import type { TripStatus } from "@/lib/sundra/trips/types";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || "");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { status } = req.body as { status: TripStatus };
  if (!status) return res.status(400).json({ error: "Missing status" });

  const { data, error } = await supabaseAdmin
    .from("trips")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
