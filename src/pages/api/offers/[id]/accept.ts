// src/pages/api/offers/[id]/accept.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

// Försök med flera statusvärden om du har en check-constraint
async function acceptWithFallback(offerId: string) {
  const variants = [
    { status: "godkänd", stampField: "accepted_at" as const },
    { status: "godkand", stampField: "accepted_at" as const },
    { status: "accepted", stampField: "accepted_at" as const },
    { status: "bokad", stampField: "accepted_at" as const },
    { status: "booked", stampField: "accepted_at" as const },
  ];

  const tried: string[] = [];

  for (const v of variants) {
    const payload: any = { status: v.status };
    payload[v.stampField] = new Date().toISOString();

    const { error } = await supabase
      .from("offers")
      .update(payload)
      .eq("id", offerId);

    if (!error) return v.status;

    const msg = String(error.message || "");
    tried.push(v.status);

    // Om felet inte beror på status-check, kasta direkt
    if (!/status|check/i.test(msg)) throw new Error(error.message);
  }

  throw new Error(
    `Inget av statusvärdena tillåts av offers_status_check. Testade: ${tried.join(
      ", "
    )}`
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query as { id: string };
    const { customerEmail } = req.body as { customerEmail?: string };

    const idOrNumber = String(id);

    // Hämta offert på id ELLER offer_number
    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .or(`id.eq.${idOrNumber},offer_number.eq.${idOrNumber}`)
      .maybeSingle();

    if (error) {
      console.error("/api/offers/[id]/accept fetch error:", error);
      return res.status(500).json({ error: error.message });
    }
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    const finalStatus = await acceptWithFallback(String(offer.id));

    // Välj vem som ska få kund-mail
    const to =
      (customerEmail as string | undefined) ||
      (offer.contact_email as string | undefined) ||
      (offer.customer_email as string | undefined) ||
      undefined;

    if (to) {
      const passengers =
        typeof offer.passengers === "number" ? offer.passengers : null;

      await sendOfferMail({
        offerId: String(offer.id),
        offerNumber: offer.offer_number ?? String(offer.id),
        customerEmail: to,
        customerName:
          (offer.contact_person as string | undefined) ||
          (offer.customer_name as string | undefined) ||
          undefined,
        from: (offer.departure_place as string | undefined) ?? undefined,
        to: (offer.destination as string | undefined) ?? undefined,
        date: (offer.departure_date as string | undefined) ?? undefined,
        time: (offer.departure_time as string | undefined) ?? undefined,
        passengers,
        subject: `Er offert ${
          offer.offer_number ?? ""
        } är nu ${finalStatus.toLowerCase()}`,
      });
    }

    return res.status(200).json({ ok: true, status: finalStatus });
  } catch (e: any) {
    console.error("/api/offers/[id]/accept error:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
