// src/pages/api/offers/send-proposal.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail"; // ⟵ byt modul

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      offerId,        // UUID i tabellen offers
      offerNumber,    // t.ex. HB25007
      customerEmail,  // mottagare (kund)
      totals,         // (valfritt) summering från kalkylen
      pricing,        // (valfritt) radrader
      input,          // (valfritt) inmatade fält
    } = req.body ?? {};

    if (!offerId || !offerNumber || !customerEmail) {
      return res.status(400).json({ error: "offerId, offerNumber och customerEmail krävs" });
    }

    // Spara kalkyl och markera offerten som besvarad
    const { error: updErr } = await supabase
      .from("offers")
      .update({
        calc_totals: totals ?? null,
        calc_pricing: pricing ?? null,
        calc_input: input ?? null,
        status: "besvarad",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    if (updErr) throw updErr;

    // Skicka mejl till kund via nya objekt-signaturen
    await sendOfferMail({
      offerId: String(offerId),
      offerNumber: String(offerNumber),
      customerEmail: String(customerEmail),

      // Följande är valfria och mappar säkert om de råkar finnas i 'input'
      customerName: input?.customer_name ?? input?.contact_person ?? null,
      customerPhone: input?.customer_phone ?? input?.contact_phone ?? null,

      from: input?.departure_place ?? null,
      to: input?.destination ?? null,
      date: input?.departure_date ?? null,
      time: input?.departure_time ?? null,
      passengers:
        typeof input?.passengers === "number"
          ? input.passengers
          : Number.isFinite(Number(input?.passengers))
          ? Number(input?.passengers)
          : null,
      via: input?.via ?? null,
      onboardContact: input?.onboard_contact ?? null,

      return_from: input?.return_departure ?? null,
      return_to: input?.return_destination ?? null,
      return_date: input?.return_date ?? null,
      return_time: input?.return_time ?? null,

      notes: input?.notes ?? null,
    });

    // (valfritt) skicka notis till admin-inboxen
    const ADMIN_TO = process.env.ADMIN_ALERT_EMAIL || "offert@helsingbuss.se";
    if (ADMIN_TO) {
      await sendOfferMail({
        offerId: String(offerId),
        offerNumber: String(offerNumber),
        customerEmail: ADMIN_TO,
        customerName: "Helsingbuss Admin",
        // kort sammanfattning som textfält om du vill
        notes: totals ? `Totals: ${JSON.stringify(totals)}` : null,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("send-proposal error:", err);
    return res.status(500).json({ error: err?.message || "Serverfel" });
  }
}
