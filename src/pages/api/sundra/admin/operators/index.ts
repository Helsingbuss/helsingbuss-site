// src/pages/api/sundra/admin/operators/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

type OperatorRecord = {
  id: string;
  name: string;
  short_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
};

function asString(v: unknown) {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
}

function normalizeBody(req: NextApiRequest) {
  const b: any = req.body;
  if (!b) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sb = supabaseAdmin();

    if (req.method === "GET") {
      const q = asString(req.query.q).trim();
      const active = asString(req.query.active).trim(); // "true" | "false" | ""

      let query = sb
        .from("operators")
        .select(
          "id,name,short_name,contact_name,contact_email,contact_phone,website,logo_url,notes,is_active,created_at"
        )
        .order("is_active", { ascending: false })
        .order("name", { ascending: true });

      if (active === "true") query = query.eq("is_active", true);
      if (active === "false") query = query.eq("is_active", false);

      if (q) {
        // matcha på name + short_name + kontakt
        query = query.or(
          [
            `name.ilike.%${q}%`,
            `short_name.ilike.%${q}%`,
            `contact_name.ilike.%${q}%`,
            `contact_email.ilike.%${q}%`,
          ].join(",")
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return res.status(200).json({ operators: (data ?? []) as OperatorRecord[] });
    }

    if (req.method === "POST") {
      const body = normalizeBody(req);

      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return res.status(400).json({ error: "name is required" });

      const payload = {
        name,
        short_name: typeof body.short_name === "string" ? body.short_name.trim() : null,
        contact_name: typeof body.contact_name === "string" ? body.contact_name.trim() : null,
        contact_email: typeof body.contact_email === "string" ? body.contact_email.trim() : null,
        contact_phone: typeof body.contact_phone === "string" ? body.contact_phone.trim() : null,
        website: typeof body.website === "string" ? body.website.trim() : null,
        logo_url: typeof body.logo_url === "string" ? body.logo_url.trim() : null,
        notes: typeof body.notes === "string" ? body.notes.trim() : null,
        is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      };

      const { data, error } = await sb
        .from("operators")
        .insert(payload)
        .select(
          "id,name,short_name,contact_name,contact_email,contact_phone,website,logo_url,notes,is_active,created_at"
        )
        .single();

      if (error) throw new Error(error.message);

      return res.status(201).json({ operator: data as OperatorRecord });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
