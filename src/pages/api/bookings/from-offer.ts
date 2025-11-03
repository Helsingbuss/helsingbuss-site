// src/pages/api/bookings/from-offer.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isMissingColumnOrTable(err: any) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    (msg.includes("does not exist") && (msg.includes("column") || msg.includes("table"))) ||
    err?.code === "42703" || // undefined_column
    err?.code === "42P01"    // undefined_table
  );
}

function bkFromHb(offerNo?: string | null): string | null {
  if (!offerNo) return null;
  const m = offerNo.trim().toUpperCase().match(/^HB(\d{2})(\d+)$/);
  if (!m) return null;
  return `BK${m[1]}${m[2]}`;
}

async function nextBkNumber(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(-2);
  // hämta senaste BKyyNNN och öka
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("booking_number")
    .ilike("booking_number", `BK${yy}%`)
    .order("booking_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.booking_number as string | undefined;
  const m = last?.match(/^BK(\d{2})(\d+)$/);
  const next = m && m[1] === yy ? String(parseInt(m[2], 10) + 1).padStart(m[2].length, "0") : "0001";
  return `BK${yy}${next}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const offerId = (req.body?.offerId as string | undefined) || (req.query?.offerId as string | undefined);
    if (!offerId) return res.status(400).json({ error: "Saknar offerId" });

    // Hämta offerten (ta med allt som kan vara relevant – tolerera saknade fält)
    let { data: off, error: offErr } = await supabaseAdmin
      .from("offers")
      .select(`
        id, offer_number, status,
        customer_reference, contact_email, contact_phone,
        passengers, notes,
        departure_place, destination, departure_date, departure_time, end_time, on_site_minutes, stopover_places,
        return_departure, return_destination, return_date, return_time, return_end_time, return_on_site_minutes
      `)
      .eq("id", offerId)
      .single();

    if (offErr && isMissingColumnOrTable(offErr)) {
      // Fallback till minsta möjliga om kolumner saknas
      const fb = await supabaseAdmin
        .from("offers")
        .select("id, offer_number, status, customer_reference, contact_email, contact_phone, passengers, notes, departure_place, destination, departure_date, departure_time, return_departure, return_destination, return_date, return_time")
        .eq("id", offerId)
        .single();
      if (fb.error) throw fb.error;
      off = fb.data;
    }
    if (offErr && !isMissingColumnOrTable(offErr)) throw offErr;
    if (!off) return res.status(404).json({ error: "Offert hittades inte" });

    // Sätt bokningsnummer: BK + samma år+serie som offerten om möjligt, annars nästa lediga
    let booking_number = bkFromHb(off.offer_number);
    if (!booking_number) booking_number = await nextBkNumber();

    // Bygg insatsdata (alla fält får vara null – vi prunar om kolumner saknas)
    const insert: Record<string, any> = {
      booking_number,
      offer_id: off.id,

      contact_person: off.customer_reference ?? null,
      customer_email: off.contact_email ?? null,
      customer_phone: off.contact_phone ?? null,

      passengers: off.passengers ?? null,
      notes: off.notes ?? null,

      departure_place: off.departure_place ?? null,
      destination: off.destination ?? null,
      departure_date: off.departure_date ?? null,
      departure_time: off.departure_time ?? null,
      end_time: (off as any)?.end_time ?? null,
      on_site_minutes: (off as any)?.on_site_minutes ?? null,
      stopover_places: (off as any)?.stopover_places ?? null,

      return_departure: off.return_departure ?? null,
      return_destination: off.return_destination ?? null,
      return_date: off.return_date ?? null,
      return_time: off.return_time ?? null,
      return_end_time: (off as any)?.return_end_time ?? null,
      return_on_site_minutes: (off as any)?.return_on_site_minutes ?? null,

      status: "new",
      created_at: new Date().toISOString(),
    };

    // 1) Första försöket – alla fält
    let ins = await supabaseAdmin
      .from("bookings")
      .insert(insert)
      .select("id, booking_number")
      .single();

    // 2) Om kolumn saknas: pruna och försök igen
    if (ins.error && isMissingColumnOrTable(ins.error)) {
      const msg = (ins.error.message || "").toLowerCase();
      // heuristik: ta bort de fält som ofta saknas hos dig
      delete insert.contact_person;
      delete insert.customer_email;
      delete insert.customer_phone;

      delete insert.on_site_minutes;
      delete insert.stopover_places;
      delete insert.end_time;
      delete insert.return_on_site_minutes;
      delete insert.return_end_time;

      delete insert.offer_id;

      ins = await supabaseAdmin
        .from("bookings")
        .insert(insert)
        .select("id, booking_number")
        .single();
    }
    if (ins.error) throw ins.error;

    const booking = ins.data;

    // Försök länka tillbaka till offerten (tolerant)
    try {
      await supabaseAdmin.from("offers").update({ booking_id: booking.id }).eq("id", off.id);
    } catch {
      /* ok om kolumnen inte finns */
    }

    return res.status(200).json({ ok: true, booking });
  } catch (e: any) {
    console.error("/api/bookings/from-offer error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
