// src/pages/api/offers/[id]/send-offer.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

const U = <T extends string | number | null | undefined>(v: T) =>
  (v == null ? undefined : (v as Exclude<T, null>));
const S = (v: any) => (v == null ? null : String(v).trim() || null);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const id = String(req.query.id ?? "");
    if (!id) return res.status(400).json({ error: "Saknar offert-id" });

    const { data, error } = await supabase
      .from("offers")
      .select([
        "id",
        "offer_number",
        "status",
        "contact_person",
        "customer_email",
        "customer_phone",
        "departure_place",
        "destination",
        "departure_date",
        "departure_time",
        "via",
        "stop",
        "passengers",
        "return_departure",
        "return_destination",
        "return_date",
        "return_time",
        "notes",
      ].join(","))
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: "Offerten hittades inte" });

    const offer: any = data;

    // Sätt status "besvarad"
    const current = String(offer.status ?? "").toLowerCase();
    if (current !== "besvarad") {
      const { error: uerr } = await supabase
        .from("offers")
        .update({ status: "besvarad" })
        .eq("id", id);
      if (uerr) return res.status(500).json({ error: uerr.message });
      offer.status = "besvarad";
    }

    await sendOfferMail({
      offerId:      String(offer.id),
      offerNumber:  String(offer.offer_number),

      customerEmail: U(S(offer.customer_email)),
      customerName:  U(S(offer.contact_person)),
      customerPhone: U(S(offer.customer_phone)),

      from: U(S(offer.departure_place)),
      to:   U(S(offer.destination)),
      date: U(S(offer.departure_date)),
      time: U(S(offer.departure_time)),

      via:  U(S(offer.via)),
      stop: U(S(offer.stop)),

      passengers: typeof offer.passengers === "number" ? offer.passengers : undefined,

      return_from: U(S(offer.return_departure)),
      return_to:   U(S(offer.return_destination)),
      return_date: U(S(offer.return_date)),
      return_time: U(S(offer.return_time)),

      notes: U(S(offer.notes)),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[offers/[id]/send-offer] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
