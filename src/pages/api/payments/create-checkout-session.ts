// src/pages/api/payments/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import * as admin from "@/lib/supabaseAdmin";

// --- Stripe setup ---
// Försök läsa hemlig nyckel från några olika varianter
const rawStripeSecret =
  process.env.STRIPE_SECRET_KEY ||
  process.env.STRIPE_SECRET ||
  process.env.STRIPE_API_KEY ||
  "";

const stripeSecret = rawStripeSecret.trim() || undefined;

if (!stripeSecret) {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY (eller STRIPE_SECRET / STRIPE_API_KEY) är inte satt i .env – betalning kan inte fungera."
  );
}

// använd den API-version som ditt stripe-paket kräver
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2025-11-17.clover" })
  : (null as any);

// --- Supabase admin (samma pattern som i booking/init) ---
const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type CreateCheckoutResponse =
  | { ok: true; url: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCheckoutResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed (use POST)." });
  }

  if (!stripe) {
    return res.status(500).json({
      ok: false,
      error: "Betalning är inte konfigurerad (saknar Stripe-nyckel).",
    });
  }

  try {
    const { trip_id, date, quantity, ticket_id, customer } = req.body || {};

    if (!trip_id || !date || !ticket_id || !quantity || !customer?.email) {
      return res.status(400).json({
        ok: false,
        error: "Saknar nödvändig bokningsinformation för betalning.",
      });
    }

    const qty = Number(quantity) || 1;

    // --- Hämta priset från databasen ---
    const { data: priceRow, error: priceErr } = await supabase
      .from("trip_ticket_pricing")
      .select("id, price, currency, ticket_types(name)")
      .eq("id", ticket_id)
      .single();

    if (priceErr || !priceRow) {
      console.error("Stripe: kunde inte läsa prisrad", priceErr);
      return res.status(400).json({
        ok: false,
        error: "Kunde inte hitta priset för vald biljett.",
      });
    }

    const unitAmount = Math.round(Number(priceRow.price) * 100); // ören
    if (!unitAmount || unitAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Biljettens pris är ogiltigt.",
      });
    }

    const currency =
      (priceRow.currency ||
        process.env.NEXT_PUBLIC_STRIPE_CURRENCY ||
        "SEK") as string;

    const productName =
      priceRow.ticket_types?.name || "Helsingbuss – bussresa";

    const successBase =
      process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    // --- Skapa Stripe Checkout-session ---
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Apple/Google Pay via "card", plus Klarna & Link
      payment_method_types: ["card", "klarna", "link"],
      customer_email: customer.email,
      success_url: `${successBase}/betalning/klar?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/betalning/avbruten`,
      metadata: {
        trip_id: String(trip_id),
        departure_date: String(date),
        ticket_id: String(ticket_id),
        quantity: String(qty),
        customer_name: customer.name || "",
        customer_phone: customer.phone || "",
      },
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: unitAmount,
            product_data: {
              name: productName,
            },
          },
        },
      ],
    });

    if (!session.url) {
      console.error("Stripe: ingen session.url", session);
      return res.status(500).json({
        ok: false,
        error: "Kunde inte skapa betalningssession.",
      });
    }

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e: any) {
    console.error("Stripe create-checkout-session error:", e);
    return res.status(500).json({
      ok: false,
      error:
        e?.message || "Tekniskt fel uppstod när betalningen skulle startas.",
    });
  }
}
