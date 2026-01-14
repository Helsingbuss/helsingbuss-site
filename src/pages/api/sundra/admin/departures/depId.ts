// src/pages/api/sundra/admin/departures/[depId].ts
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
  depart_date: string;
  dep_time: string | null;
  seats_total: number | null;
  seats_reserved: number | null;
  status: "open" | "few" | "sold_out" | "cancelled";
  operator_id: string | null;
  line_name: string | null;
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

async function fetchOperator(opId: string | null) {
  if (!opId) return null;

  const { data, error } = await _supabaseAdmin
    .from("operators")
    .select("id,name,short_name,logo_url,is_active")
    .eq("id", opId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as OperatorRecord | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const depId = String(req.query.depId ?? "");

  if (!isUuid(depId)) {
    return json(res, 400, { ok: false, error: `Ogiltigt depId (uuid krävs): "${depId}"` });
  }

  try {
    // ------------- PUT: uppdatera -------------
    if (req.method === "PUT") {
      const body = bodyToObject(req);

      // vi tar bara fält vi tillåter att uppdateras
      const patch: any = {};

      if (body?.depart_date != null) patch.depart_date = String(body.depart_date).trim();
      if (body?.dep_time !== undefined) patch.dep_time = body.dep_time ?? null;

      if (body?.seats_total !== undefined) patch.seats_total = body.seats_total ?? 0;
      if (body?.seats_reserved !== undefined) patch.seats_reserved = body.seats_reserved ?? 0;

      if (body?.status !== undefined) patch.status = body.status;
      if (body?.operator_id !== undefined) patch.operator_id = body.operator_id ?? null;

      if (body?.line_name !== undefined) patch.line_name = body.line_name ?? null;

      const { data, error } = await _supabaseAdmin
        .from("trip_departures")
        .update(patch)
        .eq("id", depId)
        .select("id,trip_id,depart_date,dep_time,seats_total,seats_reserved,status,operator_id,line_name")
        .single();

      if (error) throw new Error(error.message);

      const dep = data as DepartureRow;
      const op = await fetchOperator(dep.operator_id);

      return json(res, 200, {
        ok: true,
        departure: {
          ...dep,
          operator: op,
          operator_label: op ? (op.short_name || op.name) : (dep.line_name ?? null),
        },
      });
    }

    // ------------- DELETE: ta bort -------------
    if (req.method === "DELETE") {
      const { error } = await _supabaseAdmin
        .from("trip_departures")
        .delete()
        .eq("id", depId);

      if (error) throw new Error(error.message);

      return json(res, 200, { ok: true });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return json(res, 405, { ok: false, error: `Method ${req.method} not allowed` });
  } catch (e: any) {
    return json(res, 500, { ok: false, error: e?.message ?? "Server error" });
  }
}
