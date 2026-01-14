// src/pages/api/sundra/admin/trips/[tripId]/departures.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { _supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

type OperatorRecord = {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  is_active: boolean;
};

type DepartureRow = {
  id: string;
  trip_id: string;

  // db fält (vi tar det vi behöver)
  depart_date: string; // date
  dep_time: string | null; // time
  seats_total: number | null;
  seats_reserved: number | null;
  status: "open" | "few" | "sold_out" | "cancelled";
  operator_id: string | null;

  // fallback (om du använder gamla fält i UI)
  line_name: string | null;

  // extra fält kan finnas, men vi bryr oss inte här
  [k: string]: any;
};

function isUuid(v: any) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function json(res: NextApiResponse, status: number, data: any) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function bodyToObject(req: NextApiRequest): any {
  const b: any = req.body;
  if (!b) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b;
}

async function fetchOperatorsMap(operatorIds: string[]) {
  const ids = Array.from(new Set(operatorIds.filter(Boolean)));
  if (ids.length === 0) return new Map<string, OperatorRecord>();

  const { data, error } = await _supabaseAdmin
    .from("operators")
    .select("id,name,short_name,logo_url,is_active")
    .in("id", ids);

  if (error) throw new Error(error.message);

  const map = new Map<string, OperatorRecord>();
  (data ?? []).forEach((o: any) => map.set(o.id, o as OperatorRecord));
  return map;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tripId = String(req.query.tripId ?? "");

  if (!isUuid(tripId)) {
    return json(res, 400, { ok: false, error: `Ogiltigt tripId (uuid krävs): "${tripId}"` });
  }

  try {
    // ---------------- GET: lista avgångar ----------------
    if (req.method === "GET") {
      const { data, error } = await _supabaseAdmin
        .from("trip_departures")
        .select("id,trip_id,depart_date,dep_time,seats_total,seats_reserved,status,operator_id,line_name")
        .eq("trip_id", tripId)
        .order("depart_date", { ascending: true })
        .order("dep_time", { ascending: true, nullsFirst: true });

      if (error) throw new Error(error.message);

      const departures = (data ?? []) as DepartureRow[];

      // ✅ Manuell join: operators via operator_id
      const operatorIds = departures.map((d) => d.operator_id).filter(Boolean) as string[];
      const opMap = await fetchOperatorsMap(operatorIds);

      const merged = departures.map((d) => {
        const op = d.operator_id ? opMap.get(d.operator_id) ?? null : null;
        return {
          ...d,
          operator: op,
          operator_label: op ? (op.short_name || op.name) : (d.line_name ?? null),
        };
      });

      return json(res, 200, { ok: true, departures: merged });
    }

    // ---------------- POST: skapa avgång ----------------
    if (req.method === "POST") {
      const body = bodyToObject(req);

      const depart_date = String(body?.depart_date ?? "").trim();
      if (!depart_date) {
        return json(res, 400, { ok: false, error: "depart_date saknas (YYYY-MM-DD)" });
      }

      const payload: any = {
        trip_id: tripId,
        depart_date,
        dep_time: body?.dep_time ?? null,
        seats_total: body?.seats_total ?? 0,
        seats_reserved: body?.seats_reserved ?? 0,
        status: body?.status ?? "open",
        operator_id: body?.operator_id ?? null,
        line_name: body?.line_name ?? null,
      };

      const { data, error } = await _supabaseAdmin
        .from("trip_departures")
        .insert(payload)
        .select("id,trip_id,depart_date,dep_time,seats_total,seats_reserved,status,operator_id,line_name")
        .single();

      if (error) throw new Error(error.message);

      const dep = data as DepartureRow;

      const opMap = await fetchOperatorsMap(dep.operator_id ? [dep.operator_id] : []);
      const op = dep.operator_id ? opMap.get(dep.operator_id) ?? null : null;

      return json(res, 200, {
        ok: true,
        departure: {
          ...dep,
          operator: op,
          operator_label: op ? (op.short_name || op.name) : (dep.line_name ?? null),
        },
      });
    }

    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, error: `Method ${req.method} not allowed` });
  } catch (e: any) {
    return json(res, 500, { ok: false, error: e?.message ?? "Server error" });
  }
}
