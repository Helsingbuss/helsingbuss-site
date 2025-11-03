import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

async function declineWithFallback(offerId: string) {
  const variants = [
    { status: "makulerad", stampField: "declined_at" as const },
    { status: "avböjd", stampField: "declined_at" as const },
    { status: "avbojd", stampField: "declined_at" as const },
    { status: "declined", stampField: "declined_at" as const },
    { status: "rejected", stampField: "declined_at" as const },
    { status: "cancelled", stampField: "declined_at" as const },
    { status: "canceled", stampField: "declined_at" as const },
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

    const finalStatus = await declineWithFallback(offer.id);

    const to = customerEmail || offer.contact_email || offer.customer_email;
    if (to) await sendOfferMail(to, offer.id, "makulerad", offer.offer_number);

    return res.status(200).json({ ok: true, status: finalStatus });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
