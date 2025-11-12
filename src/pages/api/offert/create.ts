// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import sendOfferMail, { SendOfferParams } from "@/lib/sendMail";
import { nextOfferNumberHB3 } from "@/lib/offerNumber";

function pickYmd(v?: string | null) {
  if (!v) return null;
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const b = (req.body || {}) as Record<string, any>;

    // Fältmappning (kompatibel med Fluent Forms)
    const customer_reference = (b.contact_person || b.customer_name || "").toString().trim();
    const contact_email      = (b.customer_email  || b.email         || "").toString().trim();
    const contact_phone      = (b.customer_phone  || b.phone         || "").toString().trim();

    if (!customer_reference || !contact_email || !contact_phone) {
      return res.status(400).json({
        ok: false,
        error: "Fyll i Referens (beställarens namn), E-post och Telefon.",
      });
    }

    const passengers = Number(b.passengers ?? 0) || null;

    // utresa
    const departure_place = b.departure_place ?? b.from ?? null;
    const destination     = b.destination     ?? b.to   ?? null;
    const departure_date  = pickYmd(b.departure_date ?? b.date);
    const departure_time  = b.departure_time ?? b.time ?? null;

    // retur
    const return_departure   = b.return_departure   ?? b.return_from ?? null;
    const return_destination = b.return_destination ?? b.return_to   ?? null;
    const return_date        = pickYmd(b.return_date ?? b.ret_date);
    const return_time        = b.return_time ?? b.ret_time ?? null;

    const via   = b.stopover_places ?? b.via ?? null;
    const notes = b.notes ?? b.message ?? null;

    // === Offertnummer (HB{YY}{NNN}, första = HB25007) ===
    const offer_number = await nextOfferNumberHB3(supabase);
    const status = "inkommen";

    // DB-insert
    const rowToInsert = {
      offer_number,
      status,
      customer_reference,
      contact_email,
      contact_phone,
      passengers,
      departure_place,
      destination,
      departure_date,
      departure_time,
      return_departure,
      return_destination,
      return_date,
      return_time,
      notes,
      // ev. created_at/updated_at triggas i DB med default now()
    };

    const ins = await supabase
      .from("offers")
      .insert(rowToInsert)
      .select("id, offer_number, contact_email, customer_email")
      .single();

    if (ins.error) {
      console.error("[offert/create] insert error:", ins.error);
      return res.status(500).json({ ok: false, error: ins.error.message });
    }

    const saved = ins.data!;
    const recipient = saved.contact_email || saved.customer_email || contact_email;

    // 3) Skicka bekräftelsemail (kunden + admin)
    try {
      const mailParams: SendOfferParams = {
        offerId: String(saved.id ?? offer_number),
        offerNumber: String(saved.offer_number || offer_number),
        customerEmail: recipient,

        customerName: customer_reference,
        customerPhone: contact_phone,

        from: departure_place,
        to: destination,
        date: departure_date,
        time: departure_time,
        passengers,
        via,
        onboardContact: null,

        return_from: return_departure,
        return_to: return_destination,
        return_date,
        return_time,

        notes,
      };

      await sendOfferMail(mailParams);
    } catch (e: any) {
      console.warn("[offert/create] e-post misslyckades:", e?.message || e);
      // Vi låter offertskapandet lyckas även om e-post fallerar
    }

    return res.status(200).json({ ok: true, offer: saved });
  } catch (e: any) {
    console.error("[offert/create] server error:", e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || "Internt fel" });
  }
}
