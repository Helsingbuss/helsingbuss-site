// src/pages/api/offers/[id]/accept.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { buildAdminOfferLink, buildOfferPublicLink } from "@/lib/offerToken";

type OfferRow = {
  id: string;
  offer_number: string | null;
  status: string | null;
  contact_person: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  departure_place: string | null;
  destination: string | null;
  departure_date: string | null;
  departure_time: string | null;
  passengers: number | null;

  // nya namn enligt din lista
  via: string | null;
  stop: string | null;

  return_departure: string | null;
  return_destination: string | null;
  return_date: string | null;
  return_time: string | null;

  notes: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "Saknar offert-id" });

    // Hämta offerten
    const { data, error } = await supabase
      .from("offers")
      .select(
        [
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
          "passengers",
          "via",
          "stop",
          "return_departure",
          "return_destination",
          "return_date",
          "return_time",
          "notes",
        ].join(",")
      )
      .eq("id", id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Offerten hittades inte" });

    // TS med Supabase kan ge typen GenericStringError. Casta via unknown → OfferRow.
    if (typeof data !== "object" || (data as any) === null) {
      return res.status(500).json({ error: "Oväntat svar från databasen" });
    }
    if ((data as any).error === true) {
      return res.status(500).json({ error: "Dataparsning misslyckades (GenericStringError)" });
    }
    const offer = data as unknown as OfferRow;

    // Sätt status "accepterad" om inte redan
    const current = String(offer.status || "").toLowerCase();
    if (current !== "accepterad") {
      const { error: uerr } = await supabase
        .from("offers")
        .update({ status: "accepterad" })
        .eq("id", id);
      if (uerr) return res.status(500).json({ error: uerr.message });
    }

    const offerNumber = String(offer.offer_number || "—");
    const adminLink   = buildAdminOfferLink(offer.id, offerNumber);
    const customerLink= buildOfferPublicLink(offer.id, offerNumber);

    // Här kan vi trigga mail “godkänd” när builden är grön (lämnas avstängt för att undvika nya fel just nu)

    return res.status(200).json({
      ok: true,
      offer_id: offer.id,
      offer_number: offerNumber,
      status: "accepterad",
      adminLink,
      customerLink,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
