// src/pages/api/economy/series.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type JsonError = { error: string };

type EconomyMonth = {
  month: string; // YYYY-MM

  done_count: number;
  done_gross: number;
  done_vat: number;
  done_net: number;
  done_passengers: number;

  forecast_count: number;
  forecast_gross: number;
  forecast_vat: number;
  forecast_net: number;
  forecast_passengers: number;

  commission_done: number;
  commission_forecast: number;
};

type EconomyPayload = {
  from: string;
  to: string;
  includeVat: boolean;
  vatRate: number;
  months: EconomyMonth[];
  totals: Omit<EconomyMonth, "month">;
};

function isYMD(s?: string | null) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthKey(ymd: string) {
  return String(ymd).slice(0, 7);
}

function monthsBetween(fromYMD: string, toYMD: string) {
  const a = new Date(`${fromYMD}T00:00:00Z`);
  const b = new Date(`${toYMD}T00:00:00Z`);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return [];
  if (a.getTime() > b.getTime()) return [];

  const out: string[] = [];
  const d = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1));
  const end = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 1));

  while (d.getTime() <= end.getTime()) {
    out.push(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`);
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

function splitVat(amount: number, includeVat: boolean, vatRate: number) {
  const gross = includeVat ? amount : amount * (1 + vatRate);
  const net = includeVat ? amount / (1 + vatRate) : amount;
  const vat = gross - net;
  return { gross, net, vat };
}

function toNum(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: any) {
  const n = Math.floor(Number(v ?? 0));
  return Number.isFinite(n) ? n : 0;
}

function isDoneBookingStatus(s?: any) {
  const v = String(s ?? "").toLowerCase().trim();
  return ["klar", "genomförd", "genomford", "completed", "done", "avslutad"].includes(v);
}

function isApprovedOfferStatus(s?: any) {
  const v = String(s ?? "").toLowerCase().trim();
  return ["godkänd", "godkand", "approved", "accepted", "bekräftad", "bekraftad"].includes(v);
}

function pickDate(row: any) {
  const d = row?.departure_date ?? row?.date ?? row?.trip_date ?? null;
  if (d) return String(d).slice(0, 10);
  const ca = row?.created_at ? String(row.created_at) : null;
  return ca ? ca.slice(0, 10) : null;
}

function pickTotalPrice(row: any) {
  // Anpassad för olika fältvarianter
  return (
    row?.total_price ??
    row?.price_total ??
    row?.total ??
    row?.totalAmount ??
    row?.amount ??
    null
  );
}

function parsePercent(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim().replace(",", ".");
  const m = s.match(/-?\d+(\.\d+)?/);
  const n = m ? Number(m[0]) : 0;
  return Number.isFinite(n) ? n : 0;
}

// Vi försöker läsa synergy_percent om den finns – men utan att krascha om kolumnen saknas
async function fetchOffersMonthRange(fromYMD: string, toYMD: string) {
  // 1) prova select inkl synergy_percent
  let r = await supabase
    .from("offers")
    .select("id,status,total_price,passengers,departure_date,created_at,synergy_percent")
    .gte("departure_date", fromYMD)
    .lte("departure_date", toYMD);

  if (r.error && /synergy_percent/i.test(String(r.error.message || ""))) {
    // 2) fallback utan kolumnen
    r = await supabase
      .from("offers")
      .select("id,status,total_price,passengers,departure_date,created_at")
      .gte("departure_date", fromYMD)
      .lte("departure_date", toYMD);
  }

  if (r.error) {
    // fallback: created_at för rader som saknar departure_date
    let r2 = await supabase
      .from("offers")
      .select("id,status,total_price,passengers,departure_date,created_at,synergy_percent")
      .is("departure_date", null)
      .gte("created_at", `${fromYMD}T00:00:00.000Z`)
      .lte("created_at", `${toYMD}T23:59:59.999Z`);

    if (r2.error && /synergy_percent/i.test(String(r2.error.message || ""))) {
      r2 = await supabase
        .from("offers")
        .select("id,status,total_price,passengers,departure_date,created_at")
        .is("departure_date", null)
        .gte("created_at", `${fromYMD}T00:00:00.000Z`)
        .lte("created_at", `${toYMD}T23:59:59.999Z`);
    }

    if (r2.error) throw r2.error;
    return (Array.isArray(r2.data) ? r2.data : []) as any[];
  }

  // + även med null departure_date inom created_at
  let rNull = await supabase
    .from("offers")
    .select("id,status,total_price,passengers,departure_date,created_at,synergy_percent")
    .is("departure_date", null)
    .gte("created_at", `${fromYMD}T00:00:00.000Z`)
    .lte("created_at", `${toYMD}T23:59:59.999Z`);

  if (rNull.error && /synergy_percent/i.test(String(rNull.error.message || ""))) {
    rNull = await supabase
      .from("offers")
      .select("id,status,total_price,passengers,departure_date,created_at")
      .is("departure_date", null)
      .gte("created_at", `${fromYMD}T00:00:00.000Z`)
      .lte("created_at", `${toYMD}T23:59:59.999Z`);
  }

  if (rNull.error) throw rNull.error;

  const a = (Array.isArray(r.data) ? r.data : []) as any[];
  const b = (Array.isArray(rNull.data) ? rNull.data : []) as any[];
  return [...a, ...b];
}

async function fetchBookingsMonthRange(fromYMD: string, toYMD: string) {
  const r = await supabase
    .from("bookings")
    .select("id,status,total_price,passengers,departure_date,created_at")
    .gte("departure_date", fromYMD)
    .lte("departure_date", toYMD);

  if (r.error) {
    // fallback: created_at (och även om departure_date saknas)
    const r2 = await supabase
      .from("bookings")
      .select("id,status,total_price,passengers,departure_date,created_at")
      .gte("created_at", `${fromYMD}T00:00:00.000Z`)
      .lte("created_at", `${toYMD}T23:59:59.999Z`);

    if (r2.error) throw r2.error;
    return (Array.isArray(r2.data) ? r2.data : []) as any[];
  }

  // + rader med null departure_date inom created_at
  const rNull = await supabase
    .from("bookings")
    .select("id,status,total_price,passengers,departure_date,created_at")
    .is("departure_date", null)
    .gte("created_at", `${fromYMD}T00:00:00.000Z`)
    .lte("created_at", `${toYMD}T23:59:59.999Z`);

  if (rNull.error) throw rNull.error;

  const a = (Array.isArray(r.data) ? r.data : []) as any[];
  const b = (Array.isArray(rNull.data) ? rNull.data : []) as any[];
  return [...a, ...b];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EconomyPayload | JsonError>
) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!supabase) return res.status(500).json({ error: "Supabase-admin saknas" });

    const now = new Date();
    const defaultFrom = "2025-01-01";
    const defaultTo = now.toISOString().slice(0, 10);

    const fromRaw = typeof req.query.from === "string" ? req.query.from : "";
    const toRaw = typeof req.query.to === "string" ? req.query.to : "";

    let from = isYMD(fromRaw) ? fromRaw : defaultFrom;
    let to = isYMD(toRaw) ? toRaw : defaultTo;

    // clamp så vi inte hamnar före 2025 av misstag
    if (from < "2025-01-01") from = "2025-01-01";
    if (to < from) to = from;

    const includeVat = String(req.query.includeVat ?? "1") === "1";
    const vatRate = clamp(Number(String(req.query.vatRate ?? "0.06").replace(",", ".")) || 0.06, 0, 1);

    const monthList = monthsBetween(from, to);
    const map: Record<string, EconomyMonth> = {};
    for (const m of monthList) {
      map[m] = {
        month: m,

        done_count: 0,
        done_gross: 0,
        done_vat: 0,
        done_net: 0,
        done_passengers: 0,

        forecast_count: 0,
        forecast_gross: 0,
        forecast_vat: 0,
        forecast_net: 0,
        forecast_passengers: 0,

        commission_done: 0,
        commission_forecast: 0,
      };
    }

    // --- BOOKINGS (done) ---
    const bookings = await fetchBookingsMonthRange(from, to);
    for (const row of bookings) {
      const d = pickDate(row);
      if (!d) continue;
      const mk = monthKey(d);
      const bucket = map[mk];
      if (!bucket) continue;

      if (!isDoneBookingStatus(row.status)) continue;

      const amount = toNum(pickTotalPrice(row));
      const { gross, net, vat } = splitVat(amount, includeVat, vatRate);

      bucket.done_count += 1;
      bucket.done_gross += gross;
      bucket.done_net += net;
      bucket.done_vat += vat;
      bucket.done_passengers += toInt(row.passengers);
      // commission_done: (om du senare vill koppla provision även på bookings)
    }

    // --- OFFERS (forecast from approved) ---
    const offers = await fetchOffersMonthRange(from, to);
    for (const row of offers) {
      const d = pickDate(row);
      if (!d) continue;
      const mk = monthKey(d);
      const bucket = map[mk];
      if (!bucket) continue;

      if (!isApprovedOfferStatus(row.status)) continue;

      const amount = toNum(pickTotalPrice(row));
      const { gross, net, vat } = splitVat(amount, includeVat, vatRate);

      bucket.forecast_count += 1;
      bucket.forecast_gross += gross;
      bucket.forecast_net += net;
      bucket.forecast_vat += vat;
      bucket.forecast_passengers += toInt(row.passengers);

      // Synergy provision om fältet finns (4/7/11% etc). Om saknas -> 0.
      const pct = parsePercent((row as any).synergy_percent);
      if (pct > 0) bucket.commission_forecast += gross * (pct / 100);
    }

    const months = monthList.map((m) => map[m]).filter(Boolean);

    const totals = months.reduce(
      (acc, m) => {
        acc.done_count += m.done_count;
        acc.done_gross += m.done_gross;
        acc.done_net += m.done_net;
        acc.done_vat += m.done_vat;
        acc.done_passengers += m.done_passengers;

        acc.forecast_count += m.forecast_count;
        acc.forecast_gross += m.forecast_gross;
        acc.forecast_net += m.forecast_net;
        acc.forecast_vat += m.forecast_vat;
        acc.forecast_passengers += m.forecast_passengers;

        acc.commission_done += m.commission_done;
        acc.commission_forecast += m.commission_forecast;

        return acc;
      },
      {
        done_count: 0,
        done_gross: 0,
        done_vat: 0,
        done_net: 0,
        done_passengers: 0,

        forecast_count: 0,
        forecast_gross: 0,
        forecast_vat: 0,
        forecast_net: 0,
        forecast_passengers: 0,

        commission_done: 0,
        commission_forecast: 0,
      }
    );

    return res.status(200).json({
      from,
      to,
      includeVat,
      vatRate,
      months,
      totals,
    });
  } catch (e: any) {
    console.error("/api/economy/series error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
