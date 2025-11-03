// src/pages/api/dashboard/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Hjälpare: känns igen saknad tabell/kolumn utan att kasta 500 till klient */
function isMissingTableOrColumn(err: any) {
  const m = String(err?.message || "").toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("undefined_table") ||
    m.includes("column") ||
    err?.code === "42P01" // undefined_table
  );
}

/** YYYY-MM-DD -> Date (kl 00:00) */
function toDate(d: string | undefined): Date {
  const dt = d && !Number.isNaN(Date.parse(d)) ? new Date(d) : new Date();
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** ISO-vecka (sv) "v. 45" */
function weekLabel(date: Date): string {
  // ISO week
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Torsdag i aktuell vecka
  const dayNum = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `v. ${String(weekNo)}`;
}

/** Alla veck-labels mellan from..to (inklusive) */
function buildWeekBuckets(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    out.push(weekLabel(cur));
    cur.setUTCDate(cur.getUTCDate() + 7);
  }
  // säkerställ minst en
  if (out.length === 0) out.push(weekLabel(from));
  return out;
}

type Row = { created_at?: string | null; status?: string | null; /** ev. alternativa fält */ offer_date?: string | null; booking_date?: string | null; completed_at?: string | null; done_at?: string | null; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- Parametrar ---
  const fromStr = String(req.query.from || "");
  const toStr = String(req.query.to || "");
  let from = toDate(fromStr);
  let to = toDate(toStr || new Date().toISOString().slice(0, 10));
  if (to < from) [from, to] = [to, from];

  const rangeLabel = `${from.toISOString().slice(0, 10)} – ${to.toISOString().slice(0, 10)}`;
  const weeks = buildWeekBuckets(from, to);
  const zeroArr = Array(weeks.length).fill(0);

  // Resultstruktur – exakt som din komponent förväntar sig
  const result = {
    range: rangeLabel,
    series: {
      weeks,
      offer_answered: [...zeroArr],
      offer_unanswered: [...zeroArr],
      booking_in: [...zeroArr],
      booking_done: [...zeroArr],
    },
    totals: { offer_answered: 0, offer_unanswered: 0, booking_in: 0, booking_done: 0 },
  };

  try {
    // ----------------------------------------------------
    // 1) Hämta OFFERS (tolerant för olika kolumner)
    // ----------------------------------------------------
    let offers: Row[] = [];
    try {
      // Försök primärt med created_at
      const { data, error } = await supabaseAdmin
        .from("offers")
        .select("id, created_at, status, offer_date")
        .gte("created_at", from.toISOString())
        .lte("created_at", new Date(to.getTime() + 86400000 - 1).toISOString()); // inkl. hela 'to'-dagen
      if (error) throw error;

      offers = (data ?? []) as Row[];

      // Om vi fick extremt lite data (eller du saknar created_at): komplettera via offer_date
      if (offers.length === 0) {
        const { data: byOfferDate, error: e2 } = await supabaseAdmin
          .from("offers")
          .select("id, status, offer_date")
          .gte("offer_date", from.toISOString().slice(0, 10))
          .lte("offer_date", to.toISOString().slice(0, 10));
        if (!e2 && byOfferDate) offers = byOfferDate as Row[];
      }
    } catch (e: any) {
      if (!isMissingTableOrColumn(e)) throw e;
      offers = [];
    }

    // ----------------------------------------------------
    // 2) Hämta BOOKINGS (tolerant för olika kolumner)
    // ----------------------------------------------------
    let bookings: Row[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .select("id, created_at, status, booking_date, completed_at, done_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", new Date(to.getTime() + 86400000 - 1).toISOString());
      if (error) throw error;

      bookings = (data ?? []) as Row[];

      // backup om created_at saknas: på booking_date
      if (bookings.length === 0) {
        const { data: byBookingDate, error: e2 } = await supabaseAdmin
          .from("bookings")
          .select("id, status, booking_date, completed_at, done_at")
          .gte("booking_date", from.toISOString().slice(0, 10))
          .lte("booking_date", to.toISOString().slice(0, 10));
        if (!e2 && byBookingDate) bookings = byBookingDate as Row[];
      }
    } catch (e: any) {
      if (!isMissingTableOrColumn(e)) throw e;
      bookings = [];
    }

    // ----------------------------------------------------
    // 3) Grupp & räkna per vecka
    // ----------------------------------------------------
    // Vilka status räknas som besvarad offert?
    const ANSWERED = new Set(["godkand","accepterad","accepterat","refused","nekad","avböjd","besvarad","answered","accepted","declined","won","lost","priced","sent-to-customer"]);
    const UNANSWERED = new Set(["ny","obesvarad","pending","new","open","draft","waiting"]);

    const weekIndex = new Map(weeks.map((w, i) => [w, i]));

    function pushToSeries(datestr: string | null | undefined, arr: number[]) {
      if (!datestr) return;
      const dt = new Date(datestr);
      const lbl = weekLabel(dt);
      const idx = weekIndex.get(lbl);
      if (idx === undefined) return;
      arr[idx] += 1;
    }

    // Offers
    for (const o of offers) {
      const status = String(o.status || "").toLowerCase();
      const created = o.created_at ?? o.offer_date ?? null;

      if (ANSWERED.has(status)) {
        pushToSeries(created, result.series.offer_answered);
        result.totals.offer_answered += 1;
      } else if (UNANSWERED.has(status) || !status) {
        pushToSeries(created, result.series.offer_unanswered);
        result.totals.offer_unanswered += 1;
      } else {
        // okänd status -> räkna som obesvarad för att få med i grafen
        pushToSeries(created, result.series.offer_unanswered);
        result.totals.offer_unanswered += 1;
      }
    }

    // Bookings
    for (const b of bookings) {
      const created = b.created_at ?? b.booking_date ?? null;
      const status = String(b.status || "").toLowerCase();

      // inkomna bokningar: baseras på created/booking_date
      if (created) {
        pushToSeries(created, result.series.booking_in);
        result.totals.booking_in += 1;
      }

      // slutförda: status eller fält completed_at/done_at
      const isDone =
        !!b.completed_at ||
        !!b.done_at ||
        ["klar", "completed", "done", "slutförd", "finished"].includes(status);
      if (isDone) {
        const when = b.completed_at ?? b.done_at ?? created;
        if (when) {
          pushToSeries(when, result.series.booking_done);
          result.totals.booking_done += 1;
        }
      }
    }

    return res.status(200).json(result);
  } catch (e: any) {
    // Falla tillbaka till tomma data men svara 200 -> inget "HTTP 500" i UI
    console.error("/api/dashboard/stats error:", e?.message || e);
    return res.status(200).json(result);
  }
}
