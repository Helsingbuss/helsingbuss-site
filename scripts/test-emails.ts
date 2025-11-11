// scripts/test-emails.ts
/**
 * Testar e-postflöden:
 * 1) Direkt via Resend SDK
 * 2) /api/debug/email (om finns)
 * 3) /api/offert/create (kundmail + intern notis)
 * 4) /api/bookings/create (bokningsbekräftelse)
 *
 * Kör:
 *   npm i -D ts-node typescript dotenv
 *   npx ts-node scripts/test-emails.ts
 *
 * Kräver env:
 *   RESEND_API_KEY=...
 *   EMAIL_FROM="Helsingbuss <no-reply@helsingbuss.se>"
 *   EMAIL_REPLY_TO=kundteam@helsingbuss.se  (valfritt)
 *   OFFERS_INBOX=offert@helsingbuss.se     (val)
 *   SUPPORT_INBOX=kundteam@helsingbuss.se  (val)
 *   NEXT_PUBLIC_BASE_URL=http://localhost:3000  (eller din deploy-url)
 *   NEXT_PUBLIC_CUSTOMER_BASE_URL=https://kund.helsingbuss.se (rekommenderas)
 *
 * Du kan överstyra mottagare med TEST_RECIPIENT i env.
 */

import 'dotenv/config';
import { Resend } from 'resend';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const env = (v?: string | null) => (v ?? '').trim();
const lc = (v?: string | null) => env(v).toLowerCase();

const RESEND_API_KEY = env(process.env.RESEND_API_KEY);
const EMAIL_FROM     = env(process.env.EMAIL_FROM) || 'Helsingbuss <no-reply@helsingbuss.se>';
const EMAIL_REPLY_TO = env(process.env.EMAIL_REPLY_TO) || env(process.env.SUPPORT_INBOX) || 'kundteam@helsingbuss.se';

const BASE_PUBLIC =
  env(process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL) ||
  env(process.env.CUSTOMER_BASE_URL) ||
  env(process.env.NEXT_PUBLIC_BASE_URL) ||
  'http://localhost:3000';

const TEST_RECIPIENT = lc(process.env.TEST_RECIPIENT) || lc(process.env.SUPPORT_INBOX) || 'kundteam@helsingbuss.se';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function hr(title: string) {
  const line = '-'.repeat(80);
  console.log(`\n${line}\n${title}\n${line}`);
}

async function directResendTest() {
  hr('1) Direkt Resend-test');
  if (!resend) {
    console.warn('Hoppar över: RESEND_API_KEY saknas.');
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: TEST_RECIPIENT,
      reply_to: EMAIL_REPLY_TO,
      subject: '✅ Resend direkt-test (Helsingbuss)',
      html: `
        <h2>Resend direkt-test</h2>
        <p>Detta mail skickades direkt via Resend SDK från test-skriptet.</p>
        <p><b>From:</b> ${EMAIL_FROM}<br/>
           <b>To:</b> ${TEST_RECIPIENT}<br/>
           <b>Reply-To:</b> ${EMAIL_REPLY_TO}</p>
      `,
    });

    if (error) throw new Error(error.message);
    console.log('✔ Resend: OK', data?.id || '');
  } catch (e: any) {
    console.error('✗ Resend: FAIL', e?.message || e);
  }
}

async function tryFetch(url: string, init?: any) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { /* not json */ }
    return { ok: res.ok, status: res.status, body: parsed ?? text };
  } catch (e: any) {
    return { ok: false, status: 0, body: e?.message || e };
  }
}

async function debugEndpointTest() {
  hr('2) /api/debug/email (om finns)');
  const url = `${BASE_PUBLIC.replace(/\/+$/, '')}/api/debug/email`;
  const payload = {
    to: TEST_RECIPIENT,
    subject: '✅ Debug-email från test-skript',
    html: '<p>Hej! Detta är ett debug-mail från /api/debug/email.</p>',
  };

  const r = await tryFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (r.status === 404) {
    console.warn('⚠  /api/debug/email hittades inte – hoppar över.');
    return;
  }
  if (r.ok) console.log('✔ /api/debug/email: OK', r.body);
  else console.error(`✗ /api/debug/email: ${r.status}`, r.body);
}

async function offerCreateTest() {
  hr('3) /api/offert/create');
  const url = `${BASE_PUBLIC.replace(/\/+$/, '')}/api/offert/create`;
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10);

  const payload = {
    customer_name: 'Test Kund',
    customer_email: TEST_RECIPIENT,
    customer_phone: '070-123 45 67',

    customer_reference: 'Test Kontakt Ombord',
    internal_reference: 'Automatisk test',

    passengers: 22,

    departure_place: 'Helsingborg Knutpunkten',
    destination: 'Malmö C',
    departure_date: ymd,
    departure_time: '08:30',

    return_departure: 'Malmö C',
    return_destination: 'Helsingborg Knutpunkten',
    return_date: ymd,
    return_time: '17:15',

    stopover_places: 'Landskrona, Lund',
    notes: 'Detta är en automatiserad offert-test.',
  };

  const r = await tryFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (r.ok) {
    console.log('✔ /api/offert/create: OK');
    console.log('Svar:', r.body);
  } else {
    console.error(`✗ /api/offert/create: ${r.status}`, r.body);
  }
}

async function bookingCreateTest() {
  hr('4) /api/bookings/create');
  const url = `${BASE_PUBLIC.replace(/\/+$/, '')}/api/bookings/create`;
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10);

  const payload = {
    contact_person: 'Test Kund',
    customer_email: TEST_RECIPIENT,
    customer_phone: '070-123 45 67',

    passengers: 30,

    departure_place: 'Helsingborg',
    destination: 'Göteborg',
    departure_date: ymd,
    departure_time: '09:00',

    // valfri retur för test
    return_departure: 'Göteborg',
    return_destination: 'Helsingborg',
    return_date: ymd,
    return_time: '18:00',

    notes: 'Automatiserad booking-test.',
  };

  const r = await tryFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (r.ok) {
    console.log('✔ /api/bookings/create: OK');
    console.log('Svar:', r.body);
  } else {
    console.error(`✗ /api/bookings/create: ${r.status}`, r.body);
  }
}

async function main() {
  console.log('BASE_PUBLIC:', BASE_PUBLIC);
  console.log('TEST_RECIPIENT:', TEST_RECIPIENT);
  console.log('EMAIL_FROM:', EMAIL_FROM);
  console.log('EMAIL_REPLY_TO:', EMAIL_REPLY_TO);

  await directResendTest();
  await sleep(600);

  await debugEndpointTest();
  await sleep(600);

  await offerCreateTest();
  await sleep(600);

  await bookingCreateTest();
  console.log('\n✅ Klart. Kolla inkorgar (kund + offert@) och Supabase (offers/bookings).');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
