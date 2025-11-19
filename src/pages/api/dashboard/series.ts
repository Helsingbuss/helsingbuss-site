// src/pages/api/dashboard/series.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";

export const config = { runtime: "nodejs" };

export type Series = {
  weeks: string[];
  offer_answered: number[];
  offer_unanswered: number[];
  booking_in: number[];
  booking_done: number[];
};

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

function weekNoStr(isoDate: string): string | null {
  if (!isoDate) return null;
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  return String(isoWeek(d));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const from = String(req.query.from || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    const to   = String(req.query.to   || "").slice(0, 10) || "2025-12-31";

    // Hämta nödvändiga fält
    const [offersRes, bookingsRes] = await Promise.all([
      supabase.from("offers").select("status,created_at").gte("created_at", from).lte("created_at", to),
      supabase.from("bookings").select("status,created_at").gte("created_at", from).lte("created_at", to),
    ]);

    const offers   = Array.isArray(offersRes.data)   ? offersRes.data   : [];
    const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

    const wset = new Set<number>();

    const weekOffer = (o: any) => {
      const d = String(o.created_at || "").slice(0, 10);
      const w = weekNoStr(d);
      if (w) wset.add(Number(w));
      return w;
    };
    const weekBooking = (b: any) => {
      const d = String(b.created_at || "").slice(0, 10);
      const w = weekNoStr(d);
      if (w) wset.add(Number(w));
      return w;
    };

    offers.forEach(weekOffer);
    bookings.forEach(weekBooking);

    const weeks = Array.from(wset).sort((a, b) => a - b).map(n => String(n));

    const c = {
      offer_answered: new Map<string, number>(),
      offer_unanswered: new Map<string, number>(),
      booking_in: new Map<string, number>(),
      booking_done: new Map<string, number>(),
    };
    const inc = (m: Map<string, number>, k: string) => m.set(k, 1 + (m.get(k) || 0));

    // Besvarad vs obesvarad
    for (const o of offers) {
      const w = weekOffer(o); if (!w) continue;
      const s = String(o.status ?? "").toLowerCase();
      const answered = s === "besvarad" || s === "answered";
      inc(answered ? c.offer_answered : c.offer_unanswered, w);
    }

    // Bokningar
    for (const b of bookings) {
      const w = weekBooking(b); if (!w) continue;
      const s = String(b.status ?? "").toLowerCase();
      const done = s === "klar" || s === "done" || s === "completed";
      inc(done ? c.booking_done : c.booking_in, w);
    }

    const toArr = (m: Map<string, number>) => weeks.map(w => m.get(w) || 0);

    const payload: Series = {
      weeks,
      offer_answered:   toArr(c.offer_answered),
      offer_unanswered: toArr(c.offer_unanswered),
      booking_in:       toArr(c.booking_in),
      booking_done:     toArr(c.booking_done),
    };

    return res.status(200).json(payload);
  } catch (e: any) {
    console.error("/api/dashboard/series error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
