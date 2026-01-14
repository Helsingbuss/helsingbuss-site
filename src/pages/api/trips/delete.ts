import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const idFromQuery = typeof req.query.id === "string" ? req.query.id : "";
  const idFromBody = typeof (req.body?.id) === "string" ? req.body.id : "";
  const id = idFromQuery || idFromBody;

  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing id" });
  }

  try {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      console.error("Delete trip error:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Delete failed",
        details: error,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("Delete trip exception:", e);
    return res.status(500).json({
      ok: false,
      error: e?.message ?? "Server error",
      details: e ?? null,
    });
  }
}
