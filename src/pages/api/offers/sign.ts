// src/pages/api/offers/sign.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { signOfferToken } from "@/lib/offerToken";

/** Hämta bas-URL för kunddomänen */
function customerBase(req: NextApiRequest): string {
  const envBase =
    process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  const host = req.headers.host || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { offer_id, ttl } = req.query;

  if (!offer_id) {
    return res.status(400).json({ ok: false, error: "Missing offer_id" });
  }

  // TTL i minuter (default 30 dagar)
  let expMinutes = 60 * 24 * 30;
  if (typeof ttl === "string" && /^\d+$/.test(ttl)) {
    expMinutes = parseInt(ttl, 10);
  }

  const idOrNumber = String(offer_id).trim();
  const isOfferNumber = /^HB\d+/i.test(idOrNumber);

  // Slå upp offerten så vi kan bygga URL med HB-nummer
  const { data: offer, error } = await supabase
    .from("offers")
    .select("id, offer_number")
    .limit(1)
    .match(isOfferNumber ? { offer_number: idOrNumber } : { id: idOrNumber })
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
  if (!offer) {
    return res.status(404).json({ ok: false, error: "Offer not found" });
  }

  const offerId = String(offer.id);
  const offerNumber = String(offer.offer_number);

  const token = signOfferToken(
    { offerId, offerNumber },
    { expiresInSec: expMinutes * 60 }
  );

  const BASE = customerBase(req);

  // ✅ Path = HBxxxxx
  // ✅ token + t (bakåtkompatibilitet)
  const url = `${BASE}/offert/${encodeURIComponent(
    offerNumber
  )}?token=${encodeURIComponent(token)}&t=${encodeURIComponent(token)}`;

  return res.status(200).json({ ok: true, url, token, offerNumber });
}
