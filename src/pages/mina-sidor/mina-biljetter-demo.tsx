// src/pages/mina-sidor/mina-biljetter-demo.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  User,
  Ticket,
  MapPin,
  Star,
  Trophy,
  LogOut,
  Calendar,
  Clock,
  Smartphone,
  Download,
  Info,
} from "lucide-react";

const fakeUser = {
  firstName: "Demo",
  lastName: "Resenär",
  email: "demo@helsingbuss.se",
  level: "Silvermedlem",
};

type DemoTicketStatus = "upcoming" | "completed" | "cancelled";

type DemoTicket = {
  id: string;
  status: DemoTicketStatus;
  tripTitle: string;
  lineName: string;
  date: string;
  departureTime: string;
  returnTime?: string;
  from: string;
  to: string;
  passengers: number;
  ticketNumber: string;
  seatInfo: string;
  ticketType: string;
  totalAmount: string;
  smsTicket: boolean;
  cancellationProtection: boolean;
  manageUrl: string;
};

const demoTickets: DemoTicket[] = [
  {
    id: "1",
    status: "upcoming",
    tripTitle: "Malmö – Gekås Ullared",
    lineName: "Shoppingresa · Linje 1",
    date: "Lör 15 mars 2025",
    departureTime: "06:15",
    returnTime: "18:10",
    from: "Malmö C (Läge K)",
    to: "Gekås Ullared",
    passengers: 2,
    ticketNumber: "HB-20250315-8F3A",
    seatInfo: "Plats 12A–12B",
    ticketType: "Dagsresa · Shopping",
    totalAmount: "590 kr",
    smsTicket: true,
    cancellationProtection: true,
    manageUrl: "#",
  },
  {
    id: "2",
    status: "upcoming",
    tripTitle: "Helsingborg – Vallarna Friluftsteater",
    lineName: "Teaterresa",
    date: "Fre 9 maj 2025",
    departureTime: "14:30",
    returnTime: "00:45",
    from: "Helsingborg, Knutpunkten",
    to: "Vallarna, Falkenberg",
    passengers: 1,
    ticketNumber: "HB-20250509-3C9D",
    seatInfo: "Plats 7C",
    ticketType: "Kvällsresa · Teaterpaket",
    totalAmount: "895 kr",
    smsTicket: false,
    cancellationProtection: true,
    manageUrl: "#",
  },
  {
    id: "3",
    status: "completed",
    tripTitle: "Helsingborg – Kielkryssning",
    lineName: "Weekendkryssning",
    date: "Fre 10 jan 2025",
    departureTime: "08:00",
    returnTime: "Sön 12 jan 19:30",
    from: "Helsingborg, Knutpunkten",
    to: "Kielterminalen",
    passengers: 2,
    ticketNumber: "HB-20250110-4B7K",
    seatInfo: "Plats 3A–3B",
    ticketType: "Weekend · Kryssning",
    totalAmount: "2 490 kr",
    smsTicket: true,
    cancellationProtection: false,
    manageUrl: "#",
  },
  {
    id: "4",
    status: "cancelled",
    tripTitle: "Lund – Liseberg",
    lineName: "Nöjesresa",
    date: "Lör 1 feb 2025",
    departureTime: "07:30",
    returnTime: "21:45",
    from: "Lund C",
    to: "Liseberg, Göteborg",
    passengers: 3,
    ticketNumber: "HB-20250201-5T1Q",
    seatInfo: "Ej tilldelat",
    ticketType: "Dagsresa · Nöje",
    totalAmount: "0 kr (avbokad)",
    smsTicket: false,
    cancellationProtection: true,
    manageUrl: "#",
  },
];

