import type { NextApiRequest, NextApiResponse } from "next";
import { adminArchiveTrip } from "@/lib/sundra/trips/repo.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string;
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const trip = await adminArchiveTrip(id);
    return res.status(200).json({ trip });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
