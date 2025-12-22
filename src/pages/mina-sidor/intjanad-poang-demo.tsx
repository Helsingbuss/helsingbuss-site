// src/pages/mina-sidor/intjanad-poang-demo.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  User,
  Ticket,
  MapPin,
  Star,
  Trophy,
  LogOut,
  Gift,
  Info,
  TrendingUp,
} from "lucide-react";

const fakeUser = {
  firstName: "Demo",
  lastName: "Resenär",
  email: "demo@helsingbuss.se",
  level: "Silvermedlem",
  currentPoints: 1840,
  nextLevelPoints: 2500,
};

const recentEarnings = [
  {
    id: 1,
    date: "15 dec 2025",
    description: "Shoppingresa Malmö – Gekås Ullared",
    tripType: "Linje 1 · Shoppingresa",
    points: 420,
  },
  {
    id: 2,
    date: "3 nov 2025",
    description: "Teaterresa till Vallarna Friluftsteater",
    tripType: "Teaterresa · Sommar",
    points: 600,
  },
  {
    id: 3,
    date: "10 okt 2025",
    description: "PrideXpress – Helsingborg till Stockholm Pride",
    tripType: "PrideXpress",
    points: 320,
  },
  {
    id: 4,
    date: "22 sep 2025",
    description: "Weekendkryssning med bussanslutning",
    tripType: "Kryssningsresa",
    points: 500,
  },
];

const upcomingBenefits = [
  {
    id: 1,
    label: "50 kr rabatt på valfri shoppingresa",
    needed: 2000,
  },
  {
    id: 2,
    label: "Gratis kaffe & bulle på en resa",
    needed: 2500,
  },
  {
    id: 3,
    label: "PrideXpress bonus – 100 kr rabatt",
    needed: 3000,
  },
];

