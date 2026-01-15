// src/pages/api/bookings/calender.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

export const config = { runtime: "nodejs" };

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type JsonError = { error: string };

export type BookingCalenderItem = {
  id: string;
  booking_number: string | null;
  status: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  title: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function tidyTime(t?: any): string | null {
  if (!t) return null;
  const s = String(t);
  if (s.includes(":")) return s.slice(0, 5);
  if (s.length >= 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  return null;
}

function parseMonth(input?: string | null) {
  const now = new Date();
  const fallback = `${Math.max(2025, now.getFullYear())}-${pad2(now.getMonth() + 1)}`;

  const m = (input || "").trim();
  const m2 = m.match(/^(\d{4})-(\d{1,2})$/);
  if (!m2) return fallback;

  const y = Math.max(2025, Number(m2[1]));
  const mm = Number(m2[2]);
  if (!Number.isFinite(mm) || mm < 1 || mm > 12) return fallback;

  return `${y}-${pad2(mm)}`;
}

function monthRange(month: string) {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const end = new Date(Date.UTC(y, m, 1));
  const startYMD = `${yStr}-${mStr}-01`;
  const endYMD = `${end.getUTCFullYear()}-${pad2(end.getUTCMonth() + 1)}-01`;
  return { startYMD, endYMD };
}

function ymdFromAny(row: any): string | null {
  const d = row.departure_date ?? row.date ?? null;
  if (d) return String(d).slice(0, 10);
  const ca = row.created_at ? String(row.created_at) : null;
  return ca ? ca.slice(0, 10) : null;
}

function buildTitle(row: any) {
  const from = row.departure_place ?? row.from ?? null;
  const to = row.destination ?? row.to ?? null;
  if (from || to) return `${from || "—"} → ${to || "—"}`;
  return row.contact_person ? String(row.contact_person) : "Bokning";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ month: string; items: BookingCalenderItem[] } | JsonError>
) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!supabase) return res.status(500).json({ error: "Supabase-admin saknas" });

    const month = parseMonth(typeof req.query.month === "string" ? req.query.month : null);
    const { startYMD, endYMD } = monthRange(month);

    // Försök departure_date först, annars created_at
    let r = await supabase
      .from("bookings")
      .select("id, booking_number, status, created_at, departure_date, departure_time, departure_place, destination")
      .gte("departure_date", startYMD)
      .lt("departure_date", endYMD)
      .order("departure_date", { ascending: true });

    if (r.error) {
      r = await supabase
        .from("bookings")
        .select("id, booking_number, status, created_at, departure_date, departure_time, departure_place, destination")
        .gte("created_at", `${startYMD}T00:00:00.000Z`)
        .lt("created_at", `${endYMD}T00:00:00.000Z`)
        .order("created_at", { ascending: true });
    }

    if (r.error) throw r.error;

    const rows = Array.isArray(r.data) ? r.data : [];
    const items: BookingCalenderItem[] = [];

    for (const row of rows) {
      const id = String(row.id || "");
      const date = ymdFromAny(row);
      if (!id || !date) continue;

      items.push({
        id,
        booking_number: row.booking_number ?? null,
        status: row.status ?? null,
        date,
        time: tidyTime(row.departure_time),
        title: buildTitle(row),
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
    console.error("/api/bookings/calender error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
