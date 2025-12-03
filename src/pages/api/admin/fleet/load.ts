import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

type OperatorRow = {
  id: string;
  name: string;
  code?: string | null;
};

type BusModelRow = {
  id: string;
  name: string;
  capacity: number | null;
  operator_id?: string | null;
};

type Resp = {
  ok: boolean;
  operators: OperatorRow[];
  bus_models: BusModelRow[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      operators: [],
      bus_models: [],
      error: "Method not allowed",
    });
  }

  try {
    const { data: operators, error: opErr } = await supabase
      .from("bus_operators")
      .select("id, name, code")
      .order("name", { ascending: true });

    if (opErr) throw opErr;

    const { data: busModels, error: bmErr } = await supabase
      .from("bus_models")
      .select("id, name, capacity, operator_id")
      .order("name", { ascending: true });

    if (bmErr) throw bmErr;

    return res.status(200).json({
      ok: true,
      operators: operators || [],
      bus_models: busModels || [],
    });
  } catch (e: any) {
    console.error("fleet/load error", e);
    return res.status(500).json({
      ok: false,
      operators: [],
      bus_models: [],
      error: e?.message || "Tekniskt fel.",
    });
  }
}
