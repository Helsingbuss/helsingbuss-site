// src/pages/api/sundra/admin/departures/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

const DEP_TABLE = "trip_departures";
const OP_TABLE = "operators";

const COL_OPERATOR_ID = "operator_id";
const COL_OPERATOR_LABEL = "line_name";
const COL_DATE = "depart_date";
const COL_TIME = "dep_time";
const COL_SEATS_TOTAL = "seats_total";

function pickOperatorLabel(op: any): string {
  return (
    op?.display_name ||
    op?.name ||
    op?.company_name ||
    op?.company ||
    op?.title ||
    op?.email ||
    op?.id ||
    "—"
  );
}

function numOrNull(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const depId = String(req.query.id || "");
  if (!depId) return res.status(400).json({ error: "Missing id" });

  if (req.method === "PUT") {
    const body = req.body ?? {};

    const patch: any = {};
    if (body.depart_date ?? body.date) patch[COL_DATE] = String(body.depart_date ?? body.date).trim();
    if (body.dep_time !== undefined || body.time !== undefined) patch[COL_TIME] = body.dep_time ?? body.time ?? null;
    if (body.seats_total !== undefined || body.seatsTotal !== undefined || body.seats !== undefined) {
      patch[COL_SEATS_TOTAL] = numOrNull(body.seats_total ?? body.seatsTotal ?? body.seats);
    }

    // operator
    if (body.operator_id !== undefined || body.operatorId !== undefined) {
      patch[COL_OPERATOR_ID] = body.operator_id ?? body.operatorId ?? null;
    }
    if (body.line_name !== undefined || body.operatorLabel !== undefined || body.operator_name !== undefined) {
      const v = body.line_name ?? body.operatorLabel ?? body.operator_name ?? null;
      patch[COL_OPERATOR_LABEL] = v ? String(v) : null;
    }

    const { data, error } = await supabaseAdmin.from(DEP_TABLE).update(patch).eq("id", depId).select("*").single();
    if (error) return res.status(500).json({ error: error.message });

    // enrich
    let operator = null;
    let operatorLabel = (data as any)?.[COL_OPERATOR_LABEL] ?? null;

    if ((data as any)?.[COL_OPERATOR_ID]) {
      const opId = String((data as any)[COL_OPERATOR_ID]);
      const { data: op } = await supabaseAdmin.from(OP_TABLE).select("*").eq("id", opId).single();
      if (op) {
        operator = { id: opId, label: pickOperatorLabel(op) };
        operatorLabel = pickOperatorLabel(op);
      }
    }

    return res.status(200).json({ departure: { ...data, operator, operatorLabel } });
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin.from(DEP_TABLE).delete().eq("id", depId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "PUT,DELETE");
  return res.status(405).end("Method Not Allowed");
}
