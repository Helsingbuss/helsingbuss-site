import React from "react";
import Link from "next/link";

// =============================================
// ======= HÄR ÄNDRAR DU STORLEKAR SNABBT =======
// Desktop (dator/laptop):
const DESKTOP_CARD_MIN = 240; // min-bredd per kort
const DESKTOP_CARD_MAX = 280; // max-bredd per kort
const DESKTOP_GAP = 18;       // <-- DU VILLE HA 18 mellan varje box

// Mobil (karusell):
const MOBILE_CARD_WIDTH = 300; // fast bredd så alla blir lika stora
const MOBILE_CARD_MIN_H = 260; // fast höjd-ish (alla lika stora)
const IMAGE_H = 100;           // bildhöjd (påverkar även ikonens placering)
const ICON_SIZE = 46;          // ikon-cirkel storlek
const ICON_IMG = 26;           // <-- ikonens bildstorlek (lite större)
// =============================================

type CardItem = {
  title: string;
  textTop: string;
  textBottom: string;
  buttonText: string;
  href: string;
  iconSrc: string; // /brand/icons/...
};

const items: CardItem[] = [
  {
    title: "Företagsresa",
    textTop: "Smidig transport till möten, kundevent och personaldagar.",
    textBottom: "Vi anpassar tider, stopp och komfort – ni fokuserar på dagen.",
    buttonText: "Läs mer",
    href: "/tjanster/foretagsresa",
    iconSrc: "/brand/icons/trust-alt.png",
  },
  {
    title: "Skola & förening",
    textTop: "Trygga resor för utflykter, cuper och läger.",
    textBottom: "Tydlig planering, säkerhetsfokus och gott om plats för packning.",
    buttonText: "Läs mer",
    href: "/tjanster/skola-forening",
    iconSrc: "/brand/icons/workshop.png",
  },
  {
    title: "Bröllop",
    textTop: "Gör dagen enkel för gästerna och perfekt i tid.",
    textBottom: "Transport mellan vigsel, fest och hotell – tryggt och bekvämt.",
    buttonText: "Läs mer",
    href: "/tjanster/brollop",
    iconSrc: "/brand/icons/rings-wedding.png",
  },
  {
    title: "Sportresa",
    textTop: "Lag- och supporterresor med smart logistik.",
    textBottom: "Plats för utrustning och tidspassat upplägg till match eller cup.",
    buttonText: "Läs mer",
    href: "/tjanster/sportresa",
    iconSrc: "/brand/icons/running.png",
  },
  {
    title: "Transfer / Flygbuss",
    textTop: "Smidig resa till flyg, från centrala Helsingborg.",
    textBottom: "Boka enkelt via Helsingbuss Airport Shuttle.",
    buttonText: "Till Airport Shuttle",
    href: "https://hbshuttle.se",
    iconSrc: "/brand/icons/airplane-journey.png",
  },
];

export default function ServiceCards() {
  const sectionStyle: React.CSSProperties = {
    width: "100%",
    overflowX: "clip",
  };

  // Center: maxWidth + auto margin => hela sektionen centrerad
  const innerStyle: React.CSSProperties = {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "0 16px 26px",
  };

  // Desktop grid: lås kolumnerna så de INTE blir utdragna (det var orsaken)
  // + center hela grid-blocket med justifyContent: "center"
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(5, minmax(${DESKTOP_CARD_MIN}px, ${DESKTOP_CARD_MAX}px))`,
    gap: DESKTOP_GAP,
    justifyContent: "center",
    alignItems: "stretch",
  };

  // Mobil karusell
  const carouselStyle: React.CSSProperties = {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    padding: "2px 2px 10px",
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorX: "contain",
  };

  return (
    <section style={sectionStyle}>
      <div style={innerStyle}>
        <div className="hb-servicecards-grid" style={gridStyle}>
          {items.map((item) => (
            <Card key={item.title} item={item} desktop />
          ))}
        </div>

        <div className="hb-servicecards-carousel" style={carouselStyle}>
          {items.map((item) => (
            <Card key={item.title + "-m"} item={item} desktop={false} />
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .hb-servicecards-grid { display: grid !important; }
          .hb-servicecards-carousel { display: none !important; }
        }
        @media (max-width: 899px) {
          .hb-servicecards-grid { display: none !important; }
          .hb-servicecards-carousel { display: flex !important; }
        }
      `}</style>
    </section>
  );
}

function Card({ item, desktop }: { item: CardItem; desktop: boolean }) {
  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    background: "rgba(255,255,255,0.86)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
    border: "1px solid rgba(255,255,255,0.65)",
    width: desktop ? "auto" : `${MOBILE_CARD_WIDTH}px`,
    minHeight: desktop ? undefined : `${MOBILE_CARD_MIN_H}px`,
    scrollSnapAlign: desktop ? undefined : "start",
  };

  const imageWrapStyle: React.CSSProperties = {
    height: IMAGE_H,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  };

  // Kant-till-kant bildyta
  const imageBgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(210,224,224,0.95), rgba(240,248,248,0.80))",
  };

  // Ikon-cirkeln: centrerad + 50/50 överlapp
  const iconCircleStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: IMAGE_H,
    transform: "translate(-50%, -50%)",
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
    display: "grid",
    placeItems: "center",
    zIndex: 3,
    border: "1px solid rgba(0,0,0,0.06)",
  };

  // Mer luft mellan cirkel och rubrik (du bad om det)
  const contentStyle: React.CSSProperties = {
    padding: "22px 18px 18px",
    paddingTop: 44,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
    margin: "12px 0 8px",
    lineHeight: 1.2,
  };

  const pStyle: React.CSSProperties = {
    margin: "0 0 10px",
    color: "rgba(17,24,39,0.72)",
    fontSize: 13.5,
    lineHeight: 1.55,
  };

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(17,24,39,0.82)",
    color: "white",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
    boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
    marginTop: 6,
  };

  const isExternal = item.href.startsWith("http");

  return (
    <div style={cardStyle}>
      <div style={imageWrapStyle}>
        <div style={imageBgStyle} />
      </div>

      <div style={iconCircleStyle}>
        {/* Vanlig img = minst strul + visar direkt om pathen stämmer */}
        <img
          src={item.iconSrc}
          alt=""
          width={ICON_IMG}
          height={ICON_IMG}
          style={{ display: "block", objectFit: "contain" }}
        />
      </div>

      <div style={contentStyle}>
        <div style={titleStyle}>{item.title}</div>

        <p style={pStyle}>{item.textTop}</p>
        <p style={pStyle}>{item.textBottom}</p>

        {isExternal ? (
          <a href={item.href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <span style={btnStyle}>{item.buttonText}</span>
          </a>
        ) : (
          <Link href={item.href} style={{ textDecoration: "none" }}>
            <span style={btnStyle}>{item.buttonText}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
