// src/pages/api/payments/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import * as admin from "@/lib/supabaseAdmin";

type ApiResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Enda som verkligen krävs för Stripe Checkout är hemliga nyckeln
let stripe: Stripe | null = null;
if (stripeSecret) {
  stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
  });
}

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed (use POST)." });
  }

  if (!stripeSecret || !stripe) {
    console.error("Stripe secret key saknas", {
      hasSecret: !!stripeSecret,
    });
    return res.status(500).json({
      ok: false,
      error: "Betalning är inte konfigurerad (saknar Stripe-nyckel).",
    });
  }

  try {
    const { trip_id, date, quantity, ticket_id, customer } = req.body || {};

    if (!trip_id || !date || !ticket_id || !quantity) {
      return res.status(400).json({
        ok: false,
        error: "Saknar uppgifter för betalning.",
      });
    }

    // Hämta korrekt biljettpris från databasen (litar inte på klienten)
    const { data: priceRow, error: priceErr } = await supabase
      .from("trip_ticket_pricing")
      .select(
        "id, trip_id, ticket_type_id, price, currency, ticket_types(name)"
      )
      .eq("id", ticket_id)
      .eq("trip_id", trip_id)
      .single();

    if (priceErr || !priceRow) {
      console.error("create-checkout-session priceErr", priceErr);
      return res
        .status(404)
        .json({ ok: false, error: "Kunde inte hitta biljettpris." });
    }

    const quantityInt = Math.max(
      1,
      parseInt(String(quantity), 10) || 1
    );

    const currency: string =
      priceRow.currency ||
      process.env.NEXT_PUBLIC_STRIPE_CURRENCY ||
      "SEK";

    const lineItemName =
      priceRow.ticket_types?.name || "Bussbiljett – Helsingbuss";

    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const successUrl = `${baseUrl}/tack?status=success`;
    const cancelUrl = `${baseUrl}/kassa/avbruten`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna", "link"],
      customer_email: customer?.email || undefined,
      metadata: {
        trip_id: String(trip_id),
        departure_date: String(date),
        ticket_pricing_id: String(priceRow.id),
        quantity: String(quantityInt),
      },
      line_items: [
        {
          quantity: quantityInt,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(Number(priceRow.price) * 100),
            product_data: {
              name: lineItemName,
              description: `Resa med Helsingbuss – ${date}`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({
      ok: true,
      url: session.url || undefined,
    });
  } catch (error: any) {
    console.error("create-checkout-session error", error);
    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Tekniskt fel vid skapande av betalning. Försök igen.",
    });
  }
}
