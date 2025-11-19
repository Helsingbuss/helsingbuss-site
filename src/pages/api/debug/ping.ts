import type { NextApiRequest, NextApiResponse } from "next";

// statiskt objekt (krav i Next 16)
export const config = { runtime: "nodejs" };

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
}
