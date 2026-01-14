// src/pages/api/sundra/admin/operators/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const { data, error } = await supabaseAdmin
    .from("operators")
    .select("id,name,short_name,logo_url,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ operators: data ?? [] });
}
