import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
const supabase = (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const {
      title, slug, image_url,
      category,
      promo_enabled, promo_text, promo_color,
      heading, body, intro_title, intro_sub,
      price_mode, price_from, price_prefix, price_suffix, button_label,
      published = true,
    } = req.body || {};

    if (!title || !slug) return res.status(400).json({ error: "title och slug krävs" });

    const payload = {
      title, slug, image_url: image_url || null,
      category: category || null,
      promo_enabled: !!promo_enabled,
      promo_text: promo_text || null,
      promo_color: promo_color === "blue" ? "blue" : "red",
      heading: heading || null,
      body: body || null,
      intro_title: intro_title || null,
      intro_sub: intro_sub || null,
      price_mode: price_mode === "button" ? "button" : "pill",
      price_from: price_from != null && price_from !== "" ? Number(price_from) : null,
      price_prefix: price_prefix ?? "fr.",
      price_suffix: price_suffix ?? ":-",
      button_label: button_label ?? "Se datum & boka",
      published: !!published,
    };

    const { data, error } = await supabase.from("trips").insert(payload).select().single();
    if (error) throw error;
    return res.status(200).json({ ok: true, trip: data });
  } catch (e: any) {
    console.error("/api/trips/create error", e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
