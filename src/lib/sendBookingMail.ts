// src/lib/sendBookingMail.ts
import { sendBookingMail as coreSendBookingMail } from "@/lib/sendMail";

export type SendBookingParams = {
  to: string;                 // kundens e-post
  bookingNumber: string;      // t.ex. BK25xxxx
  mode?: "created" | "updated";

  // valfria toppnivå-fält (fallback från äldre anrop)
  passengers?: number | null;
  from?: string | null;
  toPlace?: string | null;    // <-- behålls för kompatibilitet (fallback)
  date?: string | null;
  time?: string | null;

  // primära strukturer (som din kod använder)
  out?: { date?: string | null; time?: string | null; from?: string | null; to?: string | null };
  ret?: { date?: string | null; time?: string | null; from?: string | null; to?: string | null };

  freeTextHtml?: string;
};

  // fallback-fÃ¤lt om du rÃ¥kar skicka dem platt
  from?: string | null;
  toPlace?: string | null;
  date?: string | null;
  time?: string | null;

  freeTextHtml?: string;      // valfri extra text
};

export async function sendBookingMail(p: SendBookingParams) {
  // behÃ¥ll default-beteende: "created" om inget anges
  const mode = p.mode ?? "created";

  // mappa till den nya funktionen som tar positionella argument + details-objekt
  return coreSendBookingMail(
    p.to,
    p.bookingNumber,
    mode,
    {
      passengers: p.passengers ?? null,
      from: p.out?.from ?? p.from ?? null,
      to:   p.out?.to ?? p.toPlace ?? null,
      date: p.out?.date ?? p.date ?? null,
      time: p.out?.time ?? p.time ?? null,
      freeTextHtml: p.freeTextHtml,
    }
  );
}



