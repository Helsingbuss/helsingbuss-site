import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendDriverOrderMail } from "@/lib/sendDriverMail";

const supabase = (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id?: string };
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!id) return res.status(400).json({ error: "Saknar id" });

  const q = await supabase.from("driver_orders").select("*").eq("id", id).single();
  if (q.error || !q.data) return res.status(404).json({ error: "Körorder saknas" });

  const o = q.data;
  try {
    await sendDriverOrderMail(o.driver_email, o.id, {
      order_number: o.order_number,
      date: o.out_date,
      time: o.out_time,
      from: o.out_from,
      to: o.out_to,
      ret_date: o.ret_date,
      ret_time: o.ret_time,
      ret_from: o.ret_from,
      ret_to: o.ret_to,
      vehicle_reg: o.vehicle_reg,
      contact_name: o.contact_name,
      contact_phone: o.contact_phone,
      passengers: o.passengers,
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Kunde inte skicka om" });
  }
  return res.status(200).json({ ok: true });
}
