// src/pages/api/offers/send-proposal.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import { sendOfferMail } from "@/lib/sendMail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { offerNumber, customerEmail, totals, pricing, input } = req.body || {};
    if (!offerNumber || !customerEmail) {
      return res.status(400).json({ error: "offerNumber och customerEmail krävs" });
    }

    // (Valfritt) uppdatera status till "besvarad" när prisförslag skickas
    const { error: upErr } = await supabase
      .from("offers")
      .update({ status: "besvarad" })
      .eq("offer_number", offerNumber);

    if (upErr) {
      console.error("Supabase update error:", upErr);
      // Vi fortsätter ändå med mail – status kan justeras i efterhand
    }

    // Använd din befintliga mailfunktion med en “prisförslag”-etikett
    await sendOfferMail(customerEmail, offerNumber, "prisforslag", {
      totals,
      pricing,
      input,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("send-proposal error:", e);
    return res.status(500).json({ error: e?.message || "Kunde inte skicka prisförslaget" });
  }
}
