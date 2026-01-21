"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";

type Props = { open: boolean; onClose: () => void };
type Item = { label: string; href: string };
type Group = { label: string; items: Item[] };

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        marginLeft: 10,
        width: 18,
        textAlign: "center",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 180ms ease",
        opacity: 0.9,
      }}
    >
      
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function OffcanvasMenu({ open, onClose }: Props) {
  // EXAKT din menystruktur
  const groups = useMemo(
    () => [
      {
        label: "Vår verksamhet",
        items: [
          { label: "Beställningstrafik", href: "/tjanster" },
          { label: "Expressbusstrafik", href: "/express" },
        ],
      } satisfies Group,
      {
        label: "Om oss",
        items: [
          { label: "Miljö och hållbarhet", href: "/hallbarhet" },
          { label: "Integritetspolicy", href: "/integritetspolicy" },
          { label: "Profilmanual", href: "/profilmanual" },
          { label: "Ledningsgrupp", href: "/ledning" },
          { label: "Ägare", href: "/agare" },
        ],
      } satisfies Group,
      {
        label: "Kontakta oss",
        items: [{ label: "Reklamation", href: "/reklamation" }],
      } satisfies Group,
    ],
    []
  );

  // Enkla länkar (samma typografi)
  const links = useMemo(
    () => [
      { label: "Våra resor", href: "/resor" },
      { label: "Karriär", href: "/karriar" },
    ],
    []
  );

  const [openKey, setOpenKey] = useState<string | null>("Vår verksamhet");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // --- EN typografi för ALLT ---
  const FONT_SIZE = 18;   // justera om du vill större/mindre
  const FONT_WEIGHT = 700;

  const accent = "#1fb6a6"; // turkos/grön som din meny
  const white = "rgba(255,255,255,0.92)";

  return (
    <>
      <button
        aria-label="Stäng meny"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          border: "none",
          padding: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.35)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(520px, 94vw)",
          background: "#0c3a4a",
          color: "white",
          zIndex: 1001,

          padding: 26,

          transform: open ? "translateX(0)" : "translateX(18px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 200ms ease, opacity 200ms ease",
          willChange: "transform, opacity",

          fontFamily: "var(--hb-menu)",
          fontWeight: FONT_WEIGHT,

          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Stäng"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 42,
            height: 42,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "transparent",
            color: "white",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          
        </button>

        {/* Logo */}
        <div style={{ paddingTop: 4, paddingBottom: 14 }}>
          <Image
            src="/brand/vit_logo.png"
            alt="Helsingbuss"
            width={260}
            height={56}
            priority
            style={{ height: 44, width: "auto", objectFit: "contain" }}
          />
        </div>

        {/* MENU */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
          {/* Dropdown-grupper */}
          {groups.map((g) => {
            const isOpen = openKey === g.label;
            return (
              <div key={g.label} style={{ padding: "10px 0" }}>
                <button
                  onClick={() => setOpenKey(isOpen ? null : g.label)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,

                    display: "flex",
                    alignItems: "center",

                    fontSize: FONT_SIZE,
                    fontWeight: FONT_WEIGHT,
                    color: accent, // rubriker turkos som din meny
                    lineHeight: 1.15,
                  }}
                >
                  <span>{g.label}</span>
                  <Chevron open={isOpen} />
                </button>

                {isOpen && (
                  <div style={{ paddingTop: 12, display: "grid", gap: 12 }}>
                    {g.items.map((it) => (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={onClose}
                        style={{
                          textDecoration: "none",
                          fontSize: FONT_SIZE,
                          fontWeight: FONT_WEIGHT,
                          color: white,
                          lineHeight: 1.15,
                        }}
                      >
                        {it.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Enkla länkar */}
          <div style={{ paddingTop: 10, display: "grid", gap: 18 }}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                style={{
                  textDecoration: "none",
                  fontSize: FONT_SIZE,
                  fontWeight: FONT_WEIGHT,
                  color: white,
                  lineHeight: 1.15,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* SÖK */}
        <div style={{ paddingTop: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <input
              placeholder="Vad letar du efter?"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: 15,
                fontWeight: FONT_WEIGHT,
              }}
            />
            <button
              aria-label="Sök"
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: "transparent",
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <SearchIcon />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default OffcanvasMenu;

