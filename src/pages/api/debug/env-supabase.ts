import type { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonLen = (process.env.NEXT_PUBLIC_SUPABASE_KEY || "").length;
  const srvLen  = (process.env.SUPABASE_SERVICE_KEY || "").length;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ hasUrl, anonLen, srvLen });
}
