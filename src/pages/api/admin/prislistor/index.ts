// src/pages/api/admin/prislistor/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Samma struktur som på sidan:
 * category: "bestallning" | "brollop" | "forening"
 * segment:  "sprinter" | "turistbuss" | "helturistbuss" | "dubbeldackare"
 */

type PriceCategoryKey = "bestallning" | "brollop" | "forening";
type BusTypeKey = "sprinter" | "turistbuss" | "helturistbuss" | "dubbeldackare";

interface BusTypePrice {
  grundavgift: string;
  tim_vardag: string;
  tim_kvall: string;
  tim_helg: string;
  km_0_25: string;
  km_26_100: string;
  km_101_250: string;
  km_251_plus: string;
}

type PriceFormState = Record<
  PriceCategoryKey,
  Record<BusTypeKey, BusTypePrice>
>;

type ApiResponse =
  | {
      ok: true;
      prices: Partial<PriceFormState>;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Hjälp: gör en tom struktur (om något saknas i DB)
 */
function makeEmptyPrices(): PriceFormState {
  const emptyBusType: BusTypePrice = {
    grundavgift: "",
    tim_vardag: "",
    tim_kvall: "",
    tim_helg: "",
    km_0_25: "",
    km_26_100: "",
    km_101_250: "",
    km_251_plus: "",
  };

  const makeCat = () => ({
    sprinter: { ...emptyBusType },
    turistbuss: { ...emptyBusType },
    helturistbuss: { ...emptyBusType },
    dubbeldackare: { ...emptyBusType },
  });

  return {
    bestallning: makeCat(),
    brollop: makeCat(),
    forening: makeCat(),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "Only GET is allowed on this endpoint." });
  }

  try {
    // Läs in alla profiler från Supabase
    const { data, error } = await supabaseAdmin
      .from("bus_price_profiles")
      .select(
        [
          "category",
          "segment",
          "base_fee",
          "base_fee_raw",
          "hour_weekday_day",
          "hour_weekday_day_raw",
          "hour_weekday_evening",
          "hour_weekday_evening_raw",
          "hour_weekend",
          "hour_weekend_raw",
          "km_0_25",
          "km_0_25_raw",
          "km_26_100",
          "km_26_100_raw",
          "km_101_250",
          "km_101_250_raw",
          "km_251_plus",
          "km_251_plus_raw",
        ].join(",")
      );

    if (error) {
      console.error("[prislistor/index] Supabase error:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Kunde inte läsa prislistorna från databasen.",
      });
    }

    const prices = makeEmptyPrices();

    (data || []).forEach((row: any) => {
      const cat = row.category as PriceCategoryKey;
      const seg = row.segment as BusTypeKey;

      if (!cat || !seg) return;
      if (!prices[cat] || !prices[cat][seg]) return;

      // Fallback: använd *_raw om det finns, annars numeriska värden
      const grundavgift =
        (row.base_fee_raw ?? row.base_fee)?.toString() ?? "";
      const tim_vardag =
        (row.hour_weekday_day_raw ?? row.hour_weekday_day)?.toString() ?? "";
      const tim_kvall =
        (row.hour_weekday_evening_raw ?? row.hour_weekday_evening)?.toString() ??
        "";
      const tim_helg =
        (row.hour_weekend_raw ?? row.hour_weekend)?.toString() ?? "";
      const km_0_25 =
        (row.km_0_25_raw ?? row.km_0_25)?.toString() ?? "";
      const km_26_100 =
        (row.km_26_100_raw ?? row.km_26_100)?.toString() ?? "";
      const km_101_250 =
        (row.km_101_250_raw ?? row.km_101_250)?.toString() ?? "";
      const km_251_plus =
        (row.km_251_plus_raw ?? row.km_251_plus)?.toString() ?? "";

      prices[cat][seg] = {
        grundavgift: grundavgift,
        tim_vardag: tim_vardag,
        tim_kvall: tim_kvall,
        tim_helg: tim_helg,
        km_0_25: km_0_25,
        km_26_100: km_26_100,
        km_101_250: km_101_250,
        km_251_plus: km_251_plus,
      };
    });

    return res.status(200).json({ ok: true, prices });
  } catch (e: any) {
    console.error("[prislistor/index] Fatal error:", e?.message || e);
    return res.status(500).json({
      ok: false,
      error: "Internt fel när prislistorna skulle läsas.",
    });
  }
}
