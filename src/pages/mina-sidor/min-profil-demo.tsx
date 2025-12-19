// src/pages/mina-sidor/min-profil-demo.tsx
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
} from "lucide-react";

const fakeUser = {
  firstName: "Demo",
  lastName: "Resenär",
  email: "demo@helsingbuss.se",
  phone: "+46 70 123 45 67",
  level: "Silvermedlem",
  memberSince: "Sedan 2025",
};

export default function MinProfilDemo() {
  const isDemo = true;

  return (
    <>
      <Head>
        <title>Demo – Min profil | Helsingbuss</title>
      </Head>

      <div className="page">
        <div className="shell">
          {isDemo && (
            <div className="demoBanner">
              <strong>Demo-version</strong> – den här sidan visar ett exempel
              på hur <strong>Min profil</strong> kan se ut i Mina sidor. Inga
              riktiga kunduppgifter visas.
            </div>
          )}

          {/* HEADER (samma stil som översikt-demon) */}
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
            {/* SIDOMENY – samma struktur som översikten */}
            <aside className="sideNav">
              <h2 className="sideNavTitle">Mina sidor</h2>
              <nav className="sideNavList">
                <button className="sideNavItem" type="button">
                  <User className="sideNavIcon" size={16} />
                  <span>Översikt (demo)</span>
                </button>
                <button
                  className="sideNavItem sideNavItemActive"
                  type="button"
                >
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
                <button className="sideNavItem" type="button">
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
                      "I demoversionen gör Logga ut ingenting – här kopplar vi riktig inloggning senare 🙂"
                    )
                  }
                >
                  <LogOut className="sideNavIcon" size={16} />
                  <span>Logga ut</span>
                </button>
              </nav>
            </aside>

            {/* INNEHÅLL – MIN PROFIL */}
            <section className="content">
              <header className="contentHeader">
                <div>
                  <p className="breadcrumb">
                    Mina sidor · Min profil {isDemo ? "· Demo" : ""}
                  </p>
                  <h1 className="contentTitle">Min profil</h1>
                  <p className="contentSub">
                    Här visar vi hur dina personuppgifter, kontaktuppgifter och
                    inloggningsinställningar kan se ut. I skarpt läge kan du
                    uppdatera dina uppgifter direkt här.
                  </p>
                </div>

                <div className="membershipCard">
                  <span className="membershipLabel">Medlemskap</span>
                  <span className="membershipLevel">{fakeUser.level}</span>
                  <span className="membershipMeta">
                    {fakeUser.memberSince}
                    <br />
                    E-post: {fakeUser.email}
                  </span>
                  <span className="membershipPill">
                    Kundklubb aktiverad · Demo
                  </span>
                </div>
              </header>

              <div className="grid">
                {/* KONTAKTUPPGIFTER */}
                <article className="card cardHighlight">
                  <h2 className="cardTitle">Kontaktuppgifter</h2>
                  <p className="cardTextMuted">
                    Dessa uppgifter använder vi för bokningsbekräftelser,
                    e-biljetter och viktig information inför din resa.
                  </p>

                  <div className="formGrid">
                    <div className="formField">
                      <label className="fieldLabel">Förnamn</label>
                      <div className="fieldValue">{fakeUser.firstName}</div>
                    </div>
                    <div className="formField">
                      <label className="fieldLabel">Efternamn</label>
                      <div className="fieldValue">{fakeUser.lastName}</div>
                    </div>
                    <div className="formField">
                      <label className="fieldLabel">E-postadress</label>
                      <div className="fieldValue">{fakeUser.email}</div>
                      <p className="fieldHint">
                        Hit skickar vi bokningsbekräftelser och e-biljetter.
                      </p>
                    </div>
                    <div className="formField">
                      <label className="fieldLabel">Mobilnummer</label>
                      <div className="fieldValue">{fakeUser.phone}</div>
                      <p className="fieldHint">
                        Används för SMS-biljetter och viktiga
                        reseuppdateringar.
                      </p>
                    </div>
                    <div className="formField">
                      <label className="fieldLabel">Adress</label>
                      <div className="fieldValue fieldValuePlaceholder">
                        Läggs till i skarpt läge
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={() =>
                      alert(
                        "I demoversionen går det inte att spara – här kopplar vi riktig uppdatering mot databasen."
                      )
                    }
                  >
                    Spara ändringar (demo)
                  </button>
                </article>

                {/* INLOGGNING & SÄKERHET */}
                <article className="card">
                  <h2 className="cardTitle">Inloggning & säkerhet</h2>
                  <p className="cardTextMuted">
                    Här hanterar kunden sitt lösenord och
                    säkerhetsinställningar. I skarpt läge lägger vi till
                    tvåfaktorsinloggning, verifierad e-post och en logg över
                    senaste inloggningar.
                  </p>

                  <div className="formStack">
                    <div className="formField">
                      <label className="fieldLabel">Inloggningsadress</label>
                      <div className="fieldValue">{fakeUser.email}</div>
                    </div>

                    <div className="formField">
                      <label className="fieldLabel">Lösenord</label>
                      <div className="fieldValue">••••••••••</div>
                      <button
                        type="button"
                        className="secondaryBtn"
                        onClick={() =>
                          alert(
                            "Här öppnar vi ett riktigt flöde för att byta lösenord med e-postbekräftelse."
                          )
                        }
                      >
                        Byt lösenord (demo)
                      </button>
                    </div>

                    <div className="formField">
                      <label className="fieldLabel">Säkerhet</label>
                      <ul className="bulletList">
                        <li>All inloggning sker via säker anslutning (HTTPS).</li>
                        <li>Din data lagras i EU-baserade datacenter.</li>
                        <li>
                          I skarpt läge kan du logga ut alla enheter med ett
                          klick.
                        </li>
                      </ul>
                    </div>
                  </div>
                </article>

                {/* KOMMUNIKATION / SAMTYCKEN */}
                <article className="card fullWidth">
                  <h2 className="cardTitle">Kommunikation & samtycken</h2>
                  <p className="cardTextMuted">
                    I skarpt läge väljer kunden här vilken typ av information
                    som ska skickas – t.ex. endast viktig reseinformation eller
                    även nyheter, erbjudanden och PrideXpress-kampanjer.
                  </p>

                  <div className="consentRow">
                    <label className="consentItem">
                      <input type="checkbox" defaultChecked readOnly />
                      <span>
                        <strong>Reseinformation</strong>
                        <br />
                        Bekräftelser, e-biljetter och viktig information om
                        avgångar, tider och ändringar.
                      </span>
                    </label>

                    <label className="consentItem">
                      <input type="checkbox" defaultChecked readOnly />
                      <span>
                        <strong>Nyheter & inspiration</strong>
                        <br />
                        Tips på nya resor, kampanjer och upplevelser med
                        Helsingbuss.
                      </span>
                    </label>

                    <label className="consentItem">
                      <input type="checkbox" readOnly />
                      <span>
                        <strong>PrideXpress & specialkampanjer</strong>
                        <br />
                        Extra utskick kopplade till PrideXpress, quiz och
                        tävlingar – avmarkeras om kunden inte vill ha dem.
                      </span>
                    </label>
                  </div>
                </article>
              </div>
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

        .membershipCard {
          padding: 12px 14px;
          border-radius: 14px;
          background: #0f766e;
          color: #ecfeff;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 220px;
        }

        .membershipLabel {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .membershipLevel {
          font-size: 16px;
          font-weight: 700;
        }

        .membershipMeta {
          font-size: 12px;
          opacity: 0.9;
        }

        .membershipPill {
          align-self: flex-start;
          margin-top: 4px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.18);
          font-size: 11px;
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 18px;
          align-items: flex-start;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 20px 20px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }

        .cardHighlight {
          border: 1px solid #e5e7eb;
        }

        .fullWidth {
          grid-column: 1 / -1;
        }

        .cardTitle {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .cardTextMuted {
          margin: 0 0 14px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px 16px;
          margin-bottom: 16px;
        }

        .formField {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 13px;
        }

        .fieldLabel {
          font-size: 12px;
          color: #6b7280;
        }

        .fieldValue {
          font-size: 13px;
          color: #111827;
          padding: 7px 10px;
          border-radius: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .fieldValuePlaceholder {
          color: #9ca3af;
          font-style: italic;
        }

        .fieldHint {
          margin: 2px 0 0 0;
          font-size: 11px;
          color: #9ca3af;
        }

        .formStack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .primaryBtn {
          border: none;
          border-radius: 999px;
          background: #007764;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 18px;
          align-self: flex-start;
          cursor: pointer;
        }

        .primaryBtn:hover {
          background: #006254;
        }

        .secondaryBtn {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          cursor: pointer;
          align-self: flex-start;
          margin-top: 4px;
        }

        .secondaryBtn:hover {
          background: #f3f4f6;
        }

        .bulletList {
          margin: 4px 0 0 16px;
          padding: 0;
          font-size: 12px;
          color: #4b5563;
        }

        .bulletList li + li {
          margin-top: 4px;
        }

        .consentRow {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .consentItem {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: #374151;
          background: #f9fafb;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .consentItem input {
          margin-top: 3px;
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
          .contentHeader {
            flex-direction: column;
          }
          .membershipCard {
            width: 100%;
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
