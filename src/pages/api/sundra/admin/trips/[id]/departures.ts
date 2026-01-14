// src/pages/api/sundra/admin/trips/[id]/departures.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/sundra/supabaseAdmin";

const DEP_TABLE = "trip_departures";
const OP_TABLE = "operators";

// kolumner i trip_departures (byt om dina heter annorlunda)
const COL_TRIP_ID = "trip_id";
const COL_OPERATOR_ID = "operator_id"; // används om den finns
const COL_OPERATOR_LABEL = "line_name"; // "Vem kör" text (du använde line_name tidigare)
const COL_DATE = "depart_date";
const COL_TIME = "dep_time";
const COL_SEATS_TOTAL = "seats_total";

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function pickOperatorLabel(op: any): string {
  // välj en label utan att anta exakt kolumnnamn
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
  const tripId = String(req.query.id || "");
  if (!tripId) return res.status(400).json({ error: "Missing trip id" });

  if (req.method === "GET") {
    // 1) hämta avgångar utan join
    const { data: deps, error: depErr } = await supabaseAdmin
      .from(DEP_TABLE)
      .select("*")
      .eq(COL_TRIP_ID, tripId)
      .order(COL_DATE, { ascending: true })
      .order(COL_TIME, { ascending: true });

    if (depErr) return res.status(500).json({ error: depErr.message });

    const rows = deps ?? [];

    // 2) hämta operators separat (om operator_id finns i rows)
    const operatorIds = uniq(
      rows
        .map((r: any) => r?.[COL_OPERATOR_ID])
        .filter(Boolean)
        .map((x: any) => String(x))
    );

    let opMap = new Map<string, any>();
    if (operatorIds.length) {
      const { data: ops, error: opErr } = await supabaseAdmin
        .from(OP_TABLE)
        .select("*")
        .in("id", operatorIds);

      if (!opErr && ops) {
        for (const op of ops as any[]) opMap.set(String(op.id), op);
      }
    }

    // 3) mappa ihop
    const mapped = rows.map((r: any) => {
      const opId = r?.[COL_OPERATOR_ID] ? String(r[COL_OPERATOR_ID]) : null;
      const op = opId ? opMap.get(opId) : null;

      return {
        ...r,
        operatorLabel: op ? pickOperatorLabel(op) : (r?.[COL_OPERATOR_LABEL] ?? null),
        operator: op ? { id: opId, label: pickOperatorLabel(op) } : null,
      };
    });

    return res.status(200).json({ departures: mapped });
  }

  if (req.method === "POST") {
    const body = req.body ?? {};

    const depart_date = String(body.depart_date ?? body.date ?? "").trim();
    if (!depart_date) return res.status(400).json({ error: "Missing depart_date" });

    const payload: any = {
      [COL_TRIP_ID]: tripId,
      [COL_DATE]: depart_date,
      [COL_TIME]: (body.dep_time ?? body.time ?? null) ? String(body.dep_time ?? body.time) : null,
      [COL_SEATS_TOTAL]: numOrNull(body.seats_total ?? body.seatsTotal ?? body.seats),
    };

    // operator (stöd både id + text)
    const operator_id = body.operator_id ?? body.operatorId ?? null;
    const operator_label = body.line_name ?? body.operatorLabel ?? body.operator_name ?? null;

    // OBS: om din tabell INTE har operator_id/line_name så byt kolumnnamn längst upp
    if (operator_id) payload[COL_OPERATOR_ID] = operator_id;
    if (operator_label) payload[COL_OPERATOR_LABEL] = String(operator_label);

    const { data, error } = await supabaseAdmin.from(DEP_TABLE).insert(payload).select("*").single();
    if (error) return res.status(500).json({ error: error.message });

    // enrich operator om möjligt
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

  res.setHeader("Allow", "GET,POST");
  return res.status(405).end("Method Not Allowed");
}
