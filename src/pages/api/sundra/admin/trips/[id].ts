// src/pages/api/sundra/admin/trips/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

const PRICE_COL = "from_price_sek"; // DB-kolumnen

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("trips").select("*").eq("id", id).single();
    if (error) return res.status(500).json({ error: error.message });

    // Mappa DB -> UI (camelCase) + behåll original också
    const mapped = {
      ...data,
      fromPriceSEK: (data as any)[PRICE_COL] ?? null,

      // gör metaLine robust om du använder meta_line i DB
      metaLine: (data as any).metaLine ?? (data as any).meta_line ?? null,
    };

    return res.status(200).json(mapped);
  }

  if (req.method === "PUT") {
    const body = req.body ?? {};

    // SAFE patch – bara kända kolumner
    const patch: any = {
      title: body.title ?? null,
      type: body.type ?? null,
      status: body.status ?? null,
      slug: body.slug ?? null,

      meta_line: body.metaLine ?? body.meta_line ?? null,

      intro: body.intro ?? "",
      description: body.description ?? null,
      tags: body.tags ?? [],
    };

    // pris
    patch[PRICE_COL] = body.fromPriceSEK ?? null;

    // ✅ itinerary (jsonb) – du har kolumnen "itinerary"
    if (body.itinerary !== undefined) patch.itinerary = body.itinerary;

    // media (json / jsonb)
    if (body.media !== undefined) patch.media = body.media;

    const { data, error } = await supabaseAdmin
      .from("trips")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const mapped = {
      ...data,
      fromPriceSEK: (data as any)[PRICE_COL] ?? null,
      metaLine: (data as any).metaLine ?? (data as any).meta_line ?? null,
    };

    return res.status(200).json(mapped);
  }

  res.setHeader("Allow", "GET,PUT");
  return res.status(405).end("Method Not Allowed");
}
