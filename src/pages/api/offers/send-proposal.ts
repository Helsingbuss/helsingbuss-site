// src/pages/api/offers/send-proposal.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail";

export const config = { runtime: "nodejs" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      offerId,        // UUID i tabellen offers
      offerNumber,    // t.ex. HB25007
      customerEmail,  // mottagare (kund) — CAMEL CASE!
      totals,         // (valfritt) summering från kalkylen
      pricing,        // (valfritt) radrader
      input,          // (valfritt) inmatade fält
    } = (req.body ?? {}) as {
      offerId: string;
      offerNumber: string;
      customerEmail?: string;
      totals?: any;
      pricing?: any;
      input?: any;
    };

    if (!offerId || !offerNumber) {
      return res.status(400).json({ error: "offerId och offerNumber krävs" });
    }

    // Spara kalkyl och markera ev. skickad
    const { mode, breakdown } = (req.body ?? {}) as {
      mode?: "draft" | "send";
      breakdown?: {
        grandExVat: number;
        grandVat: number;
        grandTotal: number;
        serviceFeeExVat: number;
        legs: { subtotExVat: number; vat: number; total: number }[];
      };
    };

    const patch: any = {
      amount_ex_vat: breakdown?.grandExVat ?? null,
      vat_amount: breakdown?.grandVat ?? null,
      total_amount: breakdown?.grandTotal ?? null,
      calc_json: input ?? null,
      vat_breakdown: breakdown ?? null,
      calc_totals: totals ?? null,
      calc_pricing: pricing ?? null,
      updated_at: new Date().toISOString(),
    };

    if (mode === "send") {
      patch.status = "besvarad";
      patch.sent_at = new Date().toISOString();
    }

    const { error: updErr } = await supabase.from("offers").update(patch).eq("id", offerId);
    if (updErr) throw updErr;

    // Skicka mejl till kund ENDAST i "send"-läge
    if (mode === "send") {
      // 1) Hämta kundens e-post från DB om den inte skickades i body
      let to = (customerEmail || "").trim();
      if (!to) {
        const { data: offerRow } = await supabase
          .from("offers")
          .select("customer_email, contact_email")
          .eq("id", offerId)
          .single();
        to = (offerRow?.customer_email || offerRow?.contact_email || "").trim();
      }

      // 2) Skicka med korrekt fältnamn: customerEmail (camelCase)
      if (to && /\S+@\S+\.\S+/.test(to)) {
        try {
          await sendOfferMail({
            offerId: String(offerId),
            offerNumber: String(offerNumber),
            customerEmail: String(to), // ✅ RÄTT NAMN
            // valfritt – skicka gärna med sammanfattning från input om du vill
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
        } catch (mailErr) {
          console.error("sendOfferMail failed:", mailErr);
          // fortsätter ändå – DB är uppdaterad
        }
      } else {
        console.warn("[send-proposal] Ingen giltig kundadress hittades.");
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("send-proposal error:", err);
    return res.status(500).json({ error: err?.message || "Serverfel" });
  }
}
