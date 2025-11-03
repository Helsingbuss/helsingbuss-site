// src/pages/api/offers/options.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const search = (req.query.search as string | undefined)?.trim() || "";

    let q = supabase
      .from("offers")
      .select(
        [
          "id",
          "offer_number",
          "contact_person",
          "contact_email",
          "contact_phone",
          "passengers",
          "notes",
          "departure_place",
          "destination",
          "departure_date",
          "departure_time",
          "return_departure",
          "return_destination",
          "return_date",
          "return_time",
        ].join(",")
      )
      .order("offer_number", { ascending: false })
      .limit(50);

    if (search) {
      // sök i de vanligaste fälten
      q = q.or(
        [
          `offer_number.ilike.%${search}%`,
          `contact_person.ilike.%${search}%`,
          `contact_email.ilike.%${search}%`,
          `departure_place.ilike.%${search}%`,
          `destination.ilike.%${search}%`,
          // om du klistrar in ett UUID
          `id.eq.${search}`,
        ].join(",")
      );
    }

    const { data, error } = await q;
    if (error) throw error;

    const options = (data ?? []).map((o) => {
      const num = o.offer_number || "HB—";
      const date = o.departure_date || "";
      const time = (o.departure_time || "").slice(0, 5);
      const from = o.departure_place || "—";
      const to = o.destination || "—";

      return {
        id: o.id as string,
        label: `${num} — ${from} → ${to} ${date ? `(${date}${time ? " " + time : ""})` : ""}`,
        // allt vi behöver för att auto-fylla i bokningen
        autofill: {
          contact_person: o.contact_person ?? null,
          contact_email: o.contact_email ?? null,
          contact_phone: o.contact_phone ?? null,
          passengers: o.passengers ?? null,
          notes: o.notes ?? null,

          out_from: o.departure_place ?? null,
          out_to: o.destination ?? null,
          out_date: o.departure_date ?? null,
          out_time: (o.departure_time ?? "").slice(0, 5) || null,

          ret_from: o.return_departure ?? null,
          ret_to: o.return_destination ?? null,
          ret_date: o.return_date ?? null,
          ret_time: (o.return_time ?? "").slice(0, 5) || null,
        },
      };
    });

    return res.status(200).json({ options });
  } catch (e: any) {
    console.error("/api/offers/options error:", e?.message || e);
    return res.status(200).json({ options: [] });
  }
}
