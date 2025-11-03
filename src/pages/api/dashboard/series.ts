// src/pages/api/dashboard/series.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Row = Record<string, any>;
type ChartSeries = {
  weeks: string[];
  offer_answered: number[];
  offer_unanswered: number[];
  booking_in: number[];
  booking_done: number[];
};

/* ---------------- helpers ---------------- */

function parseISO(s?: any) {
  if (!s) return null;
  const d = new Date(String(s));
  return isNaN(d.getTime()) ? null : d;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// ISO-vecka till "v. NN"
function isoWeekStr(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `v. ${String(weekNo).padStart(2, "0")}`;
}

// Skapa veckobuckets mellan from..to
function buildWeekBuckets(from: Date, to: Date) {
  const buckets: { key: string; from: Date; to: Date }[] = [];
  const d = new Date(from);
  d.setDate(d.getDate() - ((d.getDay() || 7) - 1)); // måndag

  while (d <= to) {
    const monday = new Date(d);
    const sunday = new Date(d); sunday.setDate(sunday.getDate() + 6);
    buckets.push({ key: isoWeekStr(monday), from: startOfDay(monday), to: endOfDay(sunday) });
    d.setDate(d.getDate() + 7);
  }
  // trimma första/sista
  buckets[0].from = startOfDay(from);
  buckets[buckets.length - 1].to = endOfDay(to);
  return buckets;
}

// robust SELECT som tolererar saknade kolumner/tabeller
async function safeSelect(table: string, cols: string): Promise<Row[]> {
  try {
    const r = await supabaseAdmin.from(table).select(cols).limit(5000);
    if (!r.error && Array.isArray(r.data)) return r.data as Row[];
    // fallback: select * (om kolumn saknas)
    const r2 = await supabaseAdmin.from(table).select("*").limit(5000);
    if (!r2.error && Array.isArray(r2.data)) return r2.data as Row[];
    console.warn(`[dashboard/series] ${table} fallback also failed:`, r2.error?.message);
    return [];
  } catch (e: any) {
    // tabellen saknas / andra fel -> returnera tom lista
    console.warn(`[dashboard/series] ignoring ${table} error:`, e?.message || e);
    return [];
  }
}

// bästa tidsstämpeln vi kan hitta i raden
function bestTimestamp(r: Row): Date | null {
  return (
    parseISO(r.created_at) ||
    parseISO(r.inserted_at) ||
    parseISO(r.submitted_at) ||
    parseISO(r.updated_at) ||
    parseISO(r.created) ||
    parseISO(r.createdAt) ||
    null
  );
}

// avgör om offert är besvarad
function isOfferAnswered(r: Row) {
  const s = String(r.status ?? "").toLowerCase();
  if (parseISO(r.answered_at)) return true;
  return [
    "answered", "accepted", "approved", "declined",
    "besvarad", "godkänd", "godkand", "avböjd"
  ].some(k => s.includes(k));
}

// avgör om bokning är slutförd
function isBookingDone(r: Row) {
  const s = String(r.status ?? "").toLowerCase();
  if (parseISO(r.completed_at) || parseISO(r.finished_at) || parseISO(r.ended_at)) return true;
  return ["done", "completed", "finished", "slutförd", "slutförd bokning", "klar"].some(k => s.includes(k));
}

/* ---------------- handler ---------------- */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // datumintervall (default = senaste 8 veckor)
    const qFrom = String(req.query.from ?? "");
    const qTo = String(req.query.to ?? "");
    const defTo = new Date();
    const defFrom = new Date(); defFrom.setDate(defTo.getDate() - 56);

    const from = parseISO(qFrom) ?? defFrom;
    const to = parseISO(qTo) ?? defTo;

    // hämta data (mycket tolerant)
    const offers = await safeSelect(
      "offers",
      "id,status,created_at,inserted_at,submitted_at,updated_at,answered_at"
    );
    const bookings = await safeSelect(
      "bookings",
      "id,status,created_at,inserted_at,submitted_at,updated_at,completed_at,finished_at,ended_at"
    );

    // veckobuckets
    const buckets = buildWeekBuckets(startOfDay(from), endOfDay(to));
    const weeks = buckets.map(b => b.key);

    const series: ChartSeries = {
      weeks,
      offer_answered: weeks.map(() => 0),
      offer_unanswered: weeks.map(() => 0),
      booking_in: weeks.map(() => 0),
      booking_done: weeks.map(() => 0),
    };

    const indexFor = (d: Date | null) => {
      if (!d) return -1;
      for (let i = 0; i < buckets.length; i++) {
        if (d >= buckets[i].from && d <= buckets[i].to) return i;
      }
      return -1;
    };

    // filtrera offers på tid & räkna
    for (const r of offers) {
      const ts = bestTimestamp(r);
      if (!ts) continue;
      if (ts < startOfDay(from) || ts > endOfDay(to)) continue;
      const idx = indexFor(ts);
      if (idx < 0) continue;
      if (isOfferAnswered(r)) series.offer_answered[idx] += 1;
      else series.offer_unanswered[idx] += 1;
    }

    // filtrera bookings på tid & räkna
    for (const r of bookings) {
      const ts = bestTimestamp(r);
      if (!ts) continue;
      if (ts < startOfDay(from) || ts > endOfDay(to)) continue;
      const idx = indexFor(ts);
      if (idx < 0) continue;
      series.booking_in[idx] += 1;
      if (isBookingDone(r)) series.booking_done[idx] += 1;
    }

    // returnera ALLTID 200
    return res.status(200).json(series);
  } catch (e: any) {
    // sista skyddet – svara tomt istället för 500
    console.error("/api/dashboard/series fatal error:", e?.message || e);
    const empty: ChartSeries = {
      weeks: [],
      offer_answered: [],
      offer_unanswered: [],
      booking_in: [],
      booking_done: [],
    };
    return res.status(200).json(empty);
  }
}
