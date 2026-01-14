// src/pages/api/sundra/admin/operators/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

function asId(v: unknown) {
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
  return (s || "").trim();
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
    const id = asId(req.query.id);
    if (!id) return res.status(400).json({ error: "Missing id" });

    if (req.method === "PUT") {
      const body = normalizeBody(req);

      const patch: any = {};
      const setStr = (k: string) => {
        if (typeof body[k] === "string") patch[k] = body[k].trim() || null;
      };

      setStr("name");
      setStr("short_name");
      setStr("contact_name");
      setStr("contact_email");
      setStr("contact_phone");
      setStr("website");
      setStr("logo_url");
      setStr("notes");

      if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

      if (patch.name !== undefined && !patch.name) {
        return res.status(400).json({ error: "name cannot be empty" });
      }

      const { data, error } = await sb
        .from("operators")
        .update(patch)
        .eq("id", id)
        .select(
          "id,name,short_name,contact_name,contact_email,contact_phone,website,logo_url,notes,is_active,created_at"
        )
        .single();

      if (error) throw new Error(error.message);

      return res.status(200).json({ operator: data });
    }

    if (req.method === "DELETE") {
      const { error } = await sb.from("operators").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
