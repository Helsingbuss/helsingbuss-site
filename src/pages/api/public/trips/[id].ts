// src/pages/api/public/widget/departures/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type LineStop = { name?: string; time?: string };
type Line = { title?: string; stops?: LineStop[] };

function cors(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function formatPrice(n?: number | null): string {
  if (n == null) return "";
  const v = Math.round(Number(n));
  return `${v.toLocaleString("sv-SE")}:-`;
}

function formatDateLabel(isoDate: string): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  const d = new Date(`${isoDate}T00:00:00`);
  const weekday = d
    .toLocaleDateString("sv-SE", { weekday: "short" })
    .replace(".", "");
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${year}-${month}-${day} ${capWeekday}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const slugRaw = req.query.slug;
  if (!slugRaw || Array.isArray(slugRaw)) {
    return res
      .status(400)
      .json({ ok: false, error: "Saknar eller ogiltig slug-param." });
  }
  const slug = String(slugRaw);

  try {
    // ----- Hämta resa -----
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, title, subtitle, price_from, lines, published")
      .eq("slug", slug)
      .single();

    if (tripErr) {
      console.error("widget trips error:", tripErr);
      return res
        .status(500)
        .json({ ok: false, error: "Kunde inte läsa resa." });
    }

    if (!trip || trip.published === false) {
      return res
        .status(404)
        .json({ ok: false, error: "Resan hittades inte." });
    }

    const todayIso = new Date().toISOString().slice(0, 10);

    // ----- Hämta kommande avgångar -----
    const { data: depRows, error: depErr } = await supabase
      .from("trip_departures")
      .select("id, depart_date, seats_total, seats_reserved, status")
      .eq("trip_id", trip.id)
      .gte("depart_date", todayIso)
      .order("depart_date", { ascending: true });

    if (depErr) {
      console.error("widget departures error:", depErr);
      return res
        .status(500)
        .json({ ok: false, error: "Kunde inte läsa avgångar." });
    }

    // ----- Linje + hållplatser från trips.lines -----
    const lines: Line[] = Array.isArray(trip.lines) ? trip.lines : [];
    const firstLine: Line | null = lines.length ? lines[0] : null;

    const lineLabel =
      (firstLine && firstLine.title && String(firstLine.title).trim()) ||
      "Linje 1";

    let stopsText = "";
    if (firstLine && Array.isArray(firstLine.stops)) {
      const parts = firstLine.stops
        .map((s) => {
          if (!s || !s.name) return null;
          const name = String(s.name).trim();
          if (!name) return null;
          const time = s.time ? String(s.time).trim() : "";
          return time ? `${name} (${time})` : name;
        })
        .filter(Boolean) as string[];

      if (parts.length) stopsText = parts.join(", ");
    }

    const priceLabel = formatPrice(trip.price_from ?? null);

    const departures =
      depRows?.map((row: any) => {
        const iso = row.depart_date as string | null;
        const dateLabel = iso ? formatDateLabel(iso) : "";

        const total =
          typeof row.seats_total === "number" ? row.seats_total : null;
        const reserved =
          typeof row.seats_reserved === "number" ? row.seats_reserved : 0;
        const left =
          total != null ? Math.max(total - reserved, 0) : null;

        let status: "available" | "full" | "waitlist" = "available";
        let seatsLabel = "";

        if (row.status === "waitlist") {
          status = "waitlist";
          seatsLabel = "Väntelista";
        } else if (row.status === "full" || (left != null && left <= 0)) {
          status = "full";
          seatsLabel = "Slut";
        } else {
          status = "available";
          if (left == null) {
            seatsLabel = ">8";
          } else if (left > 8) {
            seatsLabel = ">8";
          } else {
            seatsLabel = String(left);
          }
        }

        return {
          id: row.id as string,
          dateLabel,
          lineLabel,
          title: trip.title as string,
          priceLabel,
          seatsLabel,
          status,
          stopsText,
        };
      }) ?? [];

    return res.status(200).json({
      ok: true,
      trip: {
        id: trip.id,
        title: trip.title,
        subtitle: trip.subtitle ?? null,
      },
      departures,
    });
  } catch (e: any) {
    console.error("widget unexpected error:", e);
    return res.status(500).json({
      ok: false,
      error: e?.message || "Tekniskt fel.",
    });
  }
}
