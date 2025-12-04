// src/pages/api/payments/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY saknas i .env.local");
}

// Låt Stripe välja sin default-version – enklast, slipper typfel
const stripe = new Stripe(stripeSecret as string);

type CreateCheckoutResponse =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

type CreateCheckoutBody = {
  trip_id: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  ticket_id: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCheckoutResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed (use POST).",
    });
  }

  let body: CreateCheckoutBody;
  try {
    body = req.body as CreateCheckoutBody;
  } catch {
    return res.status(400).json({
      ok: false,
      error: "Ogiltig JSON i body.",
    });
  }

  const { trip_id, date, quantity, ticket_id, customer } = body;

  if (!trip_id || !date || !quantity || !ticket_id) {
    return res.status(400).json({
      ok: false,
      error: "Saknar nödvändig information (trip_id, date, quantity, ticket_id).",
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({
      ok: false,
      error: "Antalet biljetter måste vara minst 1.",
    });
  }

  try {
    // --- 1) Hämta biljetten från databasen (så vi inte litar på pris från frontend) ---
    const { data: priceRow, error: priceErr } = await supabase
      .from("trip_ticket_pricing")
      .select(
        "id, trip_id, ticket_type_id, price, currency, ticket_types(name, code)"
      )
      .eq("id", ticket_id)
      .eq("trip_id", trip_id)
      .single();

    if (priceErr || !priceRow) {
      console.error("create-checkout-session priceErr", priceErr);
      return res.status(404).json({
        ok: false,
        error: "Kunde inte hitta pris för vald biljett.",
      });
    }

    const unitAmount = Math.round(Number(priceRow.price) * 100); // ören
    const currency =
      (priceRow.currency as string | null) ||
      process.env.NEXT_PUBLIC_STRIPE_CURRENCY ||
      "SEK";

    const ticketName =
      priceRow.ticket_types?.name || "Helsingbuss – biljett";

    // --- 2) Sätt upp URL:er för success/cancel ---
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const successUrl = `${baseUrl}/kassa/klart?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/kassa/avbruten`;

    // --- 3) Skapa Stripe Checkout-session ---
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna", "link"], // Apple/Google Pay ingår i "card"
      line_items: [
        {
          quantity,
          price_data: {
            unit_amount: unitAmount,
            currency: currency.toLowerCase(), // t.ex. "sek"
            product_data: {
              name: ticketName,
              metadata: {
                trip_id,
                ticket_id: String(ticket_id),
              },
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customer?.email,
      metadata: {
        trip_id,
        departure_date: date,
        ticket_id: String(ticket_id),
        quantity: String(quantity),
        customer_name: customer?.name || "",
        customer_phone: customer?.phone || "",
        source: "helsingbuss-portal",
      },
    });

    if (!session.url) {
      return res.status(500).json({
        ok: false,
        error: "Stripe returnerade ingen URL för betalning.",
      });
    }

    return res.status(200).json({
      ok: true,
      url: session.url,
    });
  } catch (e: any) {
    console.error("create-checkout-session error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel vid skapande av betalning.",
    });
  }
}
