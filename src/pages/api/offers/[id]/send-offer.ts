// Kör alltid på Node (krävs för process.env)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail, type SendOfferParams } from "@/lib/sendMail";
import { buildAdminOfferLink, buildOfferPublicLink } from "@/lib/offerToken";

const U = <T extends string | number | null | undefined>(v: T) =>
  (v == null ? undefined : (v as Exclude<T, null>));
const S = (v: any) => (v == null ? null : String(v).trim() || null);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Säkerställ att nyckeln verkligen finns i denna runtime
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_API_KEY.trim()) {
      return res.status(500).json({ error: "RESEND_API_KEY saknas" });
    }

    const id = String(req.query.id ?? "");
    if (!id) return res.status(400).json({ error: "Saknar offert-id" });

    const { data, error } = await supabase
      .from("offers")
      .select(
        [
          "id",
          "offer_number",
          "status",
          // kontakt
          "contact_person",
          "customer_email",
          "customer_phone",
          // resa
          "departure_place",
          "destination",
          "departure_date",
          "departure_time",
          "passengers",
          "via",
          "stop",
          // retur
          "return_departure",
          "return_destination",
          "return_date",
          "return_time",
        ].join(",")
      )
      .eq("id", id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: "Offerten hittades inte" });

    const offer: any = data;

    // Sätt status "besvarad" om inte redan
    const current = String(offer.status ?? "").toLowerCase();
    if (current !== "besvarad") {
      const { error: uerr } = await supabase
        .from("offers")
        .update({ status: "besvarad" })
        .eq("id", id);
      if (uerr) return res.status(500).json({ error: uerr.message });
      offer.status = "besvarad";
    }

    // Länkar
    const adminUrl    = buildAdminOfferLink(offer.id, String(offer.offer_number));
    const customerUrl = buildOfferPublicLink(offer.id, String(offer.offer_number));

    // Skicka admin- och kundmejl via din gemensamma helper
    const payload: SendOfferParams = {
      offerId:      String(offer.id),
      offerNumber:  String(offer.offer_number),

      customerEmail: U(S(offer.customer_email)),
      customerName:  U(S(offer.contact_person)),
      customerPhone: U(S(offer.customer_phone)),

      from: U(S(offer.departure_place)),
      to:   U(S(offer.destination)),
      date: U(S(offer.departure_date)),
      time: U(S(offer.departure_time)),

      passengers: typeof offer.passengers === "number" ? offer.passengers : undefined,

      via:  U(S(offer.via)),
      stop: U(S(offer.stop)),

      return_from: U(S(offer.return_departure)),
      return_to:   U(S(offer.return_destination)),
      return_date: U(S(offer.return_date)),
      return_time: U(S(offer.return_time)),

      adminUrl,
      customerUrl,
      subject: `Offert besvarad – ${String(offer.offer_number)}`,
    };

    await sendOfferMail(payload);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[offers/[id]/send-offer] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
