// src/pages/api/public/booking/init.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type BookingTrip = {
  id: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  city?: string | null;
  country?: string | null;
  hero_image?: string | null;
  slug?: string | null;
};

type BookingDeparture = {
  trip_id: string;
  date: string;
  time: string | null;
  line_name: string | null;
  seats_total: number;
  seats_reserved: number;
  seats_left: number;
};

type BookingTicket = {
  id: number;
  ticket_type_id: number;
  name: string;
  code: string | null;
  price: number;
  currency: string;
  departure_date: string | null;
};

type BookingInitResponse = {
  ok: boolean;
  error?: string;
  trip?: BookingTrip;
  departure?: BookingDeparture;
  tickets?: BookingTicket[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookingInitResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed (use GET).",
    });
  }

  const { trip_id, date } = req.query;

  if (!trip_id || !date) {
    return res.status(400).json({
      ok: false,
      error: "Saknar trip_id eller date i query.",
    });
  }

  const tripId = String(trip_id);
  const departDate = String(date).slice(0, 10);

  try {
    // --- 1) Hämta avgång (var tolerant mot olika kolumnnamn) ---
    const { data: depRows, error: depErr } = await supabase
      .from("trip_departures")
      .select(
        "trip_id, depart_date, date, dep_date, departure_date, dep_time, time, line_name, line, seats_total, seats_reserved"
      )
      .eq("trip_id", tripId)
      .or(
        [
          `depart_date.eq.${departDate}`,
          `date.eq.${departDate}`,
          `dep_date.eq.${departDate}`,
          `departure_date.eq.${departDate}`,
        ].join(",")
      );

    if (depErr) {
      console.error("booking/init depErr", depErr);
    }

    const dep = (depRows && depRows[0]) || null;

    if (!dep) {
      return res.status(404).json({
        ok: false,
        error: "Hittade ingen avgång för det datumet.",
      });
    }

    const rawDate: string =
      (dep as any).depart_date ||
      (dep as any).date ||
      (dep as any).dep_date ||
      (dep as any).departure_date ||
      departDate;

    const dateOnly = String(rawDate).slice(0, 10);

    const rawTime: string | null =
      (dep as any).dep_time || (dep as any).time || null;

    const lineName: string | null =
      (dep as any).line_name || (dep as any).line || null;

    const total = (dep as any).seats_total ?? 0;
    const reserved = (dep as any).seats_reserved ?? 0;
    const left = Math.max(total - reserved, 0);

    // --- 2) Hämta resa ---
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select(
        "id, title, subtitle, summary, city, country, hero_image, slug"
      )
      .eq("id", tripId)
      .single();

    if (tripErr || !trip) {
      console.error("booking/init tripErr", tripErr);
      return res.status(404).json({
        ok: false,
        error: "Resan kunde inte hittas.",
      });
    }

    // --- 3) Hämta priser för datumet (eller standardpris med NULL) ---
    const { data: priceRows, error: priceErr } = await supabase
      .from("trip_ticket_pricing")
      .select(
        "id, trip_id, ticket_type_id, departure_date, price, currency, ticket_types(name, code)"
      )
      .eq("trip_id", tripId)
      .or(`departure_date.is.null,departure_date.eq.${dateOnly}`)
      .order("departure_date", { ascending: true });

    if (priceErr) throw priceErr;

    const tickets: BookingTicket[] = (priceRows || []).map((row: any) => ({
      id: row.id,
      ticket_type_id: row.ticket_type_id,
      name: row.ticket_types?.name || "Biljett",
      code: row.ticket_types?.code || null,
      price: Number(row.price),
      currency: row.currency || "SEK",
      departure_date: row.departure_date
        ? String(row.departure_date).slice(0, 10)
        : null,
    }));

    return res.status(200).json({
      ok: true,
      trip: {
        id: trip.id,
        title: trip.title,
        subtitle: trip.subtitle,
        summary: trip.summary,
        city: trip.city,
        country: trip.country,
        hero_image: trip.hero_image,
        slug: trip.slug,
      },
      departure: {
        trip_id: dep.trip_id,
        date: dateOnly,
        time: rawTime,
        line_name: lineName,
        seats_total: total,
        seats_reserved: reserved,
        seats_left: left,
      },
      tickets,
    });
  } catch (e: any) {
    console.error("booking/init error", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel.",
    });
  }
}
