// src/pages/api/offers/accept.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail"; // ✅ ny modul/signatur
import { Resend } from "resend";

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

const BASE =
  (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "") || "http://localhost:3000";
const ADMIN_TO = process.env.MAIL_ADMIN || "offert@helsingbuss.se";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** Prova flera statusvärden tills ett går igenom CHECK-constrainten */
async function updateStatusWithFallback(offerId: string) {
  const variants = [
    // primärt svenska
    { status: "godkand", stampField: "accepted_at" as const },
    { status: "godkänd", stampField: "accepted_at" as const },
    // engelska varianter
    { status: "accepted", stampField: "accepted_at" as const },
    { status: "approved", stampField: "accepted_at" as const },
    // andra vanliga
    { status: "bekräftad", stampField: "accepted_at" as const },
    { status: "bekraftad", stampField: "accepted_at" as const },
    { status: "booked", stampField: "accepted_at" as const },
  ];

  const tried: string[] = [];
  for (const v of variants) {
    const payload: any = { status: v.status };
    payload[v.stampField] = new Date().toISOString();

    const { error } = await supabase.from("offers").update(payload).eq("id", offerId);
    if (!error) return v.status;

    const msg = String(error.message || "");
    tried.push(v.status);

    // Om felet INTE handlar om status-checken, kasta direkt
    if (!/status|check/i.test(msg)) {
      throw new Error(error.message);
    }
  }
  throw new Error(
    `Inget av statusvärdena tillåts av offers_status_check. Testade: ${tried.join(", ")}`
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Stöd både query (?id=) och body ({ offerId })
    const q = req.query as { id?: string };
    const b = (req.body ?? {}) as { offerId?: string; customerEmail?: string };

    const id = q.id || b.offerId;
    if (!id) return res.status(400).json({ error: "Missing offer id" });

    // 1) Hämta offert
    const { data: offer, error } = await supabase.from("offers").select("*").eq("id", id).single();
    if (error || !offer) return res.status(404).json({ error: "Offer not found" });

    // 2) Uppdatera status med fallback
    const finalStatus = await updateStatusWithFallback(offer.id);

    // 3) Kundmail (objekt‐signatur)
    const to =
      b.customerEmail ||
      (offer as any).contact_email || // om fältet råkar finnas
      (offer as any).customer_email || // fallback om du senare sparar detta
      null;

    if (to) {
      await sendOfferMail({
        offerId: String(offer.id ?? offer.offer_number),
        offerNumber: String(offer.offer_number ?? offer.id),
        customerEmail: to,

        // valfria, för trevligare mail
        customerName: (offer as any).contact_person ?? null,
        customerPhone: (offer as any).contact_phone ?? null,

        // primär sträcka
        from: (offer as any).departure_place ?? null,
        to: (offer as any).destination ?? null,
        date: (offer as any).departure_date ?? null,
        time: (offer as any).departure_time ?? null,
        passengers:
          typeof (offer as any).passengers === "number" ? (offer as any).passengers : null,

        // retur om finns
        return_from: (offer as any).return_departure ?? null,
        return_to: (offer as any).return_destination ?? null,
        return_date: (offer as any).return_date ?? null,
        return_time: (offer as any).return_time ?? null,

        // övrigt
        notes: (offer as any).notes ?? null,
      });
    }

    // 4) Admin-notis (frivilligt)
    if (resend) {
      await resend.emails.send({
        from: process.env.MAIL_FROM || "Helsingbuss <info@helsingbuss.se>",
        to: ADMIN_TO,
        subject: `✅ Offert godkänd (${offer.offer_number || offer.id})`,
        html: `
          <p>En offert har godkänts av kund.</p>
          <p><strong>Offert:</strong> ${offer.offer_number || offer.id}</p>
          <p><strong>Status i DB:</strong> ${finalStatus}</p>
          <p><a href="${BASE}/admin/offers/${offer.id}">Öppna offert i Admin</a></p>
          <p><a href="${BASE}/admin/bookings/new?fromOffer=${offer.id}">Skapa bokning från offerten</a></p>
        `,
      });
    }

    return res.status(200).json({
      ok: true,
      nextUrl: `${BASE}/admin/bookings/new?fromOffer=${offer.id}`,
      status: finalStatus,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
