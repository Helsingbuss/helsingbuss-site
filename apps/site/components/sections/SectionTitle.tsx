import React from "react";

export default function SectionTitle() {
  const title = "Bekväma bussresor skräddarsydda för dig";
  const subtitle =
    "Trygg beställningstrafik för små och stora grupper, med paketresor som gör allt enklare.";

  return (
    <section style={styles.wrap}>
      <div style={styles.inner}>
        <div style={styles.goldLine} aria-hidden="true" />
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: "100%",
    padding: "54px 16px 18px",
  },
  inner: {
    maxWidth: 1320,
    margin: "0 auto",
    textAlign: "center",
  },
  goldLine: {
    width: 64,
    height: 3,
    margin: "0 auto 14px",
    borderRadius: 999,
    // mjukare premium-känsla (inte hårda kanter)
    background:
      "linear-gradient(90deg, rgba(196,154,72,0) 0%, rgba(196,154,72,0.95) 35%, rgba(255,229,167,0.95) 50%, rgba(196,154,72,0.95) 65%, rgba(196,154,72,0) 100%)",
    filter: "blur(0.35px)",
    opacity: 0.95,
  },
  title: {
    margin: 0,
    fontWeight: 800,
    fontSize: "clamp(24px, 2.6vw, 38px)",
    letterSpacing: "-0.02em",
    color: "#0B1220",
  },
  subtitle: {
    margin: "12px auto 0",
    maxWidth: 860,
    fontSize: "clamp(14px, 1.25vw, 16px)",
    lineHeight: 1.55,
    color: "rgba(11,18,32,0.72)",
  },
};
