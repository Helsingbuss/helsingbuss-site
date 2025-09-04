// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";
import { sendOfferMail } from "@/lib/sendMail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      // 🔹 Basinfo
      customer_name,
      customer_email,
      customer_phone,
      passengers,
      departure_place,
      destination,
      departure_date,
      departure_time,
      notes,

      // 🔹 Checkbox: "Jag vill…"
      options, // ["tur-retur", "stopover", "use-on-site"]

      // 🔹 Tur & Retur
      return_departure,
      return_destination,
      return_date,
      return_time,

      // 🔹 Mellanstopp
      stopover_places,

      // 🔹 Använda bussen på plats
      plans_description,
      final_destination,
      end_date,
      end_time,

      // 🔹 Kundtyp
      customer_type, // privatperson | foretag | forening

      // 🔹 Företag/Förening
      company,
      association,
      org_number,
      invoice_ref,

      // 🔹 Kontaktperson
      contact_person,
    } = req.body;

    // Skapa offertnummer (enkelt auto-ID)
    const offerNumber = `HB${Date.now().toString().slice(-5)}`;

    // Lägg in i Supabase
    const { data, error } = await supabase
      .from("offers")
      .insert([
        {
          offer_number: offerNumber,

          // 🔹 Bas
          customer_name,
          contact_email: customer_email,
          contact_phone: customer_phone,
          passengers,
          departure_place,
          destination,
          departure_date,
          departure_time,
          notes,

          // 🔹 Options
          options,

          // 🔹 Tur & retur
          return_departure,
          return_destination,
          return_date,
          return_time,

          // 🔹 Mellanstopp
          stopover_places,

          // 🔹 Använda bussen på plats
          plans_description,
          final_destination,
          end_date,
          end_time,

          // 🔹 Kundtyp
          customer_type,

          // 🔹 Företag/Förening
          company,
          association,
          org_number,
          invoice_ref,

          // 🔹 Kontaktperson
          contact_person,

          // Status
          status: "inkommen",
        },
      ])
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Skicka bekräftelsemail
    await sendOfferMail(customer_email, offerNumber, "inkommen");

    // Returnera JSON
    return res.status(200).json({
      success: true,
      offerId: offerNumber,
      offer: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Något gick fel" });
  }
}
