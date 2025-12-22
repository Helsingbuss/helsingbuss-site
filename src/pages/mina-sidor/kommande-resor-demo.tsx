// src/pages/mina-sidor/kommande-resor-demo.tsx
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
  Bus,
  Coffee,
  Info,
  ShieldCheck,
} from "lucide-react";

const fakeUser = {
  firstName: "Demo",
  lastName: "Resenär",
  email: "demo@helsingbuss.se",
  level: "Silvermedlem",
};

type TripStatus = "confirmed" | "pending" | "cancelled";

type UpcomingTrip = {
  id: string;
  status: TripStatus;
  tripTitle: string;
  lineName: string;
  date: string;
  departureTime: string;
  returnTime?: string;
  from: string;
  to: string;
  passengers: number;
  pickupPoints: string[];
  busInfo: string;
  seatInfo?: string;
  ticketNumber: string;
  onboardService: string[];
  notes?: string;
};

const demoTrips: UpcomingTrip[] = [
  {
    id: "1",
    status: "confirmed",
    tripTitle: "Malmö – Gekås Ullared",
    lineName: "Shoppingresa · Linje 1",
    date: "Lör 15 mars 2025",
    departureTime: "06:15",
    returnTime: "18:10",
    from: "Malmö C (Läge K)",
    to: "Gekås Ullared",
    passengers: 2,
    pickupPoints: [
      "Malmö C (Läge K) – påstigning",
      "Lund C – påstigning",
      "Helsingborg, Knutpunkten – påstigning",
    ],
    busInfo: "Mercedes-Benz Tourismo · 4-stjärnig komfort",
    seatInfo: "Plats 12A–12B",
    ticketNumber: "HB-20250315-8F3A",
    onboardService: [
      "Kaffe & fika ombord",
      "Toalett",
      "Eluttag vid säte",
      "Wifi (i mån av täckning)",
    ],
    notes: "Beräknad ankomst till Gekås ca 09:45. Hemresa ca 15:30.",
  },
  {
    id: "2",
    status: "confirmed",
    tripTitle: "Helsingborg – Vallarna Friluftsteater",
    lineName: "Teaterresa · Sommar",
    date: "Fre 9 maj 2025",
    departureTime: "14:30",
    returnTime: "00:45",
    from: "Helsingborg, Knutpunkten",
    to: "Vallarna, Falkenberg",
    passengers: 1,
    pickupPoints: [
      "Helsingborg, Knutpunkten – påstigning",
      "Ängelholm, Resecentrum – påstigning",
    ],
    busInfo: "Volvo 9700 · 3-stjärnig turistbuss",
    seatInfo: "Plats 7C",
    ticketNumber: "HB-20250509-3C9D",
    onboardService: [
      "Reseledare med hela vägen",
      "Paus med möjlighet att köpa mat",
      "Toalett ombord",
    ],
    notes: "Bussen stannar nära entrén till Vallarna. Paus längs E6 både dit och hem.",
  },
  {
    id: "3",
    status: "pending",
    tripTitle: "Helsingborg – Kielkryssning",
    lineName: "Weekendkryssning",
    date: "Fre 10 jan 2025",
    departureTime: "08:00",
    returnTime: "Sön 12 jan 19:30",
    from: "Helsingborg, Knutpunkten",
    to: "Kiel-terminalen",
    passengers: 2,
    pickupPoints: [
      "Helsingborg, Knutpunkten – påstigning",
      "Landskrona, Station – påstigning",
      "Malmö, Hyllie – påstigning",
    ],
    busInfo: "HelsingExpress · Komfortbuss m. extra benutrymme",
    seatInfo: "Plats 3A–3B",
    ticketNumber: "HB-20250110-4B7K",
    onboardService: [
      "Kaffe/te ingår",
      "Litet frukostpaket på utresan",
      "Toalett & USB-uttag",
    ],
    notes: "Resan är preliminärt bekräftad. Slutligt besked senast 14 dagar före avresa.",
  },
];

