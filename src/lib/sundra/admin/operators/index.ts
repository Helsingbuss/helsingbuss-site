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
    .select("id,name,short_name,is_active,logo_url")
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // endast aktiva som default (men behåll om du vill se alla)
  const operators = (data ?? []).filter((o: any) => o.is_active !== false);

  return res.status(200).json({ operators });
}
