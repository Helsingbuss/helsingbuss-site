import type { NextApiRequest, NextApiResponse } from "next";
import { publishTrip } from "@/lib/sundra/trips/serverStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end("Method Not Allowed");
    }

    const id = req.query.id as string;
    const trip = await publishTrip(id);
    if (!trip) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ trip });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
