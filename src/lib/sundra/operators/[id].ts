// src/pages/api/sundra/admin/operators/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("operators").select("*").eq("id", id).single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ operator: data });
  }

  if (req.method === "PUT") {
    const body = req.body ?? {};

    // SAFE patch: bara kolumner som finns
    const patch: any = {};
    if (body.name !== undefined) patch.name = body.name ? String(body.name).trim() : null;
    if (body.short_name !== undefined) patch.short_name = body.short_name ?? null;
    if (body.contact_name !== undefined) patch.contact_name = body.contact_name ?? null;
    if (body.contact_email !== undefined) patch.contact_email = body.contact_email ?? null;
    if (body.contact_phone !== undefined) patch.contact_phone = body.contact_phone ?? null;
    if (body.website !== undefined) patch.website = body.website ?? null;
    if (body.logo_url !== undefined) patch.logo_url = body.logo_url ?? null;
    if (body.notes !== undefined) patch.notes = body.notes ?? null;
    if (body.is_active !== undefined) patch.is_active = !!body.is_active;

    if (patch.name !== undefined && !patch.name) {
      return res.status(400).json({ error: "name is required" });
    }

    const { data, error } = await supabaseAdmin.from("operators").update(patch).eq("id", id).select("*").single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ operator: data });
  }

  if (req.method === "DELETE") {
    // Säker default: inaktivera istället för att radera (så historik/avgångar inte sabbas)
    const { data, error } = await supabaseAdmin
      .from("operators")
      .update({ is_active: false })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, operator: data });
  }

  res.setHeader("Allow", "GET,PUT,DELETE");
  return res.status(405).end("Method Not Allowed");
}
