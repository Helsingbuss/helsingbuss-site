// src/pages/api/offert/send-offer.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { offerId } = req.body as { offerId?: string };
    if (!offerId) return res.status(400).json({ success: false, error: "Missing offerId" });

    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: "Offer not found" });
    }

    await sendOfferMail({
      offerId: String(data.id),
      offerNumber: String(data.offer_number),
      customerEmail: data.contact_email || data.customer_email,
      customerName: data.contact_person,
      customerPhone: data.contact_phone,
      from: data.departure_place,
      to: data.destination,
      date: data.departure_date,
      time: data.departure_time,
      passengers: data.passengers,
      via: data.stopover_places,
      onboardContact: null,
      return_from: data.return_departure,
      return_to: data.return_destination,
      return_date: data.return_date,
      return_time: data.return_time,
      notes: data.notes,
    });

    res.status(200).json({ success: true, message: "Email sent" });
  } catch (error: any) {
    console.error("[offert/send-offer] Email error:", error);
    res.status(500).json({ success: false, error: error?.message || "Email failed" });
  }
}
