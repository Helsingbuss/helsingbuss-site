// src/lib/sendOfferMail.ts
import { sendMailWithOfferMirror } from "@/lib/sendMail";
import { sendMailWithOfferMirror, customerBaseUrl } from "@/lib/sendMail";

type SendOfferParams = {
  offerId: string;           // uuid i DB (för interna länkar om du vill)
  offerNumber: string;       // t.ex. HB25010
  customerEmail: string;     // mottagare (kund)
  customerName?: string | null;
  customerPhone?: string | null;

  from?: string | null;
  to?: string | null;
  date?: string | null;
  time?: string | null;
  passengers?: number | null;
  via?: string | null;
  onboardContact?: string | null;

  return_from?: string | null;
  return_to?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  notes?: string | null;
};

function row(label: string, value?: string | number | null) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  return `
    <tr>
      <td style="padding:4px 0;color:#0f172a80;font-size:12px;width:42%">${label}</td>
      <td style="padding:4px 0;color:#0f172a;font-size:14px">${String(value)}</td>
    </tr>`;
}

export async function sendOfferMail(p: SendOfferParams) {
  const base = customerBaseUrl(); // t.ex. https://kund.helsingbuss.se
  // Publik vy av “inkommen” offert (justera path om din publiklänk skiljer sig)
  const link = `${base}/offert/${encodeURIComponent(p.offerNumber)}?view=inkommen`;

  const subject = `Tack för din offertförfrågan – ${p.offerNumber}`;

  const html = `<!doctype html>
<html lang="sv">
  <body style="margin:0;padding:24px;background:#f5f4f0">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr><td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px">
          <tr>
            <td style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
              <h1 style="margin:0 0 12px 0;font-size:20px;color:#0f172a">Vi har tagit emot er offertförfrågan</h1>
              <p style="margin:0 0 12px 0;color:#0f172a80">
                Tack ${p.customerName ? `${p.customerName}` : ""}! Ni kan granska uppgifterna och följa status via knappen nedan.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px">
                ${row("Offertnummer", p.offerNumber)}
                ${row("Kontaktperson", p.customerName)}
                ${row("Telefon", p.customerPhone)}
                ${row("Från", p.from)}
                ${row("Till", p.to)}
                ${row("Datum", p.date)}
                ${row("Tid", p.time)}
                ${row("Passagerare", p.passengers ?? undefined)}
                ${row("Via", p.via)}
                ${row("Kontakt ombord", p.onboardContact)}
                ${row("Retur från", p.return_from)}
                ${row("Retur till", p.return_to)}
                ${row("Retur datum", p.return_date)}
                ${row("Retur tid", p.return_time)}
                ${row("Övrigt", p.notes)}
              </table>

              <div style="margin-top:16px">
                <a href="${link}" style="display:inline-block;background:#194C66;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-size:14px">
                  Öppna offerten (${p.offerNumber})
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  // Viktigt: använd BCC-spegel så Offert@ alltid får kopia
  return sendMailWithOfferMirror({
    to: p.customerEmail,
    subject,
    html,
    // replyTo sätts redan till SUPPORT_INBOX i sendMail.ts (fallback),
    // men vill du skriva över:
    // replyTo: "kundteam@helsingbuss.se",
  });
}
