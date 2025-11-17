// src/lib/mailTemplates.ts
// Enkel HTML-generator för admin/kundmejl. Ingen React/JSX – bara strängar.

export type OfferEmailData = {
  id: string;
  number: string;

  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;

  from?: string;
  to?: string;
  date?: string;
  time?: string;
  passengers?: number;

  via?: string;
  stop?: string;

  return_from?: string;
  return_to?: string;
  return_date?: string;
  return_time?: string;

  notes?: string;

  adminUrl: string;
  customerUrl: string;

  subject?: string; // valfri överstyrning av ämnesrad
};

const BRAND_COLOR   = "#194C66";
const BRAND_BG      = "#f5f4f0";
const BRAND_BG_SOFT = "#e5eef3";

const esc = (s: any) =>
  s == null ? "" : String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));

function wrapHtml(title: string, preheader: string, body: string) {
  const pre = preheader
    ? `<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</span>`
    : "";
  return `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/>
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
  ${pre}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.05);overflow:hidden;">
        <tr>
          <td style="background:${BRAND_COLOR};padding:16px 24px;">
            <div style="color:#fff;font-weight:700;font-size:18px;line-height:24px;">Helsingbuss</div>
            <div style="color:rgba(255,255,255,.9);font-size:12px;line-height:16px;">Komfort, säkerhet och omtanke</div>
          </td>
        </tr>
        <tr><td style="padding:24px;">${body}</td></tr>
        <tr>
          <td style="background:${BRAND_BG_SOFT};padding:16px 24px;color:#194c66;font-size:12px;line-height:18px;">
            Detta e-post skickades av Helsingbuss. Behöver du hjälp?
            Svara på mailet eller kontakta kundteamet.
          </td>
        </tr>
      </table>
      <div style="color:#6b7280;font-size:11px;line-height:16px;margin-top:12px;">© ${new Date().getFullYear()} Helsingbuss</div>
    </td></tr>
  </table>
</body></html>`;
}

function sectionTitle(txt: string) {
  return `<h2 style="margin:0 0 8px 0;font-size:16px;line-height:22px;color:${BRAND_COLOR};">${esc(txt)}</h2>`;
}
function kv(label: string, value?: string | number | null) {
  if (value == null || value === "") return "";
  return `<tr>
    <td style="padding:6px 10px;width:40%;color:#374151;font-size:14px;background:#fafafa;border-bottom:1px solid #f0f0f0;">${esc(label)}</td>
    <td style="padding:6px 10px;color:#111827;font-size:14px;border-bottom:1px solid #f0f0f0;">${esc(String(value))}</td>
  </tr>`;
}
function cta(href: string, label = "Öppna") {
  return `<div style="margin:16px 0 4px 0;">
    <a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;">
      ${esc(label)}
    </a>
  </div>
  <div style="font-size:12px;color:#6b7280;margin-top:6px;word-break:break-all;">Eller kopiera länken: <span>${esc(href)}</span></div>`;
}

export function renderOfferEmail(d: OfferEmailData) {
  const nr = d.number || "—";

  const detailsTable = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin:0 0 12px 0;">
    ${kv("Offertnummer", nr)}
    ${kv("Från", d.from)}
    ${kv("Till", d.to)}
    ${kv("Avresa datum", d.date)}
    ${kv("Avresa tid", d.time)}
    ${kv("Passagerare", typeof d.passengers === "number" ? d.passengers : undefined)}
    ${kv("Via", d.via)}
    ${kv("Stopp", d.stop)}
    ${kv("Retur från", d.return_from)}
    ${kv("Retur till", d.return_to)}
    ${kv("Retur datum", d.return_date)}
    ${kv("Retur tid", d.return_time)}
  </table>`;

  const notes = d.notes
    ? `<div style="white-space:pre-wrap;color:#111827;font-size:14px;border:1px solid #eee;border-radius:10px;padding:12px;margin:0 0 12px 0;">${esc(d.notes)}</div>`
    : "";

  const contactTable = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin:0 0 12px 0;">
    ${kv("Namn / referens", d.customerName)}
    ${kv("E-post", d.customerEmail)}
    ${kv("Telefon", d.customerPhone)}
  </table>`;

  const adminBody = `
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:28px;color:#111;">Offert uppdaterad</h1>
    ${sectionTitle("Offert")}
    ${detailsTable}
    ${sectionTitle("Kontakt")}
    ${contactTable}
    ${sectionTitle("Meddelande / notering")}
    ${notes}
    ${cta(d.adminUrl, "Öppna i Admin")}
    ${cta(d.customerUrl, "Visa kundvy")}
  `;

  const customerBody = `
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:28px;color:#111;">Din offert</h1>
    ${sectionTitle("Offert")}
    ${detailsTable}
    ${sectionTitle("Kontakt")}
    ${contactTable}
    ${notes}
    ${cta(d.customerUrl, "Visa din offert")}
  `;

  const subjectAdmin   = d.subject || `Offert – ${nr}`;
  const subjectCustomer= `Din offert – ${nr}`;
  return {
    htmlForAdmin:    wrapHtml(subjectAdmin,    `Offert ${nr}`, adminBody),
    htmlForCustomer: wrapHtml(subjectCustomer, `Offert ${nr}`, customerBody),
    subjectForAdmin: subjectAdmin,
    subjectForCustomer: subjectCustomer,
  };
}
