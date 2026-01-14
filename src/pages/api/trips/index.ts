import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

function setCORS(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normStatus(v: unknown) {
  const s = String(v ?? "all").toLowerCase();
  if (s === "draft" || s === "published" || s === "archived") return s;
  return "all";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const status = normStatus(req.query.status);

    let q = supabase.from("trips").select("*").order("updated_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw error;

    const trips = (data ?? []).map((row: any) => ({
      id: String(row?.id ?? ""),
      title: String(row?.title ?? ""),
      slug: String(row?.slug ?? ""),
      status: String(row?.status ?? (row?.published ? "published" : "draft")).toLowerCase(),
      type: String(row?.type ?? "DAY").toUpperCase(),
      intro: String(row?.intro ?? row?.subtitle ?? ""),
      fromPriceSEK: row?.from_price_sek ?? row?.price_from_sek ?? row?.price_from ?? null,
      coverUrl: row?.media?.heroImageUrl ?? row?.hero_image_url ?? row?.hero_image ?? null,
      updatedAt: row?.updated_at ?? null,
    }));

    return res.status(200).json({ ok: true, trips });
  } catch (e: any) {
    console.error("/api/trips error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message ?? "Server error", trips: [] });
  }
}
