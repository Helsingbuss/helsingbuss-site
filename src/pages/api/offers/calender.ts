// src/pages/api/offers/calendar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

export const config = { runtime: "nodejs" };

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type JsonError = { error: string };

export type OfferCalendarItem = {
  id: string;
  offer_number: string | null;
  status: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  title: string;
  email: string | null;
  total_price: number | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isYMD(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function tidyTime(t?: any): string | null {
  if (!t) return null;
  const s = String(t);
  if (s.includes(":")) return s.slice(0, 5);
  if (s.length >= 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  return null;
}

function ymdFromAny(row: any): string | null {
  const d =
    row.departure_date ??
    row.out_date ??
    row.date ??
    row.trip_date ??
    null;

  if (d) return String(d).slice(0, 10);

  const ca = row.created_at ? String(row.created_at) : null;
  if (ca) return ca.slice(0, 10);

  return null;
}

function timeFromAny(row: any): string | null {
  return (
    tidyTime(row.departure_time) ||
    tidyTime(row.out_time) ||
    tidyTime(row.time) ||
    (row.created_at ? tidyTime(String(row.created_at).slice(11, 16)) : null)
  );
}

function pickOfferNumber(row: any): string | null {
  return row.offer_number ?? row.offer_no ?? row.number ?? row.no ?? null;
}

function pickEmail(row: any): string | null {
  return row.contact_email ?? row.customer_email ?? row.email ?? null;
}

function pickTotal(row: any): number | null {
  const v = row.total_price ?? row.total ?? row.price_total ?? null;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildTitle(row: any): string {
  const from =
    row.departure_place ??
    row.out_from ??
    row.from ??
    row.origin ??
    null;

  const to =
    row.destination ??
    row.out_to ??
    row.to ??
    row.dest ??
    null;

  if (from || to) {
    const a = from ? String(from) : "—";
    const b = to ? String(to) : "—";
    return `${a} → ${b}`;
  }

  const customer =
    row.customer_reference ??
    row.contact_person ??
    row.customer_name ??
    row.name ??
    null;

  if (customer) return String(customer);

  const no = pickOfferNumber(row);
  return no ? `Offert ${no}` : "Offert";
}

function parseMonth(input?: string | null) {
  const now = new Date();
  const fallback = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const m = (input || "").trim();
  if (!/^\d{4}-\d{2}$/.test(m)) return fallback;
  return m;
}

function monthRange(month: string) {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1-12
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1)); // nästa månad
  const startYMD = `${yStr}-${mStr}-01`;
  const endYMD = `${end.getUTCFullYear()}-${pad2(end.getUTCMonth() + 1)}-01`;
  return { startYMD, endYMD };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ month: string; items: OfferCalendarItem[] } | JsonError>
) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!supabase) return res.status(500).json({ error: "Supabase-admin saknas" });

    // Stöd:
    // - ?month=YYYY-MM (standard)
    // - eller ?from=YYYY-MM-DD&to=YYYY-MM-DD
    const qMonth = typeof req.query.month === "string" ? req.query.month : null;
    const month = parseMonth(qMonth);

    let from = typeof req.query.from === "string" ? req.query.from : "";
    let to = typeof req.query.to === "string" ? req.query.to : "";

    if (!isYMD(from) || !isYMD(to)) {
      const r = monthRange(month);
      from = r.startYMD;
      to = r.endYMD; // OBS: to här är "nästa månad 01" (exklusiv)
    } else {
      // om from/to anges som YMD: gör to exklusiv genom +1 dag
      const dt = new Date(`${to}T00:00:00Z`);
      dt.setUTCDate(dt.getUTCDate() + 1);
      to = `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
    }

    const status = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const niceSelect =
      "id, offer_number, status, created_at, departure_date, departure_time, departure_place, destination, customer_reference, contact_email, customer_email, total_price";

    // Primärt: departure_date (om den finns)
    let q = supabase
      .from("offers")
      .select(niceSelect)
      .gte("departure_date", from)
      .lt("departure_date", to)
      .order("departure_date", { ascending: true })
      .order("departure_time", { ascending: true });

    if (status) q = q.eq("status", status);

    if (search) {
      q = q.or(
        [
          `offer_number.ilike.%${search}%`,
          `customer_reference.ilike.%${search}%`,
          `contact_email.ilike.%${search}%`,
          `departure_place.ilike.%${search}%`,
          `destination.ilike.%${search}%`,
        ].join(",")
      );
    }

    let resp = await q;

    // Fallback 1: om departure_date saknas i tabellen eller ger fel
    if (resp.error) {
      let q2 = supabase
        .from("offers")
        .select(niceSelect)
        .gte("created_at", from)
        .lt("created_at", to)
        .order("created_at", { ascending: true });

      if (status) q2 = q2.eq("status", status);
      if (search) {
        q2 = q2.or(
          [
            `offer_number.ilike.%${search}%`,
            `customer_reference.ilike.%${search}%`,
            `contact_email.ilike.%${search}%`,
            `departure_place.ilike.%${search}%`,
            `destination.ilike.%${search}%`,
          ].join(",")
        );
      }

      const r2 = await q2;
      if (r2.error) throw r2.error;
      resp = r2;
    }

    const rows = Array.isArray(resp.data) ? resp.data : [];

    const items: OfferCalendarItem[] = [];
    for (const row of rows) {
      const id = String(row.id || "");
      if (!id) continue;

      const date = ymdFromAny(row);
      if (!date) continue;

      items.push({
        id,
        offer_number: pickOfferNumber(row),
        status: row.status ?? null,
        date,
        time: timeFromAny(row),
        title: buildTitle(row),
        email: pickEmail(row),
        total_price: pickTotal(row),
      });
    }

    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const at = a.time || "99:99";
      const bt = b.time || "99:99";
      if (at !== bt) return at.localeCompare(bt);
      return a.title.localeCompare(b.title);
    });

    return res.status(200).json({ month, items });
  } catch (e: any) {
    console.error("/api/offers/calendar error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
