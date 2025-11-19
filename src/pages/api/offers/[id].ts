// src/pages/api/offers/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";

// OBS: Ingen runtime här – default är Node.js för pages/api.
// Lämna helt bort config om du inte behöver bodyParser=false.

type ApiOk  = { offer: Record<string, any> };
type ApiErr = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idOrNo = String(req.query.id ?? "").trim();
  if (!idOrNo) return res.status(400).json({ error: "Missing id" });

  // Stöd både UUID och offertnummer (HBxxxxx)
  const isOfferNo = /^HB\d{5,}$/i.test(idOrNo);

  const base = supabase.from("offers").select("*").limit(1);
  const { data, error } = isOfferNo
    ? await base.eq("offer_number", idOrNo)
    : await base.eq("id", idOrNo);

  if (error) return res.status(500).json({ error: error.message });

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.status(200).json({ offer: row });
}
