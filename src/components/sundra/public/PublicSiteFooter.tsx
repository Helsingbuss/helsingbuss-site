import React from "react";
import Link from "next/link";

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 19.5 4 20l.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12a7 7 0 0 1-7 7H9.5L7 19.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PublicSiteFooter() {
  const styles = {
    rootFont: {
      fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    },

    heading: {
      fontSize: "19px",
      fontWeight: 500, // Medium
      letterSpacing: "0.06em",
      color: "#111827",
      textTransform: "uppercase" as const,
    },
    link: {
      fontSize: "14px",
      fontWeight: 600, // SemiBold
      letterSpacing: "0.02em",
      color: "#1F2937",
    },

    contactHeading: {
      fontSize: "19px",
      fontWeight: 600, // SemiBold
      letterSpacing: "0.06em",
      color: "#111827",
      textTransform: "uppercase" as const,
    },
    phone: {
      fontSize: "35px",
      fontWeight: 600, // SemiBold
      lineHeight: 1.05,
      color: "var(--hb-accent)",
    },
    weekday: {
      fontSize: "15px",
      fontWeight: 500, // Medium
      color: "#1F2937",
    },
    openingLink: {
      fontSize: "14px",
      fontWeight: 600, // SemiBold
      color: "#1F2937",
    },

    payText: {
      fontSize: "13px",
      fontWeight: 500, // Medium
      color: "#111827",
    },

    made: {
      fontSize: "26px",
      fontWeight: 900,
      color: "var(--hb-accent)",
      fontFamily:
        '"Dancing Script","Pacifico","Brush Script MT",cursive, Montserrat, sans-serif',
      letterSpacing: "0.01em",
      textAlign: "center" as const,
      lineHeight: 1,
    },
    rights: {
      fontSize: "13px",
      fontWeight: 500,
      color: "#374151",
      textAlign: "center" as const,
      marginTop: "6px",
      lineHeight: 1.2,
    },
    sub: {
      fontSize: "13px",
      fontWeight: 500,
      color: "#6B7280",
    },
  };

  // ✅ Bytt plats: AE före Swish (så Swish hamnar sist)
  // ✅ AE större
  const paymentLogos: Array<{ src: string; alt: string; imgClass?: string }> = [
    { src: "/visa-logo.png", alt: "Visa", imgClass: "h-6" },
    { src: "/mastercard-Logo.png", alt: "Mastercard", imgClass: "h-6" },
    { src: "/klarna_logo.png", alt: "Klarna", imgClass: "h-7" },
    { src: "/american_Express.png", alt: "American Express", imgClass: "h-8" }, // ✅ större
    { src: "/swish_logo.png", alt: "Swish", imgClass: "h-7" },
  ];

  function openChat() {
    // Kopplas senare till chat-widget (ruta uppe till höger).
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sundra:open-chat"));
    }
  }

  // ✅ Hover: endast färgbyte, ingen underline
  const linkCls =
    "inline-flex rounded transition-colors hover:text-[var(--hb-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--hb-accent)]/30";

  return (
    <footer className="bg-white" style={styles.rootFont}>
      {/* ✅ tjockare grön linje */}
      <div className="w-full" style={{ height: 14, background: "var(--hb-accent)" }} />

      <div className="mx-auto max-w-[1400px] px-6">
        {/* ✅ Mer luft från gröna linjen */}
        <div className="grid gap-10 pt-10 md:grid-cols-3">
          {/* Kolumn 1 */}
          <div>
            <div style={styles.heading}>OM DIN RESA</div>

            <ul className="mt-3 space-y-1">
              <li>
                <Link className={linkCls} style={styles.link} href="/betalning">
                  Betalning
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/delbetala">
                  Delbetala räntefritt
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/resevillkor">
                  Resevillkor
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/reseforsakringar">
                  Reseförsäkringar
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/boka-sate">
                  Boka säte
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/boka-tillagg">
                  Boka tillägg för resa
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <div style={styles.contactHeading}>KONTAKTA OSS</div>

              <div className="mt-3" style={styles.phone}>
                010 - XXX XX XX
              </div>

              <div className="mt-2" style={styles.weekday}>
                Måndag - fredag: 09.00 - 18.00
              </div>

              <div className="mt-2">
                <Link className={linkCls} style={styles.openingLink} href="/oppettider">
                  Avvikande öppettider
                </Link>
              </div>
            </div>
          </div>

          {/* Kolumn 2 */}
          <div>
            <div style={styles.heading}>OM SUNDRA</div>

            <ul className="mt-3 space-y-1">
              <li>
                <Link className={linkCls} style={styles.link} href="/om-sundra">
                  Om Sundra
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/vi-pa-sundra">
                  Vi på Sundra
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/jobba-hos-oss">
                  Arbeta på Sundra
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/personuppgiftpolicy">
                  Personuppgiftpolicy
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/en-del-av-helsingbuss">
                  En del av Helsingbuss
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/cookies">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolumn 3 */}
          <div>
            <div style={styles.heading}>MEST SÖKTA SIDOR</div>

            <ul className="mt-3 space-y-1">
              <li>
                <Link className={linkCls} style={styles.link} href="/vanliga-fragor">
                  Vanliga frågor
                </Link>
              </li>
              <li>
                <a
                  className={linkCls}
                  style={styles.link}
                  href="https://www.helsingbuss.se"
                  target="_blank"
                  rel="noreferrer"
                >
                  Helsingbuss
                </a>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/resor">
                  Bokning
                </Link>
              </li>
              <li>
                <Link className={linkCls} style={styles.link} href="/resor">
                  Våra resor
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <div style={styles.payText}>Hos Sundra kan du betala med:</div>

              {/* ✅ Grid så det blir jämnt och snyggt (och "kant till kant"-känsla) */}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {paymentLogos.map((p) => (
                  <span
                    key={p.alt}
                    className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt={p.alt}
                      className={["w-auto object-contain", p.imgClass ?? "h-6"].join(" ")}
                      loading="lazy"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-rad */}
        <div className="mt-6 pb-4">
          <div className="grid items-end gap-6 md:grid-cols-3">
            {/* Vänster */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={openChat}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[14px] font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <ChatIcon />
                Chatta med oss
              </button>
            </div>

            {/* Center */}
            <div>
              <div style={styles.made}>Made in Helsingborg</div>
              <div style={styles.rights}>All rights reserved Helsingbuss © 2026</div>
            </div>

            {/* Höger */}
            <div className="flex items-end justify-end">
              <div className="text-right">
                <div style={styles.sub}>Sundra är en del av</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/helsingbuss_logo_mork.png"
                  alt="Helsingbuss"
                  className="mt-2 h-10 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
