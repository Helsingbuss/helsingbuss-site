import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

// Fungerar både där du exporterar som supabaseAdmin eller default
const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type JsonError = { error: string };

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s || ""
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | JsonError>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      // identifierare
      offerId,
      offerNumber,

      // ev. tilldelningar från admin
      assigned_vehicle_id,
      assigned_driver_id,

      // möjlighet att override’a noteringar
      notes,
    } = (req.body ?? {}) as Record<string, any>;

    if (!offerId && !offerNumber) {
      return res
        .status(400)
        .json({ error: "Du måste ange offerId eller offerNumber" });
    }

    // ----- 1) HÄMTA OFFERT -----
    const selectCols = [
      "id",
      "offer_number",
      "status",
      "customer_reference",
      "contact_email",
      "contact_phone",
      "passengers",
      "notes",

      // utresa
      "departure_place",
      "destination",
      "departure_date",
      "departure_time",
      "end_time",
      "on_site_minutes",
      "stopover_places",

      // retur
      "return_departure",
      "return_destination",
      "return_date",
      "return_time",
      "return_end_time",
      "return_on_site_minutes",
    ].join(",");

    let off: any = null;
    if (offerId) {
      const { data, error } = await supabase
        .from("offers")
        .select(selectCols)
        .eq(isUUID(String(offerId)) ? "id" : "offer_number", offerId)
        .single();
      if (error) throw error;
      off = data;
    } else if (offerNumber) {
      const { data, error } = await supabase
        .from("offers")
        .select(selectCols)
        .eq("offer_number", offerNumber)
        .single();
      if (error) throw error;
      off = data;
    }

    if (!off) {
      return res.status(404).json({ error: "Offert hittades inte" });
    }

    // ----- 2) BYGG BOOKING-PAYLOAD -----
    // Alla fält defensivt defaultade till null/””
    const payload = {
      // Kund
      contact_person: (off.customer_reference ?? "").toString() || null,
      customer_email: (off.contact_email ?? "").toString() || null,
      customer_phone: (off.contact_phone ?? "").toString() || null,

      // Utresa
      passengers: Number(off.passengers ?? 0) || 0,
      departure_place: off.departure_place ?? null,
      destination: off.destination ?? null,
      departure_date: off.departure_date ?? null,
      departure_time: off.departure_time ?? null,
      end_time: off.end_time ?? null,
      on_site_minutes:
        off.on_site_minutes === null || off.on_site_minutes === undefined
          ? null
          : Number(off.on_site_minutes),
      stopover_places: off.stopover_places ?? null,

      // Retur
      return_departure: off.return_departure ?? null,
      return_destination: off.return_destination ?? null,
      return_date: off.return_date ?? null,
      return_time: off.return_time ?? null,
      return_end_time: off.return_end_time ?? null,
      return_on_site_minutes:
        off.return_on_site_minutes === null ||
        off.return_on_site_minutes === undefined
          ? null
          : Number(off.return_on_site_minutes),

      // Tilldelningar (valfria)
      assigned_vehicle_id: assigned_vehicle_id ?? null,
      assigned_driver_id: assigned_driver_id ?? null,

      // Övrigt
      notes: (notes ?? off.notes ?? null) as string | null,

      // Knyt tillbaka till offerten om du har sådan kolumn i DB
      offer_id: off.id ?? null,
      offer_number: off.offer_number ?? null,
    } as Record<string, any>;

    // ----- 3) SKAPA BOKNING -----
    const { data: created, error: insErr } = await supabase
      .from("bookings")
      .insert(payload)
      .select(
        [
          "id",
          "booking_number",
          "contact_person",
          "customer_email",
          "customer_phone",
          "passengers",
          "departure_place",
          "destination",
          "departure_date",
          "departure_time",
          "end_time",
          "on_site_minutes",
          "stopover_places",
          "return_departure",
          "return_destination",
          "return_date",
          "return_time",
          "return_end_time",
          "return_on_site_minutes",
          "assigned_vehicle_id",
          "assigned_driver_id",
          "notes",
          "offer_id",
          "offer_number",
          "created_at",
        ].join(",")
      )
      .single();

    if (insErr) throw insErr;

    // (valfritt) uppdatera offertstatus
    try {
      await supabase
        .from("offers")
        .update({ status: "godkand" })
        .eq("id", off.id);
    } catch {
      // tyst
    }

    return res.status(200).json({ ok: true, booking: created });
  } catch (e: any) {
    console.error("from-offer error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
