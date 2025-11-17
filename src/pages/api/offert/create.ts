// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

// ---- helpers ----
const U = <T extends string | number | null | undefined>(v: T) =>
  (v == null ? undefined : (v as Exclude<T, null>));
const S = (v: any) => (v == null ? null : String(v).trim() || null);

type NextNoRow = { next_offer_serial?: string } | string | null;

// Försök hämta nästa offertnummer via DB-funktion
async function getNextOfferNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("next_offer_serial");
  if (error || !data) {
    throw new Error("Kunde inte generera offertnummer (saknas DB-funktion next_offer_serial).");
  }
  const v = data as NextNoRow;
  if (typeof v === "string") return v;
  if (v && typeof (v as any).next_offer_serial === "string") return (v as any).next_offer_serial;
  throw new Error("Ogiltigt svar från next_offer_serial.");
}

async function insertOffer(row: Record<string, any>) {
  // Viktigt: ingen generisk typning här → undviker GenericStringError i compile
  return supabase
    .from("offers")
    .insert(row)
    .select([
      "id",
      "offer_number",
      "contact_person",
      "customer_email",
      "customer_phone",
      "departure_place",
      "destination",
      "departure_date",
      "departure_time",
      "via",
      "stop",
      "passengers",
      "return_departure",
      "return_destination",
      "return_date",
      "return_time",
      "notes",
      "status",
    ].join(","))
    .single();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const input = (req.body || {}) as Record<string, any>;

    // Normalisera fält (tål olika namn från hemsidan/admin)
    const contact_person   = S(input.contact_person)   ?? S(input.customer_reference) ?? S(input.reference) ?? S(input.ref);
    const customer_email   = S(input.customer_email)   ?? S(input.email);
    const customer_phone   = S(input.customer_phone)   ?? S(input.phone);
    const onboard_contact  = S(input.onboard_contact)  ?? S(input.onboardContact);
    const invoice_ref      = S(input.invoice_ref)      ?? S(input.invoiceRef) ?? null;

    const departure_place  = S(input.departure_place)  ?? S(input.from);
    const destination      = S(input.destination)      ?? S(input.to);
    const departure_date   = S(input.departure_date)   ?? S(input.date);
    const departure_time   = S(input.departure_time)   ?? S(input.time);

    // ✅ nya fältnamn
    const via              = S(input.via)  ?? null;
    const stop             = S(input.stop) ?? null;

    const passengers       = typeof input.passengers === "number"
      ? input.passengers
      : Number(input.passengers || 0) || null;

    const return_departure = S(input.return_departure) ?? S(input.return_from);
    const return_destination = S(input.return_destination) ?? S(input.return_to);
    const return_date      = S(input.return_date);
    const return_time      = S(input.return_time);

    let notes: string | null = S(input.notes);
    if (onboard_contact) {
      notes = [notes || "", `Kontakt ombord: ${onboard_contact}`].filter(Boolean).join("\n");
    }

    // Minimal validering
    if (!contact_person) return res.status(400).json({ error: "Kontaktperson (contact_person) saknas" });
    if (!departure_place) return res.status(400).json({ error: "Från/Avreseplats saknas" });
    if (!destination)     return res.status(400).json({ error: "Till/Destination saknas" });
    if (!passengers || passengers < 1) return res.status(400).json({ error: "Antal passagerare måste vara minst 1" });

    // Hämta nummer och inserta – med 3 retrys vid unik-krock
    let offerNumber = "";
    let inserted: any = null;
    let lastErr: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        offerNumber = await getNextOfferNumber();

        const { data, error } = await insertOffer({
          offer_number: offerNumber,
          status: "inkommen",

          contact_person,
          customer_email,
          customer_phone,
          invoice_ref,

          departure_place,
          destination,
          departure_date,
          departure_time,

          via,   // ✅
          stop,  // ✅
          passengers,

          return_departure,
          return_destination,
          return_date,
          return_time,

          notes,
        });

        if (error) throw error;
        inserted = data;
        lastErr = null;
        break;
      } catch (e: any) {
        lastErr = e;
        // Vid unik-krock (23505) – försök igen med nytt nummer
        if (e?.code === "23505") {
          continue;
        }
        throw e;
      }
    }

    if (!inserted) {
      if (lastErr) throw lastErr;
      throw new Error("Insert misslyckades utan felmeddelande");
    }

    // ---- skicka mail (admin + ev. kund) ----
    // OBS: gör null→undefined med U() för att matcha snälla typer i sendMail
    await sendOfferMail({
      offerId: String((inserted as any).id),
      offerNumber: String((inserted as any).offer_number),

      customerEmail: U((inserted as any).customer_email),
      customerName:  U((inserted as any).contact_person),
      customerPhone: U((inserted as any).customer_phone),

      from: U((inserted as any).departure_place),
      to:   U((inserted as any).destination),
      date: U((inserted as any).departure_date),
      time: U((inserted as any).departure_time),

      via:  U((inserted as any).via),   // ✅
      stop: U((inserted as any).stop),  // ✅

      passengers: typeof (inserted as any).passengers === "number"
        ? (inserted as any).passengers
        : undefined,

      return_from: U((inserted as any).return_departure),
      return_to:   U((inserted as any).return_destination),
      return_date: U((inserted as any).return_date),
      return_time: U((inserted as any).return_time),

      notes: U((inserted as any).notes),
    });

    return res.status(200).json({ ok: true, offer: { id: (inserted as any).id, offer_number: (inserted as any).offer_number } });
  } catch (e: any) {
    // Matcha ditt tidigare felmeddelande om rpc saknas
    if (typeof e?.message === "string" && e.message.includes("next_offer_serial")) {
      return res.status(500).json({ error: "Kunde inte generera offertnummer (saknas DB-funktion next_offer_serial)." });
    }
    console.error("[offert/create] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
