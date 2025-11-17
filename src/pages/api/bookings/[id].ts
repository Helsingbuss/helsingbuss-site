// src/pages/api/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";

type ApiOk = { ok: true; booking?: Record<string, any> };
type ApiErr = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "Saknar id" });

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Bokningen hittades inte" });

      return res.status(200).json({ ok: true, booking: data as Record<string, any> });
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const payload = (req.body ?? {}) as Record<string, any>;

      const { data, error } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Bokningen hittades inte" });

      return res.status(200).json({ ok: true, booking: data as Record<string, any> });
    }

    if (req.method === "DELETE") {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    console.error("bookings/[id] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
