import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail";

export const config = { runtime: "nodejs" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const offerId       = String(body.offerId ?? "");
    const offerNumber   = String(body.offerNumber ?? "");
    // Tillåt båda nycklarna från klienten
    const customerEmail = String(body.customer_email ?? body.customerEmail ?? "");

    const totals  = body.totals ?? null;
    const pricing = body.pricing ?? null;
    const input   = body.input ?? null;

    if (!offerId || !offerNumber || !customerEmail) {
      return res.status(400).json({ error: "offerId, offerNumber och customer_email krävs" });
    }

    // Spara kalkyl och markera offerten som besvarad
    const { error: updErr } = await supabase
      .from("offers")
      .update({
        calc_totals: totals,
        calc_pricing: pricing,
        calc_input: input,
        status: "besvarad",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    if (updErr) throw updErr;

    // Skicka kundmejl via gemensam mailer
    await sendOfferMail({
      offerId: String(offerId),
      offerNumber: String(offerNumber),
      customer_email: customerEmail, // <— snake_case in
      // valfria fält från input
      customerName:  input?.customer_name  ?? input?.contact_person ?? null,
      customerPhone: input?.customer_phone ?? input?.contact_phone ?? null,
      from:          input?.departure_place ?? null,
      to:            input?.destination ?? null,
      date:          input?.departure_date ?? null,
      time:          input?.departure_time ?? null,
      passengers:    Number.isFinite(Number(input?.passengers)) ? Number(input.passengers) : null,
      via:           input?.via ?? null,
      onboardContact: input?.onboard_contact ?? null,
      return_from:   input?.return_departure ?? null,
      return_to:     input?.return_destination ?? null,
      return_date:   input?.return_date ?? null,
      return_time:   input?.return_time ?? null,
      notes:         input?.notes ?? null,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("send-proposal error:", err);
    return res.status(500).json({ error: err?.message || "Serverfel" });
  }
}
