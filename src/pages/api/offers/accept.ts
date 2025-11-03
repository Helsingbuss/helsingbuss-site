import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";
import { Resend } from "resend";

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

const BASE =
  (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "") || "http://localhost:3000";
const ADMIN_TO = process.env.MAIL_ADMIN || "offert@helsingbuss.se";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function updateStatusWithFallback(offerId: string) {
  const variants = [
    { status: "godkand", stampField: "accepted_at" as const },
    { status: "godkänd", stampField: "accepted_at" as const },
    { status: "accepted", stampField: "accepted_at" as const },
    { status: "approved", stampField: "accepted_at" as const },
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
    if (!/status|check/i.test(msg)) throw new Error(error.message);
  }
  throw new Error(
    `Inget av statusvärdena tillåts av offers_status_check. Testade: ${tried.join(", ")}`
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { offerNumber, customerEmail } = req.body as {
      offerNumber?: string;
      customerEmail?: string;
    };
    if (!offerNumber) return res.status(400).json({ error: "offerNumber is required" });

    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .eq("offer_number", offerNumber)
      .single();
    if (error || !offer) return res.status(404).json({ error: "Offer not found" });

    const finalStatus = await updateStatusWithFallback(offer.id);

    const to = customerEmail || offer.contact_email || offer.customer_email;
    if (to) await sendOfferMail(to, offer.id, "godkand", offer.offer_number);

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
