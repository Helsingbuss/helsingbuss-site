// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail, type SendOfferParams } from "@/lib/sendMail";

function pickYmd(v?: string | null) {
  if (!v) return null;
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// Generera HB + YY + löpnummer — starta på HB25007
async function nextOfferNumber(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(2); // "25"
  const prefix = `HB${yy}`; // "HB25"

  const { data, error } = await supabase
    .from("offers")
    .select("offer_number")
    .ilike("offer_number", `${prefix}%`)
    .order("offer_number", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("[offert/create] nextOfferNumber query error:", error.message);
  }

  let max = 6; // så att första nästa blir 7  => HB25 007
  if (data && data.length) {
    for (const r of data) {
      const raw = (r as any).offer_number as string | null;
      if (!raw) continue;
      const m = raw.replace(/\s+/g, "").match(new RegExp(`^${prefix}(\\d{3,})$`, "i"));
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n)) max = Math.max(max, n);
      }
    }
  }

  const next = max + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const b = (req.body || {}) as Record<string, any>;

    // Fält från FluentForms
    const customerName     = (b.contact_person || b.customer_name || "").toString().trim();
    const customerEmail    = (b.customer_email || b.email || "").toString().trim();
    const customerPhone    = (b.customer_phone || b.phone || "").toString().trim();

    if (!customerName || !customerEmail) {
      return res.status(400).json({ ok: false, error: "Fyll i Beställare (namn) och E-post." });
    }

    const passengers       = Number(b.passengers ?? 0) || null;

    // utresa
    const departure_place  = b.departure_place ?? b.from ?? null;
    const destination      = b.destination     ?? b.to   ?? null;
    const departure_date   = pickYmd(b.departure_date ?? b.date);
    const departure_time   = b.departure_time  ?? b.time ?? null;

    // retur
    const return_departure   = b.return_departure   ?? b.return_from ?? null;
    const return_destination = b.return_destination ?? b.return_to   ?? null;
    const return_date        = pickYmd(b.return_date ?? b.ret_date);
    const return_time        = b.return_time ?? b.ret_time ?? null;

    const stopover_places  = b.stopover_places ?? b.via ?? null;
    const onboard_contact  = b.onboard_contact ?? null;
    const customer_reference = b.customer_reference ?? customerName;
    const internal_reference = b.internal_reference ?? null;
    const notes = b.notes ?? b.message ?? null;

    // Skapa offer_number
    const offer_number = await nextOfferNumber();

    // Spara i DB
    const insertPayload: any = {
      offer_number,
      status: "inkommen",
      offer_date: new Date().toISOString().slice(0, 10),

      // kontakt
      contact_person: customerName,
      contact_phone: customerPhone,
      contact_email: customerEmail,

      // referenser
      customer_reference,
      internal_reference,

      // resa
      passengers,
      departure_place,
      destination,
      departure_date,
      departure_time,
      stopover_places,

      // retur
      return_departure,
      return_destination,
      return_date,
      return_time,

      // övrigt
      notes,
    };

    const ins = await supabase.from("offers").insert(insertPayload)
      .select("*").single();

    if (ins.error) {
      console.error("[offert/create] insert error:", ins.error);
      return res.status(500).json({ ok: false, error: "Kunde inte spara offert" });
    }

    const row = ins.data!;
    // Bygg mail-objekt (både admin och kund skickas i sendOfferMail)
    const p: SendOfferParams = {
      offerId: String(row.id ?? offer_number),
      offerNumber: String(offer_number),
      customerEmail: customerEmail,

      customerName: customerName,
      customerPhone: customerPhone,

      from: departure_place,
      to: destination,
      date: departure_date,
      time: departure_time,
      passengers,
      via: stopover_places,
      onboardContact: onboard_contact,

      return_from: return_departure,
      return_to: return_destination,
      return_date,
      return_time,

      notes,
    };

    try {
      const out = await sendOfferMail(p);
      console.log("[offert/create] mail sent via:", out.provider);
    } catch (mailErr: any) {
      console.warn("[offert/create] mail failed:", mailErr?.message || mailErr);
      // vi fortsätter ändå – offerten är sparad
    }

    return res.status(200).json({ ok: true, offer: { id: row.id, offer_number } });
  } catch (e: any) {
    console.error("[offert/create] unhandled:", e?.message || e);
    return res.status(500).json({ ok: false, error: "Serverfel" });
  }
}
