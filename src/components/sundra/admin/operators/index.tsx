// src/pages/api/sundra/admin/operators/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const q = String(req.query.q ?? "").trim();
    const active = String(req.query.active ?? "").trim(); // "true" | "false" | ""

    let query = supabaseAdmin
      .from("operators")
      .select("*")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (active === "true") query = query.eq("is_active", true);
    if (active === "false") query = query.eq("is_active", false);

    if (q) {
      const like = `%${q}%`;
      query = query.or(`name.ilike.${like},short_name.ilike.${like},contact_name.ilike.${like},contact_email.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ operators: data ?? [] });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};
    const name = String(body.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });

    const insert = {
      name,
      short_name: body.short_name ?? null,
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      contact_phone: body.contact_phone ?? null,
      website: body.website ?? null,
      logo_url: body.logo_url ?? null,
      notes: body.notes ?? null,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabaseAdmin.from("operators").insert(insert).select("*").single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ operator: data });
  }

  res.setHeader("Allow", "GET,POST");
  return res.status(405).end("Method Not Allowed");
}
