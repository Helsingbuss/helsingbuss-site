// src/pages/api/offers/send-proposal.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

// Hjälpare: null/undefined -> undefined (för mailparametrar)
const U = <T extends string | number | null | undefined>(v: T) =>
  v == null ? undefined : (v as Exclude<T, null>);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const input = (req.body || {}) as {
      offer_id?: string;
      offerNumber?: string;
      via?: string | null;
      stop?: string | null;
      notes?: string | null;
      onboard_contact?: string | null;
      return_departure?: string | null;
      return_destination?: string | null;
      return_date?: string | null;
      return_time?: string | null;
    };

    // Viktigt: vi accepterar både UUID (id) och offertnummer (HB25XXX)
    const idOrNumber = String(
      input.offer_id ?? input.offerNumber ?? req.query.id ?? ""
    );

    if (!idOrNumber || idOrNumber === "undefined") {
      return res.status(400).json({ error: "Saknar offert-id/nummer" });
    }

    // Hämta offerten – matcha på både id och offer_number
    const { data: offer, error } = await supabase
      .from("offers")
      .select(
        `
        id,
        offer_number,
        status,
        contact_person,
        contact_email,
        customer_email,
        customer_phone,
        departure_place,
        destination,
        departure_date,
        departure_time,
        via,
        stop,
        passengers,
        return_departure,
        return_destination,
        return_date,
        return_time,
        notes,
        amount_ex_vat,
        vat_amount,
        total_amount,
        vat_breakdown
      `
      )
      .or(`id.eq.${idOrNumber},offer_number.eq.${idOrNumber}`)
      .maybeSingle();

    if (error) {
      console.error("[send-proposal] fetch error:", error);
      return res.status(500).json({ error: error.message });
    }
    if (!offer) {
      return res.status(404).json({ error: "Offert hittades inte" });
    }

    // Sätt status "besvarad" om inte redan – priset (amount_* / vat_breakdown)
    // är redan uppdaterat av /api/offers/[id]/quote
    const current = String(offer.status ?? "").toLowerCase();
    if (current !== "besvarad") {
      const { error: uerr } = await supabase
        .from("offers")
        .update({
          status: "besvarad",
          // rör inte totals här – de sätts i /quote
          updated_at: new Date().toISOString(),
        })
        .eq("id", offer.id);

      if (uerr) {
        console.error("[send-proposal] status update error:", uerr);
        return res.status(500).json({ error: uerr.message });
      }
    }

    // Bygg notes där vi klistrar in "Kontakt ombord" + ev. telefonnummer
    let outNotes = input.notes ?? offer.notes ?? null;
    const extras: string[] = [];

    if (input.onboard_contact && String(input.onboard_contact).trim() !== "") {
      extras.push(`Kontakt ombord: ${input.onboard_contact}`);
    }
    if (offer.customer_phone && String(offer.customer_phone).trim() !== "") {
      extras.push(`Telefon: ${offer.customer_phone}`);
    }

    if (extras.length) {
      outNotes = [outNotes?.toString().trim() || "", ...extras]
        .filter(Boolean)
        .join("\n");
    }

    // Tillåt att via/stop/retur-fält kan matas in i POST:en för att mailas korrekt
    const viaOut = input.via ?? offer.via ?? null;
    const stopOut = input.stop ?? offer.stop ?? null;

    const retFrom = input.return_departure ?? offer.return_departure ?? null;
    const retTo = input.return_destination ?? offer.return_destination ?? null;
    const retDate = input.return_date ?? offer.return_date ?? null;
    const retTime = input.return_time ?? offer.return_time ?? null;

    // Bygg mailadress: contact_email -> customer_email
    const customerEmail: string | undefined =
      U(offer.contact_email) ?? U(offer.customer_email);

    // Skicka mail till kund om prisförslag
    await sendOfferMail({
      offerId: String(offer.id),
      offerNumber: String(offer.offer_number ?? idOrNumber),

      customerEmail,
      customerName: U(offer.contact_person),

      from: U(offer.departure_place),
      to: U(offer.destination),
      date: U(offer.departure_date),
      time: U(offer.departure_time),
      via: U(viaOut),
      stop: U(stopOut),
      passengers:
        typeof offer.passengers === "number" ? offer.passengers : undefined,

      return_from: U(retFrom),
      return_to: U(retTo),
      return_date: U(retDate),
      return_time: U(retTime),

      notes: U(outNotes),

      // extra: tydlig subject för kunden
      subject: `Offert ${offer.offer_number} – prisförslag från Helsingbuss`,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[offers/send-proposal] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
