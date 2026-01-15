// src/pages/api/bookings/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendBookingMail } from "@/lib/sendBookingMail";

function toNull(v: any) {
  return v === "" || v === undefined ? null : v;
}

function asStringOrNull(v: any) {
  const s = v == null ? "" : String(v).trim();
  return s ? s : null;
}

function asIntOrNull(v: any) {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

// Normaliserar till HH:MM om möjligt (accepterar "8:0", "0800", "800", "08:00")
function normaliseTime(v: any): string | null {
  const s = asStringOrNull(v);
  if (!s) return null;

  // HH:MM eller H:MM
  if (s.includes(":")) {
    const [hhRaw, mmRaw = "00"] = s.split(":");
    const hh = String(hhRaw || "0").padStart(2, "0").slice(0, 2);
    const mm = String(mmRaw || "0").padStart(2, "0").slice(0, 2);
    if (isNaN(Number(hh)) || isNaN(Number(mm))) return null;
    return `${hh}:${mm}`;
  }

  // 3-4 siffror => HHMM
  if (/^\d{3,4}$/.test(s)) {
    const hh = s.length === 3 ? `0${s[0]}` : s.slice(0, 2);
    const mm = s.slice(-2);
    if (isNaN(Number(hh)) || isNaN(Number(mm))) return null;
    return `${hh}:${mm}`;
  }

  return null;
}

// Säkerställ YYYY-MM-DD eller null
function normaliseDate(v: any): string | null {
  const s = asStringOrNull(v);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function nowISO() {
  return new Date().toISOString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const p = req.body ?? {};

    // booking number (fallback)
    let booking_number: string | null = asStringOrNull(p.booking_number);
    if (!booking_number) {
      const yy = new Date().getFullYear().toString().slice(-2);
      const rnd = Math.floor(1000 + Math.random() * 9000);
      booking_number = `BK${yy}${rnd}`;
    }

    // passengers: null eller >= 1
    const passengersRaw = asIntOrNull(p.passengers);
    const passengers = passengersRaw == null ? null : Math.max(1, passengersRaw);

    // tider/datum
    const departure_date = normaliseDate(p.departure_date);
    const departure_time = normaliseTime(p.departure_time);
    const end_time = normaliseTime(p.end_time);

    const return_date = normaliseDate(p.return_date);
    const return_time = normaliseTime(p.return_time);
    const return_end_time = normaliseTime(p.return_end_time);

    // (valfritt) – om du vill vara hård: kräva minimi-fält
    // Om din DB kräver dessa och de saknas, ger vi 400 istället för 500.
    if (!departure_date || !departure_time || !asStringOrNull(p.departure_place) || !asStringOrNull(p.destination)) {
      return res.status(400).json({
        error:
          "Saknar obligatoriska fält för utresa (departure_date, departure_time, departure_place, destination).",
      });
    }

    const record = {
      booking_number,
      status: "created",

      // kund
      contact_person: asStringOrNull(p.contact_person),
      customer_email: asStringOrNull(p.customer_email),
      customer_phone: asStringOrNull(p.customer_phone),

      // utresa
      passengers,
      departure_place: asStringOrNull(p.departure_place),
      destination: asStringOrNull(p.destination),
      departure_date,
      departure_time,
      end_time,
      on_site_minutes: (() => {
        const n = asIntOrNull(p.on_site_minutes);
        return n == null ? null : Math.max(0, n);
      })(),
      stopover_places: asStringOrNull(p.stopover_places),

      // retur
      return_departure: asStringOrNull(p.return_departure),
      return_destination: asStringOrNull(p.return_destination),
      return_date,
      return_time,
      return_end_time,
      return_on_site_minutes: (() => {
        const n = asIntOrNull(p.return_on_site_minutes);
        return n == null ? null : Math.max(0, n);
      })(),

      // interna
      assigned_vehicle_id: toNull(p.assigned_vehicle_id),
      assigned_driver_id: toNull(p.assigned_driver_id),

      // övrigt
      notes: asStringOrNull(p.notes),

      created_at: nowISO(),
      updated_at: nowISO(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      // ✅ logga HELA supabase-felet (det är här din sanning finns)
      console.error("Supabase insert error:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return res.status(400).json({
        error: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
    }

    // Skicka bokningsmail (icke-blockerande)
    (async () => {
      try {
        if (data?.customer_email) {
          await sendBookingMail({
            to: data.customer_email,
            bookingNumber: data.booking_number,
            passengers: data.passengers ?? null,
            out: {
              date: data.departure_date,
              time: data.departure_time,
              from: data.departure_place,
              to: data.destination,
            },
            ret: data.return_date
              ? {
                  date: data.return_date,
                  time: data.return_time,
                  from: data.return_departure,
                  to: data.return_destination,
                }
              : null,
          });
        }
      } catch (e) {
        console.warn("sendBookingMail failed:", (e as any)?.message || e);
      }
    })();

    return res.status(200).json({ ok: true, booking: data });
  } catch (e: any) {
    console.error("/api/bookings/create error:", e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