export default function IntjanadPoangDemo() {
  const isDemo = true;

  const progressToNext =
    Math.max(
      0,
      Math.min(
        1,
        fakeUser.currentPoints / fakeUser.nextLevelPoints
      )
    ) * 100;

  const missingPoints = Math.max(
    0,
    fakeUser.nextLevelPoints - fakeUser.currentPoints
  );

  return (
    <>
      <Head>
        <title>Demo – Intjänad poäng | Helsingbuss</title>
      </Head>

      <div className="page">
        <div className="shell">
          {isDemo && (
            <div className="demoBanner">
              <strong>Demo-version</strong> – den här sidan visar ett exempel
              på hur <strong>Intjänad poäng</strong> kan se ut i Mina sidor.
              Inga riktiga kunduppgifter visas.
            </div>
          )}

          {/* HEADER */}
          <header className="appHeader">
            <div className="brand">
              <div className="brandMark">H</div>
              <div className="brandTextBlock">
                <span className="brandText">Helsingbuss</span>
                <span className="brandSub">Mina sidor – demo</span>
              </div>
              {isDemo && <span className="brandDemoTag">DEMO</span>}
            </div>

            <nav className="topNav">
              <Link href="#" className="topNavLink">
                Tidtabeller
              </Link>
              <Link href="#" className="topNavLink">
                Destinationer
              </Link>
              <Link href="#" className="topNavLink">
                Vanliga frågor
              </Link>
              <Link href="#" className="topNavLink">
                Kundservice
              </Link>
              <Link href="#" className="topNavButton">
                Boka resa
              </Link>
            </nav>

            <div className="userChip">
              <div className="avatar">
                {fakeUser.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="userMeta">
                <span className="userName">
                  {fakeUser.firstName} {fakeUser.lastName}
                </span>
                <span className="userLabel">{fakeUser.level}</span>
              </div>
            </div>
          </header>

          <main className="mainLayout">
            {/* SIDOMENY – samma som på tidigare demo */}
            <aside className="sideNav">
              <h2 className="sideNavTitle">Mina sidor</h2>
              <nav className="sideNavList">
                <button className="sideNavItem" type="button">
                  <User className="sideNavIcon" size={16} />
                  <span>Översikt (demo)</span>
                </button>
                <button className="sideNavItem" type="button">
                  <User className="sideNavIcon" size={16} />
                  <span>Min profil</span>
                </button>
                <button className="sideNavItem" type="button">
                  <Ticket className="sideNavIcon" size={16} />
                  <span>Mina biljetter</span>
                </button>
                <button className="sideNavItem" type="button">
                  <MapPin className="sideNavIcon" size={16} />
                  <span>Kommande resor</span>
                </button>
                <button
                  className="sideNavItem sideNavItemActive"
                  type="button"
                >
                  <Star className="sideNavIcon" size={16} />
                  <span>Intjänad poäng</span>
                </button>
                <button className="sideNavItem" type="button">
                  <Trophy className="sideNavIcon" size={16} />
                  <span>Quiz & tävlingar</span>
                </button>
                <button
                  className="sideNavItem sideNavLogout"
                  type="button"
                  onClick={() =>
                    alert(
                      "I demoversionen gör Logga ut ingenting – riktig inloggning kopplar vi på senare 🙂"
                    )
                  }
                >
                  <LogOut className="sideNavIcon" size={16} />
                  <span>Logga ut</span>
                </button>
              </nav>
            </aside>

            {/* CONTENT – INTJÄNAD POÄNG */}
            <section className="content">
              <header className="contentHeader">
                <div>
                  <p className="breadcrumb">
                    Mina sidor · Intjänad poäng {isDemo ? "· Demo" : ""}
                  </p>
                  <h1 className="contentTitle">Intjänad poäng</h1>
                  <p className="contentSub">
                    Här ser kunden hur många poäng som har samlats ihop,
                    vilken nivå medlemskapet ligger på och vilka resor som har
                    gett poäng. I skarpt läge kopplas detta mot riktiga
                    bokningar hos Helsingbuss.
                  </p>
                </div>

                <div className="tagStack">
                  <span className="tag">
                    <span className="tagDot silver" />
                    Silvermedlem · 1 000–2 499 poäng
                  </span>
                  <span className="tag">
                    <span className="tagDot gold" />
                    Guldmedlem · 2 500+ poäng
                  </span>
                </div>
              </header>

              <div className="pointsLayout">
                {/* Vänster: nuvarande saldo och progress */}
                <article className="card">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Ditt poängsaldo (demo)</h2>
                    <span className="chip">
                      <TrendingUp size={14} />
                      Uppdateras efter varje resa
                    </span>
                  </div>

                  <div className="pointsTop">
                    <div className="pointsNumberBlock">
                      <div className="pointsLabel">Aktuellt saldo</div>
                      <div className="pointsValue">
                        {fakeUser.currentPoints.toLocaleString("sv-SE")} p
                      </div>
                      <div className="pointsStatus">
                        Nivå: <strong>{fakeUser.level}</strong>
                      </div>
                    </div>

                    <div className="pointsProgressBlock">
                      <div className="pointsProgressHeader">
                        <span>Nästa nivå – Guldmedlem</span>
                        <span className="smallText">
                          {missingPoints > 0
                            ? `${missingPoints.toLocaleString(
                                "sv-SE"
                              )} poäng kvar`
                            : "Du har redan nått guldnivå i denna demo 🎉"}
                        </span>
                      </div>
                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{ width: `${progressToNext}%` }}
                        />
                      </div>
                      <div className="pointsScale">
                        <span>0 p</span>
                        <span>
                          {fakeUser.nextLevelPoints.toLocaleString("sv-SE")} p
                        </span>
                      </div>
                      <p className="cardTextMuted tiny">
                        I den riktiga versionen anpassar vi nivåerna efter ert
                        riktiga bonusprogram – t.ex. extra poäng på
                        PrideXpress-resor eller utvalda kampanjer.
                      </p>
                    </div>
                  </div>

                  <div className="benefitsSection">
                    <h3>På väg att låsa upp</h3>
                    <p className="cardTextMuted">
                      Här ser kunden exempel på förmåner som snart blir
                      tillgängliga – bra för att skapa sug efter nästa resa.
                    </p>

                    <div className="benefitList">
                      {upcomingBenefits.map((benefit) => {
                        const progress =
                          Math.max(
                            0,
                            Math.min(
                              1,
                              fakeUser.currentPoints / benefit.needed
                            )
                          ) * 100;
                        const remaining = Math.max(
                          0,
                          benefit.needed - fakeUser.currentPoints
                        );
                        const unlocked = remaining === 0;

                        return (
                          <div className="benefitItem" key={benefit.id}>
                            <div className="benefitIcon">
                              <Gift size={16} />
                            </div>
                            <div className="benefitContent">
                              <div className="benefitHeader">
                                <span className="benefitTitle">
                                  {benefit.label}
                                </span>
                                <span className="benefitNeeded">
                                  {benefit.needed.toLocaleString("sv-SE")} p
                                </span>
                              </div>
                              <div className="progressBar small">
                                <div
                                  className={
                                    "progressFill " +
                                    (unlocked ? "progressUnlocked" : "")
                                  }
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="benefitFooter">
                                {unlocked ? (
                                  <span className="unlockedText">
                                    Låst upp i denna demo – i skarpt läge visas
                                    här en knapp för att använda förmånen.
                                  </span>
                                ) : (
                                  <span className="remainingText">
                                    {remaining.toLocaleString("sv-SE")} poäng
                                    kvar
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>

                {/* Höger: historik över intjänade poäng */}
                <article className="card">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Senaste intjänade poäng</h2>
                    <span className="chip">
                      <Star size={14} />
                      1 poäng per krona (exempel)
                    </span>
                  </div>

                  <p className="cardTextMuted">
                    I skarpt läge kommer varje rad här från riktiga resor, med
                    koppling till biljett eller ordernummer.
                  </p>

                  <div className="historyTable">
                    <div className="historyHeader">
                      <span>Datum</span>
                      <span>Resa</span>
                      <span className="historyPointsCol">Poäng</span>
                    </div>
                    {recentEarnings.map((row) => (
                      <div className="historyRow" key={row.id}>
                        <div className="historyDate">{row.date}</div>
                        <div className="historyInfo">
                          <div className="historyTitle">{row.description}</div>
                          <div className="historySub">{row.tripType}</div>
                        </div>
                        <div className="historyPoints">
                          +{row.points.toLocaleString("sv-SE")} p
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="footBox">
                    <Info size={14} />
                    <p>
                      I den riktiga tjänsten kommer du också kunna se{" "}
                      <strong>hur poäng har använts</strong> – t.ex. när en
                      rabatt har dragits av på en PrideXpress-biljett eller en
                      kampanjresa.
                    </p>
                  </div>
                </article>
              </div>

              <p className="footnote">
                <Info size={13} />
                <span>
                  Poäng, nivåer och förmåner här är bara exempel. När vi går
                  skarpt kopplas sidan till ert riktiga bonusprogram hos
                  Helsingbuss.
                </span>
              </p>
            </section>
          </main>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f3f4f6;
          padding: 32px 0;
          font-family: "Open Sans", system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .demoBanner {
          font-size: 13px;
          color: #111827;
          background: #e0f2fe;
          border-radius: 999px;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
        }

        .demoBanner strong {
          font-weight: 700;
        }

        .appHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brandMark {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #007764;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
        }

        .brandTextBlock {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brandText {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .brandSub {
          font-size: 11px;
          color: #6b7280;
        }

        .brandDemoTag {
          margin-left: 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          color: #374151;
          background: #f9fafb;
        }

        .topNav {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topNavLink {
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 999px;
        }

        .topNavLink:hover {
          background: #e5e7eb;
          color: #111827;
        }

        .topNavButton {
          font-size: 13px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 999px;
          background: #007764;
          color: #ffffff;
          text-decoration: none;
        }

        .topNavButton:hover {
          background: #006254;
        }

        .userChip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        }

        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #111827;
          color: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }

        .userMeta {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .userName {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .userLabel {
          font-size: 11px;
          color: #6b7280;
        }

        .mainLayout {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          align-items: flex-start;
          gap: 24px;
        }

        .sideNav {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px 14px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .sideNavTitle {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .sideNavList {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sideNavItem {
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          padding: 6px 8px;
          border-radius: 999px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
        }

        .sideNavItem:hover {
          background: #f3f4f6;
        }

        .sideNavItemActive {
          background: #e0f2f1;
          color: #006254;
          font-weight: 600;
        }

        .sideNavIcon {
          flex-shrink: 0;
        }

        .sideNavLogout {
          margin-top: 8px;
          color: #b91c1c;
        }

        .content {
          background: transparent;
        }

        .contentHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 18px;
        }

        .breadcrumb {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #6b7280;
        }

        .contentTitle {
          margin: 0 0 6px 0;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
        }

        .contentSub {
          margin: 0;
          font-size: 13px;
          color: #4b5563;
          max-width: 520px;
        }

        .tagStack {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          font-size: 11px;
          color: #4b5563;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #e5e7eb;
        }

        .tagDot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #9ca3af;
        }
        .tagDot.silver {
          background: #9ca3af;
        }
        .tagDot.gold {
          background: #facc15;
        }

        .pointsLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 20px 20px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
          border: 1px solid #e5e7eb;
        }

        .cardHeaderRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .cardTitle {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .cardTextMuted {
          margin: 4px 0 12px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .cardTextMuted.tiny {
          font-size: 11px;
          margin-top: 6px;
        }

        .chip {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .pointsTop {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr);
          gap: 16px;
          margin-top: 6px;
          margin-bottom: 12px;
        }

        .pointsNumberBlock {
          background: #f9fafb;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          padding: 12px 14px;
        }

        .pointsLabel {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .pointsValue {
          font-size: 26px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .pointsStatus {
          font-size: 12px;
          color: #4b5563;
        }

        .pointsProgressBlock {
          background: #f9fafb;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          padding: 12px 14px;
        }

        .pointsProgressHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #374151;
          margin-bottom: 6px;
        }

        .smallText {
          font-size: 11px;
          color: #6b7280;
        }

        .progressBar {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .progressBar.small {
          height: 6px;
        }

        .progressFill {
          height: 100%;
          background: linear-gradient(90deg, #007764, #16a34a);
        }

        .progressUnlocked {
          background: linear-gradient(90deg, #f59e0b, #e11d48);
        }

        .pointsScale {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }

        .benefitsSection {
          margin-top: 6px;
        }

        .benefitsSection h3 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .benefitList {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .benefitItem {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
        }

        .benefitIcon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #e0f2f1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #047857;
        }

        .benefitContent {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .benefitHeader {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
          color: #111827;
        }

        .benefitTitle {
          font-weight: 600;
        }

        .benefitNeeded {
          font-size: 11px;
          color: #6b7280;
        }

        .benefitFooter {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
        }

        .remainingText {
          color: #6b7280;
        }

        .unlockedText {
          color: #166534;
        }

        .historyTable {
          margin-top: 6px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          background: #f9fafb;
        }

        .historyHeader {
          display: grid;
          grid-template-columns: 110px minmax(0, 1fr) 90px;
          gap: 8px;
          padding: 8px 10px;
          background: #e5e7eb;
          font-size: 11px;
          color: #374151;
          font-weight: 600;
        }

        .historyRow {
          display: grid;
          grid-template-columns: 110px minmax(0, 1fr) 90px;
          gap: 8px;
          padding: 8px 10px;
          font-size: 12px;
          color: #111827;
          background: #ffffff;
        }

        .historyRow:nth-child(even) {
          background: #f9fafb;
        }

        .historyDate {
          color: #4b5563;
        }

        .historyInfo {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .historyTitle {
          font-weight: 500;
        }

        .historySub {
          font-size: 11px;
          color: #6b7280;
        }

        .historyPoints {
          text-align: right;
          font-weight: 600;
          color: #047857;
        }

        .historyPointsCol {
          text-align: right;
        }

        .footBox {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #4b5563;
        }

        .footBox p {
          margin: 0;
        }

        .footnote {
          display: inline-flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 12px;
          font-size: 11px;
          color: #6b7280;
        }

        .footnote :global(svg) {
          margin-top: 2px;
        }

        @media (max-width: 960px) {
          .appHeader {
            flex-direction: column;
            align-items: flex-start;
          }
          .topNav {
            flex-wrap: wrap;
          }
          .mainLayout {
            grid-template-columns: minmax(0, 1fr);
          }
          .sideNav {
            order: 2;
          }
          .content {
            order: 1;
          }
          .pointsLayout {
            grid-template-columns: minmax(0, 1fr);
          }
          .pointsTop {
            grid-template-columns: minmax(0, 1fr);
          }
          .historyHeader,
          .historyRow {
            grid-template-columns: 90px minmax(0, 1fr) 80px;
          }
        }

        @media (max-width: 640px) {
          .shell {
            padding: 0 16px;
          }
        }
      `}</style>
    </>
  );
}
