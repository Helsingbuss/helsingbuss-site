import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail";
import { Resend } from "resend";

export const config = { runtime: "nodejs" };

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

const OFFERS_INBOX = process.env.OFFERS_INBOX || "";
const ADMIN_ALERT  = process.env.ADMIN_ALERT_EMAIL || "";
const FROM_PRIMARY = process.env.MAIL_FROM || "Helsingbuss <info@helsingbuss.se>";
const FROM_FALLBACK = "Helsingbuss <onboarding@resend.dev>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "";

const BASE =
  (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_LOGIN_BASE_URL || "")
    .replace(/\/$/, "") || "http://localhost:3000";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function pickAdminTo() {
  // Prioritera ALLTID offert-inbox
  return OFFERS_INBOX || ADMIN_ALERT || "";
}

function fromFor(to: string) {
  return /@helsingbuss\.se$/i.test(to) ? FROM_FALLBACK : FROM_PRIMARY;
}

/** Prova flera statusvärden tills ett går igenom CHECK-constrainten */
async function updateStatusWithFallback(offerId: string) {
  const variants = [
    { status: "godkand",   stampField: "accepted_at" as const },
    { status: "godkänd",   stampField: "accepted_at" as const },
    { status: "accepted",  stampField: "accepted_at" as const },
    { status: "approved",  stampField: "accepted_at" as const },
    { status: "bekräftad", stampField: "accepted_at" as const },
    { status: "bekraftad", stampField: "accepted_at" as const },
    { status: "booked",    stampField: "accepted_at" as const },
  ];

  const tried: string[] = [];
  for (const v of variants) {
    const payload: any = { status: v.status };
    payload[v.stampField] = new Date().toISOString();

    const { error } = await supabase.from("offers").update(payload).eq("id", offerId);
    if (!error) return v.status;

    const msg = String(error.message || "");
    tried.push(v.status);
    if (!/status|check/i.test(msg)) throw new Error(error.message);
  }
  throw new Error(`Inget av statusvärdena tillåts av offers_status_check. Testade: ${tried.join(", ")}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const q = req.query as { id?: string };
    const b = (req.body ?? {}) as { offerId?: string; customerEmail?: string };

    const id = q.id || b.offerId;
    if (!id) return res.status(400).json({ error: "Missing offer id" });

    const { data: offer, error } = await supabase.from("offers").select("*").eq("id", id).single();
    if (error || !offer) return res.status(404).json({ error: "Offer not found" });

    const finalStatus = await updateStatusWithFallback(offer.id);

    // Kund
    const to =
      b.customerEmail ||
      (offer as any).customer_email ||
      (offer as any).contact_email ||
      null;

    if (to) {
      await sendOfferMail({
        offerId: String(offer.id ?? offer.offer_number),
        offerNumber: String(offer.offer_number ?? offer.id),
        customerEmail: to,
        customerName: (offer as any).contact_person ?? null,
        customerPhone: (offer as any).customer_phone ?? (offer as any).contact_phone ?? null,
        from: (offer as any).departure_place ?? null,
        to: (offer as any).destination ?? null,
        date: (offer as any).departure_date ?? null,
        time: (offer as any).departure_time ?? null,
        passengers: typeof (offer as any).passengers === "number" ? (offer as any).passengers : null,
        return_from: (offer as any).return_departure ?? null,
        return_to: (offer as any).return_destination ?? null,
        return_date: (offer as any).return_date ?? null,
        return_time: (offer as any).return_time ?? null,
        notes: (offer as any).notes ?? null,
      });
    }

    // Admin-notis → OFFERS_INBOX (med fallback-from för intern adress)
    const adminTo = pickAdminTo();
    if (resend && adminTo) {
      await resend.emails.send({
        from: fromFor(adminTo),
        to: adminTo,
        ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
        subject: `✅ Offert godkänd (${offer.offer_number || offer.id})`,
        html: `
          <p>En offert har godkänts av kund.</p>
          <p><strong>Offert:</strong> ${offer.offer_number || offer.id}</p>
          <p><strong>Status i DB:</strong> ${finalStatus}</p>
          <p><a href="${BASE}/admin/offers/${offer.id}">Öppna offert i Admin</a></p>
          <p><a href="${BASE}/admin/bookings/new?fromOffer=${offer.id}">Skapa bokning från offerten</a></p>
        `,
        text: [
          `En offert har godkänts av kund.`,
          `Offert: ${offer.offer_number || offer.id}`,
          `Status i DB: ${finalStatus}`,
          `${BASE}/admin/offers/${offer.id}`,
          `${BASE}/admin/bookings/new?fromOffer=${offer.id}`,
        ].join("\n"),
      } as any);
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
