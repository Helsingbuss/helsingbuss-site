import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
const supabase = (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: "Saknar id" });

  if (req.method === "GET") {
    const q = await supabase.from("driver_orders").select("*").eq("id", id).single();
    if (q.error) return res.status(404).json({ error: q.error.message || "Hittades inte" });
    return res.status(200).json({ order: q.data });
  }

  if (req.method === "PATCH") {
    const b = req.body || {};
    const upd = await supabase
      .from("driver_orders")
      .update({
        status: b.status ?? undefined,
        ack_at: b.ack ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (upd.error) return res.status(500).json({ error: upd.error.message || "Kunde inte uppdatera" });
    return res.status(200).json({ order: upd.data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
