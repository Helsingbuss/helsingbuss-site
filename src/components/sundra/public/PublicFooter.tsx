import Link from "next/link";
import { MessageCircle } from "lucide-react";

type FooterLink = { label: string; href: string };

const col1: FooterLink[] = [
  { label: "Betalning", href: "/kundservice/betalning" },
  { label: "Delbetala räntefritt", href: "/kundservice/delbetala" },
  { label: "Resevillkor", href: "/kundservice/resevillkor" },
  { label: "Reseförsäkringar", href: "/kundservice/reseforsakringar" },
  { label: "Boka säte", href: "/kundservice/boka-sate" },
  { label: "Boka tillägg för resa", href: "/kundservice/tillagg" },
];

const col2: FooterLink[] = [
  { label: "Om Sundra", href: "/om-sundra" },
  { label: "Vi på Sundra", href: "/vi-pa-sundra" },
  { label: "Arbeta på Sundra", href: "/karriar" },
  { label: "Personuppgiftpolicy", href: "/policy/personuppgifter" },
  { label: "En del av Helsingbuss", href: "/helsingbuss" },
  { label: "Cookies", href: "/policy/cookies" },
];

const col3: FooterLink[] = [
  { label: "Vanliga frågor", href: "/kundservice/faq" },
  { label: "Helsingbuss", href: "https://www.helsingbuss.se" },
  { label: "Bokning", href: "/bokning" },
  { label: "Våra resor", href: "/resor" },
];

function FooterLinks({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="text-sm font-extrabold uppercase tracking-wide text-gray-900">
        {title}
      </div>

      <ul className="mt-4 space-y-2.5">
        {links.map((l) => {
          const external = l.href.startsWith("http");
          const cls =
            "text-sm font-semibold text-[var(--hb-primary)] hover:underline";

          return (
            <li key={l.label}>
              {external ? (
                <a href={l.href} target="_blank" rel="noreferrer" className={cls}>
                  {l.label}
                </a>
              ) : (
                <Link href={l.href} className={cls}>
                  {l.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PayLogo({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-6 w-auto object-contain"
      loading="lazy"
    />
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t bg-white">
      {/* Grön linje överst */}
      <div className="h-2 w-full" style={{ background: "var(--hb-accent)" }} />

      <div className="mx-auto max-w-[1400px] px-4 py-12">
        {/* Länkkolumner */}
        <div className="grid gap-10 md:grid-cols-3">
          <FooterLinks title="Om din resa" links={col1} />
          <FooterLinks title="Om Sundra" links={col2} />
          <FooterLinks title="Mest sökta sidor" links={col3} />
        </div>

        {/* Undersektion */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
          {/* Kontakt */}
          <div>
            <div className="text-sm font-extrabold uppercase tracking-wide text-gray-900">
              Kontakta oss
            </div>

            <div className="mt-4 text-3xl font-extrabold text-[var(--hb-accent)]">
              010 - XXX XX XX
            </div>

            <div className="mt-2 text-sm text-gray-700">
              Måndag - fredag: 09:00 - 18:00
            </div>

            <div className="mt-2">
              <Link
                href="/kundservice/oppettider"
                className="text-sm font-semibold text-[var(--hb-primary)] hover:underline"
              >
                Avvikande öppettider
              </Link>
            </div>

            {/* ✅ Knapp med ikon */}
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                onClick={() => {
                  window.location.href = "/kundservice";
                }}
              >
                <MessageCircle size={18} />
                Chatta med oss
              </button>
            </div>
          </div>

          {/* Made in + copyright */}
          <div className="flex flex-col items-center justify-end text-center">
            <div
              className="inline-block px-2 py-1 text-xl font-semibold"
              style={{
                color: "var(--hb-accent)",
                fontFamily: '"Segoe Script","Brush Script MT",cursive',
              }}
            >
              Made in Helsingborg
            </div>

            <div className="mt-3 text-sm text-gray-700">
              All rights reserved Helsingbuss (c) 2026
            </div>
          </div>

          {/* Betalning + Helsingbuss */}
          <div className="flex flex-col items-center justify-end gap-6 lg:items-end">
            <div className="text-sm font-semibold text-gray-700">
              Hos Sundra kan du betala med:
            </div>

            {/* ✅ Rätt: AE + Klarna är PNG, Swish = swish_logo.png */}
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
              <PayLogo src="/visa-logo.png" alt="Visa" />
              <PayLogo src="/mastercard-Logo.png" alt="Mastercard" />
              <PayLogo src="/american_Express.png" alt="American Express" />
              <PayLogo src="/klarna_logo.png" alt="Klarna" />
              <PayLogo src="/swish_logo.png" alt="Swish" />
            </div>

            <div className="flex flex-col items-center gap-2 lg:items-end">
              <div className="text-sm font-semibold text-gray-700">
                Sundra är en del av
              </div>

              {/* Helsingbuss logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/helsingbuss_logo_mork.png"
                alt="Helsingbuss"
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