export default function MinaBiljetterDemo() {
  const isDemo = true;
  const [selectedId, setSelectedId] = useState<string>("1");

  const selectedTicket =
    demoTickets.find((t) => t.id === selectedId) ?? demoTickets[0];

  const upcomingTickets = demoTickets.filter(
    (t) => t.status === "upcoming"
  );
  const completedTickets = demoTickets.filter(
    (t) => t.status === "completed"
  );
  const cancelledTickets = demoTickets.filter(
    (t) => t.status === "cancelled"
  );

  return (
    <>
      <Head>
        <title>Demo – Mina biljetter | Helsingbuss</title>
      </Head>

      <div className="page">
        <div className="shell">
          {isDemo && (
            <div className="demoBanner">
              <strong>Demo-version</strong> – den här sidan visar ett exempel
              på hur <strong>Mina biljetter</strong> kan se ut i Mina sidor.
              Inga riktiga kunduppgifter visas.
            </div>
          )}

          {/* HEADER – samma som övriga demo-sidor */}
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
            {/* SIDOMENY */}
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
                <button
                  className="sideNavItem sideNavItemActive"
                  type="button"
                >
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

            {/* INNEHÅLL – MINA BILJETTER */}
            <section className="content">
              <header className="contentHeader">
                <div>
                  <p className="breadcrumb">
                    Mina sidor · Mina biljetter {isDemo ? "· Demo" : ""}
                  </p>
                  <h1 className="contentTitle">Mina biljetter</h1>
                  <p className="contentSub">
                    Här ser kunden alla aktiva och avslutade e-biljetter. I
                    skarpt läge kan man öppna varje biljett som PDF,
                    visa QR-kod, ändra vissa uppgifter och se status för
                    avbokningsskydd och SMS-biljett.
                  </p>
                </div>

                <div className="tagStack">
                  <span className="tag">
                    <span className="tagDot upcoming" />
                    Kommande resor
                  </span>
                  <span className="tag">
                    <span className="tagDot completed" />
                    Avslutade resor
                  </span>
                  <span className="tag">
                    <span className="tagDot cancelled" />
                    Avbokade/inställda
                  </span>
                </div>
              </header>

              <div className="ticketsLayout">
                {/* LISTA MED KOMMANDE BILJETTER */}
                <article className="card ticketListCard">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Kommande biljetter</h2>
                    <span className="chip">
                      {upcomingTickets.length}{" "}
                      {upcomingTickets.length === 1
                        ? "resa bokad"
                        : "resor bokade"}
                    </span>
                  </div>

                  {upcomingTickets.length === 0 && (
                    <p className="cardTextMuted">
                      Just nu finns det inga kommande biljetter. När du bokar en
                      resa via Helsingbuss visas den här.
                    </p>
                  )}

                  <div className="ticketList">
                    {upcomingTickets.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={
                          "ticketItem" +
                          (t.id === selectedTicket.id ? " ticketItemActive" : "")
                        }
                        onClick={() => setSelectedId(t.id)}
                      >
                        <div className="ticketItemMain">
                          <div className="ticketTitleBlock">
                            <span className="ticketTitle">{t.tripTitle}</span>
                            <span className="ticketSubtitle">
                              {t.lineName}
                            </span>
                          </div>
                          <span className="ticketDate">
                            <Calendar size={14} />
                            {t.date}
                          </span>
                        </div>

                        <div className="ticketItemMeta">
                          <span className="ticketMetaRow">
                            <Clock size={14} />
                            {t.departureTime}
                            {t.returnTime && ` · Retur ${t.returnTime}`}
                          </span>
                          <span className="ticketMetaRow">
                            <MapPin size={14} />
                            {t.from} → {t.to}
                          </span>
                          <span className="ticketMetaRow">
                            <Ticket size={14} />
                            {t.passengers} pass · {t.ticketNumber}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button type="button" className="secondaryBtn smallBtn">
                    Visa alla kommande biljetter
                  </button>
                </article>

                {/* DETALJVY FÖR VALD BILJETT */}
                <article className="card ticketDetailCard">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Biljett-detaljer (demo)</h2>
                    <span className="statusPill upcoming">
                      Kommande resa
                    </span>
                  </div>

                  <p className="cardTextMuted">
                    Så här kan en biljett se ut i Mina sidor. I skarpt läge
                    matchar vi detta mot den PDF-biljett som skickas via e-post
                    och den QR-kod som visas vid ombordstigning.
                  </p>

                  <div className="detailsGrid">
                    <div className="detailsCol">
                      <div className="detailBlock">
                        <h3>Resa</h3>
                        <p className="detailTitle">
                          {selectedTicket.tripTitle}
                        </p>
                        <p className="detailSub">{selectedTicket.lineName}</p>
                      </div>

                      <div className="detailTwoCols">
                        <div>
                          <span className="fieldLabel">Datum</span>
                          <div className="fieldValueCompact">
                            {selectedTicket.date}
                          </div>
                        </div>
                        <div>
                          <span className="fieldLabel">Tider</span>
                          <div className="fieldValueCompact">
                            Avgång {selectedTicket.departureTime}
                            {selectedTicket.returnTime &&
                              ` · Retur ${selectedTicket.returnTime}`}
                          </div>
                        </div>
                      </div>

                      <div className="detailTwoCols">
                        <div>
                          <span className="fieldLabel">Från</span>
                          <div className="fieldValueCompact">
                            {selectedTicket.from}
                          </div>
                        </div>
                        <div>
                          <span className="fieldLabel">Till</span>
                          <div className="fieldValueCompact">
                            {selectedTicket.to}
                          </div>
                        </div>
                      </div>

                      <div className="detailTwoCols">
                        <div>
                          <span className="fieldLabel">Passagerare</span>
                          <div className="fieldValueCompact">
                            {selectedTicket.passengers} resenär
                            {selectedTicket.passengers > 1 && "er"}
                          </div>
                        </div>
                        <div>
                          <span className="fieldLabel">Plats</span>
                          <div className="fieldValueCompact">
                            {selectedTicket.seatInfo}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="detailsCol">
                      <div className="detailBlock">
                        <h3>Biljett</h3>
                        <div className="ticketNumberRow">
                          <span className="ticketNumberLabel">
                            Biljett / bokningsnr
                          </span>
                          <span className="ticketNumberValue">
                            {selectedTicket.ticketNumber}
                          </span>
                        </div>

                        <div className="detailTwoCols">
                          <div>
                            <span className="fieldLabel">Biljettyp</span>
                            <div className="fieldValueCompact">
                              {selectedTicket.ticketType}
                            </div>
                          </div>
                          <div>
                            <span className="fieldLabel">Belopp</span>
                            <div className="fieldValueCompact">
                              {selectedTicket.totalAmount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="detailBlock">
                        <h3>Tillval</h3>
                        <div className="labelPillRow">
                          <span className="labelPill">
                            <Smartphone size={14} />
                            SMS-biljett{" "}
                            {selectedTicket.smsTicket ? "aktiverad" : "ej vald"}
                          </span>
                          <span className="labelPill">
                            <Info size={14} />
                            Avbokningsskydd{" "}
                            {selectedTicket.cancellationProtection
                              ? "tillagt"
                              : "ej valt"}
                          </span>
                        </div>
                      </div>

                      <div className="detailBlock">
                        <h3>Hantera</h3>
                        <div className="manageRow">
                          <button type="button" className="primaryBtn smallBtn">
                            <Download size={14} />
                            Ladda ner e-biljett (PDF)
                          </button>
                          <button type="button" className="secondaryBtn smallBtn">
                            <Smartphone size={14} />
                            Visa QR-kod (demo)
                          </button>
                        </div>
                        <p className="tinyText">
                          I skarpt läge kan kunden ladda ner sin riktiga
                          e-biljett, öppna QR-koden och se detaljerade
                          villkor för avbokning.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* HISTORIK / ARKIV */}
              <article className="card fullWidth historyCard">
                <div className="cardHeaderRow">
                  <h2 className="cardTitle">Biljettarkiv</h2>
                  <span className="chip chipSubtle">
                    Avslutade och avbokade resor
                  </span>
                </div>

                <p className="cardTextMuted">
                  Här kan kunden se sina senaste resor, skriva ut kvitton och
                  följa upp tidigare bokningar. I skarpt läge kan man filtrera
                  på år och ladda ner kvitto för bokföring.
                </p>

                <div className="historyTable">
                  {[...completedTickets, ...cancelledTickets].map((t) => (
                    <div key={t.id} className="historyRow">
                      <div className="historyMain">
                        <div className="historyTitle">
                          <span>{t.tripTitle}</span>
                          <span className="historyLine">{t.lineName}</span>
                        </div>
                        <div className="historyMeta">
                          <span>
                            <Calendar size={14} /> {t.date}
                          </span>
                          <span>
                            <Clock size={14} /> {t.departureTime}
                          </span>
                          <span>
                            <Ticket size={14} /> {t.ticketNumber}
                          </span>
                        </div>
                      </div>

                      <div className="historyRight">
                        <div className="historyStatus">
                          {t.status === "completed" && (
                            <span className="statusPill completed">
                              Avslutad
                            </span>
                          )}
                          {t.status === "cancelled" && (
                            <span className="statusPill cancelled">
                              Avbokad
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="secondaryBtn tinyBtn"
                        >
                          Visa kvitto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <p className="footnote">
                <Info size={13} />
                <span>
                  I den riktiga versionen hämtas alla biljetter direkt från
                  Helsingbuss bokningssystem. Den här sidan är bara en
                  klickbar demo för att visa designen.
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

        .tagDot.upcoming {
          background: #16a34a;
        }
        .tagDot.completed {
          background: #2563eb;
        }
        .tagDot.cancelled {
          background: #b91c1c;
        }

        .ticketsLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 18px 20px 20px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }

        .ticketListCard {
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

        .chip {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
        }

        .chipSubtle {
          background: #f3f4f6;
          color: #4b5563;
        }

        .ticketList {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .ticketItem {
          width: 100%;
          text-align: left;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
        }

        .ticketItem:hover {
          border-color: #cbd5f5;
          background: #ffffff;
        }

        .ticketItemActive {
          border-color: #007764;
          box-shadow: 0 0 0 1px #00776433;
          background: #ffffff;
        }

        .ticketItemMain {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .ticketTitleBlock {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ticketTitle {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .ticketSubtitle {
          font-size: 12px;
          color: #6b7280;
        }

        .ticketDate {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #374151;
        }

        .ticketItemMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          font-size: 12px;
          color: #4b5563;
        }

        .ticketMetaRow {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .ticketDetailCard {
          border: 1px solid #e5e7eb;
        }

        .statusPill {
          font-size: 11px;
          padding: 4px 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .statusPill.upcoming {
          background: #dcfce7;
          color: #166534;
        }
        .statusPill.completed {
          background: #e0f2fe;
          color: #075985;
        }
        .statusPill.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .detailsGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 16px;
          margin-top: 6px;
        }

        .detailsCol {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detailBlock h3 {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .detailTitle {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .detailSub {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #6b7280;
        }

        .detailTwoCols {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 6px;
        }

        .fieldLabel {
          display: block;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .fieldValueCompact {
          font-size: 13px;
          color: #111827;
          padding: 6px 9px;
          border-radius: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .ticketNumberRow {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 6px;
        }

        .ticketNumberLabel {
          font-size: 11px;
          color: #6b7280;
        }

        .ticketNumberValue {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .labelPillRow {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .labelPill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
        }

        .manageRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
          margin-bottom: 4px;
        }

        .primaryBtn {
          border: none;
          border-radius: 999px;
          background: #007764;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
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
          padding: 7px 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .secondaryBtn:hover {
          background: #f3f4f6;
        }

        .smallBtn {
          font-size: 12px;
          padding: 7px 12px;
        }

        .tinyBtn {
          font-size: 11px;
          padding: 5px 10px;
        }

        .historyCard {
          margin-top: 6px;
        }

        .historyTable {
          margin-top: 10px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .historyRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .historyRow:last-child {
          border-bottom: none;
        }

        .historyMain {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .historyTitle span:first-child {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .historyLine {
          display: block;
          font-size: 11px;
          color: #6b7280;
        }

        .historyMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          font-size: 11px;
          color: #4b5563;
        }

        .historyMeta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .historyRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          gap: 6px;
        }

        .historyStatus {
          display: flex;
          gap: 4px;
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
          .ticketsLayout {
            grid-template-columns: minmax(0, 1fr);
          }
          .detailsGrid {
            grid-template-columns: minmax(0, 1fr);
          }
          .historyRow {
            flex-direction: column;
            align-items: flex-start;
          }
          .historyRight {
            align-items: flex-start;
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
