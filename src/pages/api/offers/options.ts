// src/pages/api/offers/options.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";

// fallback som i dina andra API-filer
const supabase =
  // @ts-ignore
  (admin as any).supabaseAdmin ||
  // @ts-ignore
  (admin as any).supabase ||
  // @ts-ignore
  (admin as any).default;

// Hjälpare
function s(x: any, fallback = ""): string {
  if (x === null || x === undefined) return fallback;
  return String(x);
}
function hhmm(x: any): string | null {
  const v = s(x).trim();
  if (!v) return null;
  if (v.includes(":")) return v.slice(0, 5);
  if (/^\d{3,4}$/.test(v)) {
    const HH = v.length === 3 ? `0${v[0]}` : v.slice(0, 2);
    const MM = v.slice(-2);
    return `${HH}:${MM}`;
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const search = s((req.query.search as string | undefined)?.trim() ?? "");

    // --- Viktigt ---
    // Vi väljer *alla* fält vi behöver, inkl. dina nya.
    // Om någon kolumn saknas i DB ignoreras felet inte av Supabase,
    // så se till att din offers-tabell har dessa (vi har redan skickat SQL tidigare).
    const selectCols = [
      "id",
      "offer_number",
      "status",
      "created_at",
      "offer_date",

      // Kund/kontakt
      "contact_person",
      "contact_email",
      "customer_email",
      "contact_phone",
      "customer_phone",
      "passengers",
      "notes",

      // Utresa (standard)
      "departure_place",
      "destination",
      "departure_date",
      "departure_time",
      "end_time",
      "on_site_minutes",
      "stopover_places",

      // Retur (standard)
      "return_departure",
      "return_destination",
      "return_date",
      "return_time",
      "return_end_time",
      "return_on_site_minutes",

      // --- NYA FÄLT enligt din lista ---
      "via",
      "stop",
      "enkel_tur_retur",
      "final_destination",
      "behover_buss",
      "notis_pa_plats",
      "basplats_pa_destination",
      "last_day_",
      "local_kor",
      "standby",
      "parkering",
      "namn_efternamn",
      "foretag_forening",
      "referens_po_nummer",
      "org_number",
      "contact_person_ombord",
    ].join(",");

    let q = supabase
      .from("offers")
      .select(selectCols)
      .not("status", "in", '("avbojd","makulerad")')
      .order("created_at", { ascending: false })
      .limit(20);

    if (search) {
      const term = search.replace(/%/g, "");
      q = q.or(
        [
          `offer_number.ilike.%${term}%`,
          `contact_person.ilike.%${term}%`,
          `contact_email.ilike.%${term}%`,
          `customer_email.ilike.%${term}%`,
          `departure_place.ilike.%${term}%`,
          `destination.ilike.%${term}%`,
          // extra tolerans: sök i nya fält också
          `via.ilike.%${term}%`,
          `stop.ilike.%${term}%`,
          `final_destination.ilike.%${term}%`,
          `foretag_forening.ilike.%${term}%`,
          `referens_po_nummer.ilike.%${term}%`,
        ].join(",")
      );
    }

    const { data, error } = await q;
    if (error) throw error;

    const options =
      (data ?? []).map((o: any) => {
        const num = s(o.offer_number) || s(o.id).slice(0, 8);
        const d = s(o.departure_date);
        const t = hhmm(o.departure_time) || "";
        const from = s(o.departure_place);
        const to = s(o.destination) || s(o.final_destination); // fallback till final_destination om destination saknas
        const pax = o.passengers ?? null;

        const labelParts = [
          num ? `${num}` : "",
          d || t ? `${[d, t].filter(Boolean).join(" ")}` : "",
          [from, to].filter(Boolean).join(" → "),
          pax ? `(${pax} p)` : "",
        ].filter(Boolean);

        // Toleranser/alias för nya fält
        const out_time = hhmm(o.departure_time);
        const ret_time = hhmm(o.return_time);
        const end_time = hhmm(o.end_time);
        const ret_end_time = hhmm(o.return_end_time);

        // via/stopp – använd via först, annars stopover_places, annars stop
        const via =
          (typeof o.via === "string" && o.via.length ? o.via : null) ??
          (typeof o.stopover_places === "string" && o.stopover_places.length ? o.stopover_places : null) ??
          (typeof o.stop === "string" && o.stop.length ? o.stop : null);

        // boolean/nummer-normaliseringar
        const beh_buss =
          o.behover_buss === null || o.behover_buss === undefined
            ? null
            : Boolean(o.behover_buss);

        const on_site_minutes =
          o.on_site_minutes === null || o.on_site_minutes === undefined
            ? null
            : Number(o.on_site_minutes);

        const return_on_site_minutes =
          o.return_on_site_minutes === null || o.return_on_site_minutes === undefined
            ? null
            : Number(o.return_on_site_minutes);

        const standby =
          o.standby === null || o.standby === undefined ? null : Number(o.standby);

        return {
          id: String(o.id),
          label: labelParts.join(" — "),
          autofill: {
            // Kund/kontakt
            contact_person: o.contact_person ?? o.namn_efternamn ?? null,
            contact_email: o.contact_email ?? o.customer_email ?? null,
            contact_phone: o.contact_phone ?? o.customer_phone ?? null,
            passengers: o.passengers ?? null,
            notes: o.notes ?? null,

            // Utresa standard
            out_from: o.departure_place ?? null,
            out_to: o.destination ?? o.final_destination ?? null,
            out_date: o.departure_date ?? null,
            out_time,

            // Retur standard
            ret_from: o.return_departure ?? null,
            ret_to: o.return_destination ?? null,
            ret_date: o.return_date ?? null,
            ret_time: ret_time,

            // --- Nya fält → vidare till formuläret ---
            via,                                  // fria stopp/via
            stop: typeof o.stop === "string" ? o.stop : null, // separat "stop"-fält om du vill ha det också
            enkel_tur_retur: o.enkel_tur_retur ?? null,
            final_destination: o.final_destination ?? null,

            behover_buss: beh_buss,
            notis_pa_plats: o.notis_pa_plats ?? null,
            basplats_pa_destination: o.basplats_pa_destination ?? null,

            last_day_: o.last_day_ ?? null,
            end_time, // planerad sluttid för utresa (normaliserad)
            local_kor: o.local_kor ?? null,
            standby,  // timmar

            parkering: o.parkering ?? null,

            namn_efternamn: o.namn_efternamn ?? o.contact_person ?? null,
            foretag_forening: o.foretag_forening ?? null,
            referens_po_nummer: o.referens_po_nummer ?? null,
            org_number: o.org_number ?? null,

            contact_person_ombord: o.contact_person_ombord ?? null,

            // Retur – planerad sluttid och på-plats-minuter (om du vill använda)
            return_end_time: ret_end_time,
            return_on_site_minutes,
          },
        };
      }) ?? [];

    return res.status(200).json({ options });
  } catch (e: any) {
    console.error("/api/offers/options error:", e?.message || e);
    // För att inte krascha UI vid enstaka kolumn-fel kan vi svara tom lista
    return res.status(200).json({ options: [] });
  }
}
