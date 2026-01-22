import React from "react";
import Link from "next/link";

type Card = {
  title: string;
  subtitle: string;
  text: string;
  button: string;
  href: string;
};

const cards: Card[] = [
  {
    title: "Företagsresa",
    subtitle: "Smidig transport till möten, kundevent och personaldagar.",
    text: "Vi anpassar tider, stopp och komfort – ni fokuserar på dagen.",
    button: "Läs mer",
    href: "#foretagsresa",
  },
  {
    title: "Skola & förening",
    subtitle: "Trygga resor för utflykter, cuper och läger.",
    text: "Tydlig planering, säkerhetsfokus och gott om plats för packning.",
    button: "Läs mer",
    href: "#skola-forening",
  },
  {
    title: "Event & konferens",
    subtitle: "Professionella resor med tidspassad logistik.",
    text: "Smidig upphämtning, tydliga tider och en ombordkänsla som håller ihop dagen.",
    button: "Läs mer",
    href: "#event-konferens",
  },
  {
    title: "Bröllop",
    subtitle: "Gör dagen enkel för gästerna och perfekt i tid.",
    text: "Transport mellan vigsel, fest och hotell – tryggt och bekvämt.",
    button: "Läs mer",
    href: "#brollop",
  },
  {
    title: "Sportresa",
    subtitle: "Lag- och supporterresor med smart logistik.",
    text: "Plats för utrustning och tidspassat upplägg till match eller cup.",
    button: "Läs mer",
    href: "#sportresa",
  },
  {
    title: "Transfer / Flygbuss",
    subtitle: "Smidig resa till flyg, från centrala Helsingborg.",
    text: "Boka enkelt via Helsingbuss Airport Shuttle.",
    button: "Till Airport Shuttle",
    href: "#transfer",
  },
];

export default function ServiceCards() {
  return (
    <section aria-label="Tjänster" style={{ width: "100%", padding: "0 0 34px" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          padding: "clamp(16px, 3vw, 28px) clamp(14px, 4vw, 36px)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          background:
            "radial-gradient(1200px 300px at 20% 10%, rgba(255, 236, 210, 0.55), rgba(255,255,255,0) 55%)," +
            "radial-gradient(900px 260px at 80% 0%, rgba(240, 210, 160, 0.45), rgba(255,255,255,0) 60%)," +
            "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(245,239,230,0.78))",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 80% at 50% 20%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.10) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Desktop/tablet */}
        <div
          className="hb-services-grid hb-hide-on-mobile"
          style={{
            position: "relative",
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            alignItems: "stretch",
          }}
        >
          {cards.map((c) => (
            <article
              key={c.title}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                background: "rgba(255,255,255,0.78)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
              }}
            >
              <div
                style={{
                  height: 88,
                  background:
                    "linear-gradient(135deg, rgba(25,76,102,0.12), rgba(177,227,221,0.18))",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    bottom: -18,
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                  }}
                  aria-hidden="true"
                >
                  {c.title.slice(0, 1)}
                </div>
              </div>

              <div style={{ padding: "28px 16px 16px" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{c.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: 12.5, opacity: 0.78 }}>{c.subtitle}</p>
                <p style={{ margin: "10px 0 0", fontSize: 12.5, opacity: 0.9 }}>{c.text}</p>

                <div style={{ marginTop: 12 }}>
                  <Link
                    href={c.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 34,
                      padding: "0 14px",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontWeight: 800,
                      fontSize: 12.5,
                      background: "rgba(30,30,30,0.86)",
                      color: "#fff",
                      border: "1px solid rgba(0,0,0,0.14)",
                    }}
                  >
                    {c.button}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile carousel */}
        <div
          className="hb-services-carousel hb-show-on-mobile"
          style={{
            position: "relative",
            display: "flex",
            gap: 14,
            overflowX: "auto",
            padding: "4px 2px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((c) => (
            <article
              key={"m-" + c.title}
              style={{
                flex: "0 0 auto",
                width: "78vw",
                maxWidth: 360,
                scrollSnapAlign: "start",
                borderRadius: 18,
                overflow: "hidden",
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 12px 26px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  height: 110,
                  background:
                    "linear-gradient(135deg, rgba(25,76,102,0.14), rgba(177,227,221,0.20))",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    bottom: -20,
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                  aria-hidden="true"
                >
                  {c.title.slice(0, 1)}
                </div>
              </div>

              <div style={{ padding: "30px 16px 16px" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{c.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>{c.subtitle}</p>
                <p style={{ margin: "10px 0 0", fontSize: 13, opacity: 0.92 }}>{c.text}</p>

                <div style={{ marginTop: 12 }}>
                  <Link
                    href={c.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 38,
                      padding: "0 14px",
                      borderRadius: 12,
                      textDecoration: "none",
                      fontWeight: 900,
                      fontSize: 13,
                      background: "rgba(30,30,30,0.86)",
                      color: "#fff",
                      border: "1px solid rgba(0,0,0,0.14)",
                    }}
                  >
                    {c.button}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <style>{`
          .hb-services-carousel::-webkit-scrollbar { height: 0px; }
          .hb-show-on-mobile { display: none; }
          .hb-hide-on-mobile { display: block; }
          @media (max-width: 820px) {
            .hb-hide-on-mobile { display: none; }
            .hb-show-on-mobile { display: block; }
          }
        `}</style>
      </div>
    </section>
  );
}