export default function KommandeResorDemo() {
  const isDemo = true;
  const [selectedId, setSelectedId] = useState<string>("1");

  const selectedTrip =
    demoTrips.find((t) => t.id === selectedId) ?? demoTrips[0];

  return (
    <>
      <Head>
        <title>Demo – Kommande resor | Helsingbuss</title>
      </Head>

      <div className="page">
        <div className="shell">
          {isDemo && (
            <div className="demoBanner">
              <strong>Demo-version</strong> – den här sidan visar ett exempel
              på hur <strong>Kommande resor</strong> kan se ut i Mina sidor.
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
            {/* SIDOMENY – samma som på de andra demo-sidorna */}
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
                <button
                  className="sideNavItem sideNavItemActive"
                  type="button"
                >
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

            {/* INNEHÅLL – KOMMANDE RESOR */}
            <section className="content">
              <header className="contentHeader">
                <div>
                  <p className="breadcrumb">
                    Mina sidor · Kommande resor {isDemo ? "· Demo" : ""}
                  </p>
                  <h1 className="contentTitle">Kommande resor</h1>
                  <p className="contentSub">
                    Här samlas alla planerade resor hos Helsingbuss. I skarpt
                    läge kan kunden se upphämtningsplatser, tider, bussinformation
                    och snabbt öppna sin biljett eller avbokningsskydd direkt
                    inför avresa.
                  </p>
                </div>

                <div className="tagStack">
                  <span className="tag">
                    <span className="tagDot confirmed" />
                    Bekräftad resa
                  </span>
                  <span className="tag">
                    <span className="tagDot pending" />
                    Avvaktar bekräftelse
                  </span>
                  <span className="tag">
                    <span className="tagDot cancelled" />
                    Avbokad / inställd
                  </span>
                </div>
              </header>

              <div className="tripsLayout">
                {/* Vänster: lista/timeline */}
                <article className="card tripsListCard">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Planerade resor</h2>
                    <span className="chip">
                      {demoTrips.length}{" "}
                      {demoTrips.length === 1 ? "bokad resa" : "bokade resor"}
                    </span>
                  </div>

                  <p className="cardTextMuted">
                    Klicka på en resa i listan för att se detaljer till höger –
                    ungefär så här kommer dina kunder kunna använda sidan.
                  </p>

                  <div className="tripList">
                    {demoTrips.map((trip) => (
                      <button
                        key={trip.id}
                        type="button"
                        className={
                          "tripItem" +
                          (trip.id === selectedTrip.id ? " tripItemActive" : "")
                        }
                        onClick={() => setSelectedId(trip.id)}
                      >
                        <div className="tripItemHeader">
                          <div className="tripTitleBlock">
                            <span className="tripTitle">{trip.tripTitle}</span>
                            <span className="tripSubtitle">
                              {trip.lineName}
                            </span>
                          </div>
                          <span className="tripDate">
                            <Calendar size={14} />
                            {trip.date}
                          </span>
                        </div>

                        <div className="tripMeta">
                          <span className="tripMetaRow">
                            <Clock size={14} />
                            Avgång {trip.departureTime}
                            {trip.returnTime && ` · Retur ${trip.returnTime}`}
                          </span>
                          <span className="tripMetaRow">
                            <MapPin size={14} />
                            {trip.from} → {trip.to}
                          </span>
                          <span className="tripMetaRow">
                            <Ticket size={14} />
                            {trip.passengers} pass · {trip.ticketNumber}
                          </span>
                        </div>

                        <div className="tripFooterRow">
                          <span className="statusPillSmall">
                            <span
                              className={`statusDot ${
                                trip.status === "confirmed"
                                  ? "dotConfirmed"
                                  : trip.status === "pending"
                                  ? "dotPending"
                                  : "dotCancelled"
                              }`}
                            />
                            {trip.status === "confirmed" && "Bekräftad"}
                            {trip.status === "pending" && "Avvaktar bekräftelse"}
                            {trip.status === "cancelled" && "Avbokad"}
                          </span>
                          <span className="tinyHint">
                            Klicka för mer information
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>

                {/* Höger: detaljer för vald resa */}
                <article className="card tripDetailCard">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Resedetaljer (demo)</h2>
                    <span
                      className={
                        "statusPill " +
                        (selectedTrip.status === "confirmed"
                          ? "confirmed"
                          : selectedTrip.status === "pending"
                          ? "pending"
                          : "cancelled")
                      }
                    >
                      {selectedTrip.status === "confirmed" && "Bekräftad resa"}
                      {selectedTrip.status === "pending" &&
                        "Avvaktar bekräftelse"}
                      {selectedTrip.status === "cancelled" && "Avbokad resa"}
                    </span>
                  </div>

                  <p className="cardTextMuted">
                    Den här panelen visar hur en kund ser sin resa i detalj.
                    I skarpt läge kan vi lägga till knappar för ändring,
                    avbokning och kontakt med kundtjänst direkt här.
                  </p>

                  <div className="detailsGrid">
                    <div className="detailsCol">
                      <div className="detailBlock">
                        <h3>Reseöversikt</h3>
                        <p className="detailTitle">
                          {selectedTrip.tripTitle}
                        </p>
                        <p className="detailSub">{selectedTrip.lineName}</p>
                      </div>

                      <div className="detailTwoCols">
                        <div>
                          <span className="fieldLabel">Datum</span>
                          <div className="fieldValueCompact">
                            {selectedTrip.date}
                          </div>
                        </div>
                        <div>
                          <span className="fieldLabel">Tider</span>
                          <div className="fieldValueCompact">
                            Avgång {selectedTrip.departureTime}
                            {selectedTrip.returnTime &&
                              ` · Retur ${selectedTrip.returnTime}`}
                          </div>
                        </div>
                      </div>

                      <div className="detailTwoCols">
                        <div>
                          <span className="fieldLabel">Från</span>
                          <div className="fieldValueCompact">
                            {selectedTrip.from}
                          </div>
                        </div>
                        <div>
                          <span className="fieldLabel">Till</span>
                          <div className="fieldValueCompact">
                            {selectedTrip.to}
                          </div>
                        </div>
                      </div>

                      <div className="detailTwoCols">
                        <div>
                          <span className="fieldLabel">Passagerare</span>
                          <div className="fieldValueCompact">
                            {selectedTrip.passengers} resenär
                            {selectedTrip.passengers > 1 && "er"}
                          </div>
                        </div>
                        <div>
                          <span className="fieldLabel">Plats</span>
                          <div className="fieldValueCompact">
                            {selectedTrip.seatInfo || "Tilldelas senare"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="detailsCol">
                      <div className="detailBlock">
                        <h3>Buss & biljett</h3>
                        <div className="ticketNumberRow">
                          <span className="fieldLabel">Bokningsnummer</span>
                          <span className="ticketNumberValue">
                            {selectedTrip.ticketNumber}
                          </span>
                        </div>

                        <div className="detailTwoCols">
                          <div>
                            <span className="fieldLabel">Buss</span>
                            <div className="fieldValueCompact busInfo">
                              <Bus size={14} />
                              {selectedTrip.busInfo}
                            </div>
                          </div>
                          <div>
                            <span className="fieldLabel">Check-in</span>
                            <div className="fieldValueCompact">
                              Ombordstigning öppnar ca 15–30 min före avgång.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="detailBlock">
                        <h3>Ombord</h3>
                        <ul className="bulletList">
                          {selectedTrip.onboardService.map((item) => (
                            <li key={item}>
                              <Coffee size={13} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="detailBlock fullWidthBlock">
                    <h3>Upphämtningsplatser</h3>
                    <ol className="pickupList">
                      {selectedTrip.pickupPoints.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ol>
                    <p className="tinyText">
                      Exakt hållplats och läge står även på din biljett.
                      I den skarpa versionen kan kunden klicka vidare till
                      karta och reseinformation.
                    </p>
                  </div>

                  <div className="detailBlock fullWidthBlock">
                    <h3>Avbokning & säkerhet</h3>
                    <div className="cancelGrid">
                      <div className="cancelBox">
                        <ShieldCheck size={16} />
                        <div>
                          <div className="cancelTitle">
                            Avbokningsregler (demo)
                          </div>
                          <p className="cancelText">
                            I skarpt läge visar vi exakt vad som gäller för
                            just den här resan – t.ex. sista avbokningsdag och
                            om kunden har avbokningsskydd.
                          </p>
                        </div>
                      </div>
                      <div className="cancelBox">
                        <Info size={16} />
                        <div>
                          <div className="cancelTitle">Kontakt vid frågor</div>
                          <p className="cancelText">
                            Här kan vi lägga direktlänk till chatt, telefon
                            eller kontaktformulär hos Helsingbuss kundteam om
                            något behöver ändras inför resan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <p className="footnote">
                <Info size={13} />
                <span>
                  I den riktiga versionen hämtas alla kommande resor direkt från
                  bokningssystemet. Den här sidan är bara en demo för att visa
                  struktur och design.
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

        .tagDot.confirmed {
          background: #16a34a;
        }
        .tagDot.pending {
          background: #facc15;
        }
        .tagDot.cancelled {
          background: #b91c1c;
        }

        .tripsLayout {
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

        .tripsListCard {
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

        .tripList {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tripItem {
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

        .tripItem:hover {
          border-color: #cbd5f5;
          background: #ffffff;
        }

        .tripItemActive {
          border-color: #007764;
          box-shadow: 0 0 0 1px #00776433;
          background: #ffffff;
        }

        .tripItemHeader {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .tripTitleBlock {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tripTitle {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .tripSubtitle {
          font-size: 12px;
          color: #6b7280;
        }

        .tripDate {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #374151;
        }

        .tripMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          font-size: 12px;
          color: #4b5563;
        }

        .tripMetaRow {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .tripFooterRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }

        .statusPillSmall {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          padding: 4px 9px;
          border-radius: 999px;
          background: #eef2ff;
          color: #111827;
        }

        .statusDot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
        }
        .dotConfirmed {
          background: #16a34a;
        }
        .dotPending {
          background: #facc15;
        }
        .dotCancelled {
          background: #b91c1c;
        }

        .tinyHint {
          font-size: 11px;
          color: #9ca3af;
        }

        .tripDetailCard {
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

        .statusPill.confirmed {
          background: #dcfce7;
          color: #166534;
        }
        .statusPill.pending {
          background: #fef9c3;
          color: #92400e;
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

        .busInfo {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .ticketNumberRow {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 6px;
        }

        .ticketNumberValue {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .bulletList {
          list-style: none;
          padding: 0;
          margin: 4px 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #374151;
        }

        .bulletList li {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .fullWidthBlock {
          margin-top: 14px;
        }

        .pickupList {
          margin: 4px 0 4px 18px;
          padding: 0;
          font-size: 12px;
          color: #111827;
        }

        .tinyText {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }

        .cancelGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 4px;
        }

        .cancelBox {
          display: flex;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          font-size: 12px;
          color: #374151;
        }

        .cancelTitle {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .cancelText {
          margin: 0;
          font-size: 12px;
          color: #4b5563;
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
          .tripsLayout {
            grid-template-columns: minmax(0, 1fr);
          }
          .detailsGrid {
            grid-template-columns: minmax(0, 1fr);
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
