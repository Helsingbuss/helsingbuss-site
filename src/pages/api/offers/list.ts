// src/pages/api/offers/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

// Tålig import – funkar oavsett export-sätt i din supabaseAdmin
const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type Row = Record<string, any>;

function isYMD(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function safeLower(x: any) {
  return String(x ?? "").toLowerCase();
}

function normalizeOffer(r: Row) {
  const offer_number =
    r.offer_number ?? r.offer_no ?? r.number ?? r.no ?? r.offerNumber ?? null;

  const hasReturn = !!(
    r.return_departure ||
    r.return_destination ||
    r.return_date ||
    r.return_time ||
    r.return_from ||
    r.return_to
  );

  return {
    id: r.id,
    offer_number,
    status: r.status ?? null,
    customer_reference: r.customer_reference ?? r.reference ?? null,
    contact_email: r.contact_email ?? r.customer_email ?? r.email ?? null,
    created_at: r.created_at ?? null,
    offer_date: r.offer_date ?? null,
    passengers: r.passengers ?? null,

    out: {
      from: r.departure_place ?? r.from ?? null,
      to: r.destination ?? r.to ?? null,
      date: r.departure_date ?? r.date ?? null,
      time: r.departure_time ?? r.time ?? null,
    },

    ret: hasReturn
      ? {
          from: r.return_departure ?? r.return_from ?? null,
          to: r.return_destination ?? r.return_to ?? null,
          date: r.return_date ?? null,
          time: r.return_time ?? null,
        }
      : null,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Supabase-admin saknas/är fel initierad" });
    }

    const search = (req.query.search as string | undefined)?.trim() || "";
    const status = safeLower(req.query.status as string | undefined);
    const from = (req.query.from as string | undefined)?.trim() || "";
    const to = (req.query.to as string | undefined)?.trim() || "";

    const page = Math.max(
      1,
      parseInt(String(req.query.page ?? "1"), 10) || 1
    );

    // Viktigt: tillåt "all" (kalendern vill ofta ha allt)
    const rawPageSize = String(req.query.pageSize ?? "20");
    const pageSize =
      rawPageSize === "all"
        ? 9999
        : Math.min(9999, Math.max(5, parseInt(rawPageSize, 10) || 20));

    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    // Primärt: server-side filter (snabbast)
    // OBS: Datumfilter ska vara på "created_at" med bara YMD för att undvika 400 pga timezone-format.
    let sel =
      "id, offer_number, status, customer_reference, contact_email, created_at, offer_date, passengers, departure_place, destination, departure_date, departure_time, return_departure, return_destination, return_date, return_time";

    let q = supabase
      .from("offers")
      .select(sel, { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);

    // ✅ robust datumfilter (ingen Z-string som kan ge 400 i vissa setups)
    if (isYMD(from)) q = q.gte("created_at", from);
    if (isYMD(to)) q = q.lte("created_at", to);

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

    const resp = await q.range(rangeFrom, rangeTo);

    // ✅ Fallback om select-listan inte matchar din tabell (kolumn saknas etc.)
    if (resp.error) {
      const fb = await supabase
        .from("offers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(rangeFrom, rangeTo);

      if (fb.error) throw fb.error;

      const rows = (fb.data as Row[]).map(normalizeOffer);

      // extra tolerant filtrering om server-or inte tog (pga okända kolumner)
      const filtered = rows.filter((r: any) => {
        const okStatus = status ? safeLower(r.status) === status : true;

        const okFrom = isYMD(from)
          ? (r.created_at ? String(r.created_at).slice(0, 10) >= from : true)
          : true;

        const okTo = isYMD(to)
          ? (r.created_at ? String(r.created_at).slice(0, 10) <= to : true)
          : true;

        const s = search.toLowerCase();
        const okSearch = s
          ? [
              r.offer_number,
              r.customer_reference,
              r.contact_email,
              r.out?.from,
              r.out?.to,
            ]
              .filter(Boolean)
              .some((x) => String(x).toLowerCase().includes(s))
          : true;

        return okStatus && okFrom && okTo && okSearch;
      });

      return res.status(200).json({
        page,
        pageSize,
        total: fb.count ?? filtered.length,
        rows: filtered,
      });
    }

    const rows = (resp.data as Row[]).map(normalizeOffer);

    return res.status(200).json({
      page,
      pageSize,
      total: resp.count ?? rows.length,
      rows,
    });
  } catch (e: any) {
    console.error("/api/offers/list error:", e?.message || e);
    return res.status(500).json({ error: "Kunde inte hämta offerter" });
  }
}
