// src/pages/mina-sidor/quiz-tavlingar-demo.tsx
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
  Gamepad2,
  HelpCircle,
  Award,
} from "lucide-react";

const fakeUser = {
  firstName: "Demo",
  lastName: "Resenär",
  level: "Silvermedlem",
};

const activeQuizzes = [
  {
    id: 1,
    title: "Stora Skånequizet",
    tag: "Månadens quiz",
    description:
      "Testa dina kunskaper om Skåne – från Kullaberg till Österlen. 10 snabba frågor om platser, dialekter och sevärdheter.",
    reward: "Upp till 300 bonuspoäng",
    status: "Pågår till 31 december",
    difficulty: "Medel",
  },
  {
    id: 2,
    title: "PrideXpress – Love & History",
    tag: "PrideXpress",
    description:
      "Frågor om Pride, historia och viktiga årtal. Perfekt inför din resa med PrideXpress by Helsingbuss.",
    reward: "Extra poäng på PrideXpress-biljetter",
    status: "Pågår hela Pride-säsongen",
    difficulty: "Lätt",
  },
  {
    id: 3,
    title: "Vinterresa & Ullared-special",
    tag: "Kampanjquiz",
    description:
      "Hur mycket kan du om bussresor, säkerhet och smarta shoppingtips? Spela och tävla om rabatt på din nästa shoppingresa.",
    reward: "50 kr rabattkod (utlottning)",
    status: "Nästa dragning om 5 dagar",
    difficulty: "Medel",
  },
];

const quizStats = {
  played: 7,
  correctRate: 82,
  rank: 23,
  totalPlayers: 812,
};

const recentResults = [
  {
    id: 1,
    date: "10 dec 2025",
    title: "Stora Skånequizet",
    score: "8 / 10 rätt",
    points: 120,
  },
  {
    id: 2,
    date: "1 nov 2025",
    title: "PrideXpress – Love & History",
    score: "9 / 10 rätt",
    points: 150,
  },
  {
    id: 3,
    date: "15 okt 2025",
    title: "Ullared smart shop",
    score: "7 / 10 rätt",
    points: 90,
  },
];

export default function QuizTavlingarDemo() {
  const isDemo = true;

  return (
    <>
      <Head>
        <title>Demo – Quiz & tävlingar | Helsingbuss</title>
      </Head>

      <div className="page">
        <div className="shell">
          {isDemo && (
            <div className="demoBanner">
              <strong>Demo-version</strong> – den här sidan visar ett exempel
              på hur <strong>Quiz & tävlingar</strong> kan se ut i Mina sidor.
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
            {/* SIDOMENY – samma som på de andra sidorna */}
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
                <button className="sideNavItem" type="button">
                  <Star className="sideNavIcon" size={16} />
                  <span>Intjänad poäng</span>
                </button>
                <button
                  className="sideNavItem sideNavItemActive"
                  type="button"
                >
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

            {/* CONTENT – QUIZ & TÄVLINGAR */}
            <section className="content">
              <header className="contentHeader">
                <div>
                  <p className="breadcrumb">
                    Mina sidor · Quiz & tävlingar {isDemo ? "· Demo" : ""}
                  </p>
                  <h1 className="contentTitle">Quiz & tävlingar</h1>
                  <p className="contentSub">
                    Här samlar vi alla quiz, kampanjer och tävlingar kopplade
                    till Helsingbuss. Kunden kan spela quiz, samla extra poäng,
                    delta i utlottningar och följa sina resultat – allt på ett
                    ställe.
                  </p>
                </div>

                <div className="tagStack">
                  <span className="tag">
                    <span className="tagDot pride" />
                    PrideXpress
                  </span>
                  <span className="tag">
                    <span className="tagDot green" />
                    Kundklubb & bonus
                  </span>
                </div>
              </header>

              <div className="quizLayout">
                {/* Vänster: Aktiva quiz & kampanjer */}
                <article className="card">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Pågående quiz & kampanjer</h2>
                    <span className="chip">
                      <Gamepad2 size={14} />
                      Spela direkt i appen eller på webben
                    </span>
                  </div>

                  <p className="cardTextMuted">
                    I skarpt läge visas här alla quiz som är aktiva just nu.
                    Kunden kan klicka sig vidare, svara på frågor och samla
                    extra poäng till sitt konto hos Helsingbuss.
                  </p>

                  <div className="quizCards">
                    {activeQuizzes.map((quiz) => (
                      <div key={quiz.id} className="quizCard">
                        <div className="quizCardHeader">
                          <div className="quizTitleBlock">
                            <div className="quizTag">{quiz.tag}</div>
                            <h3 className="quizTitle">{quiz.title}</h3>
                          </div>
                          <span className="quizDifficulty">
                            Svårighetsgrad: {quiz.difficulty}
                          </span>
                        </div>

                        <p className="quizDescription">{quiz.description}</p>

                        <div className="quizMetaRow">
                          <div className="quizMeta">
                            <span className="quizMetaLabel">Belöning</span>
                            <span className="quizMetaValue">
                              {quiz.reward}
                            </span>
                          </div>
                          <div className="quizMeta">
                            <span className="quizMetaLabel">Status</span>
                            <span className="quizMetaValue quizMetaStatus">
                              {quiz.status}
                            </span>
                          </div>
                        </div>

                        <div className="quizFooter">
                          <button
                            type="button"
                            className="quizButton"
                            onClick={() =>
                              alert(
                                "I demoversionen går det inte att starta quiz – här kommer en länk till riktiga frågorna sen."
                              )
                            }
                          >
                            Starta quiz (demo)
                          </button>
                          <button
                            type="button"
                            className="quizLinkButton"
                            onClick={() =>
                              alert(
                                "Här kan du i skarpt läge visa regler, villkor och tidigare vinnare."
                              )
                            }
                          >
                            Visa regler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Höger: Dina resultat */}
                <article className="card">
                  <div className="cardHeaderRow">
                    <h2 className="cardTitle">Dina quizresultat (demo)</h2>
                    <span className="chip">
                      <Award size={14} />
                      Ranking & bonuspoäng
                    </span>
                  </div>

                  <div className="statsGrid">
                    <div className="statBox">
                      <div className="statLabel">Spelade quiz</div>
                      <div className="statValue">{quizStats.played}</div>
                      <div className="statSub">Senaste 12 månaderna</div>
                    </div>
                    <div className="statBox">
                      <div className="statLabel">Genomsnittlig träffsäkerhet</div>
                      <div className="statValue">
                        {quizStats.correctRate}%
                      </div>
                      <div className="statSub">Rätt svar per quiz</div>
                    </div>
                    <div className="statBox">
                      <div className="statLabel">Ranking</div>
                      <div className="statValue">
                        #{quizStats.rank}
                      </div>
                      <div className="statSub">
                        av {quizStats.totalPlayers.toLocaleString("sv-SE")}{" "}
                        spelare
                      </div>
                    </div>
                  </div>

                  <p className="cardTextMuted">
                    I verkliga systemet kan kunden se hur quizresultat påverkar
                    bonus – till exempel extra poäng på vissa linjer eller
                    kampanjer kopplade till PrideXpress.
                  </p>

                  <div className="historyTable">
                    <div className="historyHeader">
                      <span>Datum</span>
                      <span>Quiz</span>
                      <span className="historyPointsCol">Poäng</span>
                    </div>
                    {recentResults.map((row) => (
                      <div className="historyRow" key={row.id}>
                        <div className="historyDate">{row.date}</div>
                        <div className="historyInfo">
                          <div className="historyTitle">{row.title}</div>
                          <div className="historySub">{row.score}</div>
                        </div>
                        <div className="historyPoints">
                          +{row.points.toLocaleString("sv-SE")} p
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              {/* Info om regler */}
              <article className="card cardInfo">
                <div className="infoRow">
                  <div className="infoIcon">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h2 className="infoTitle">
                      Så fungerar quiz & tävlingar hos Helsingbuss (demo)
                    </h2>
                    <p className="infoText">
                      I den skarpa versionen kopplar vi ihop quiz med ditt
                      medlemskap i Helsingbuss Kundklubb. Du kan till exempel
                      få extra poäng på utvalda resor, delta i utlottningar av
                      presentkort eller vinna PrideXpress-paket. Här kan vi
                      också visa tydliga{" "}
                      <strong>villkor, vinstskatt och hur vi kontaktar
                      vinnare</strong>.
                    </p>
                    <p className="infoText">
                      Denna sida är en demo och visar endast layout och
                      innehållstyper – inga riktiga tävlingar eller
                      dragningar genomförs här.
                    </p>
                  </div>
                </div>
              </article>
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

        .tagDot.pride {
          background: linear-gradient(90deg, #ec4899, #6366f1);
        }
        .tagDot.green {
          background: #10b981;
        }

        .quizLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
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

        .quizCards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quizCard {
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          padding: 12px 12px 10px;
          background: #f9fafb;
        }

        .quizCardHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
        }

        .quizTitleBlock {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .quizTag {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 999px;
        }

        .quizTitle {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }

        .quizDifficulty {
          font-size: 11px;
          color: #6b7280;
        }

        .quizDescription {
          margin: 0 0 6px 0;
          font-size: 13px;
          color: #4b5563;
        }

        .quizMetaRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }

        .quizMeta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
        }

        .quizMetaLabel {
          color: #6b7280;
        }

        .quizMetaValue {
          color: #111827;
          font-weight: 500;
        }

        .quizMetaStatus {
          color: #0369a1;
        }

        .quizFooter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .quizButton {
          border: none;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: #007764;
          color: #ffffff;
        }

        .quizButton:hover {
          background: #006254;
        }

        .quizLinkButton {
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          border: none;
          background: transparent;
          color: #007764;
          cursor: pointer;
        }

        .quizLinkButton:hover {
          text-decoration: underline;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 6px 0 10px;
        }

        .statBox {
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
        }

        .statLabel {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .statValue {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .statSub {
          font-size: 11px;
          color: #6b7280;
        }

        .historyTable {
          margin-top: 8px;
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

        .cardInfo {
          margin-top: 4px;
        }

        .infoRow {
          display: flex;
          gap: 10px;
        }

        .infoIcon {
          margin-top: 2px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4338ca;
          flex-shrink: 0;
        }

        .infoTitle {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .infoText {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #4b5563;
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
          .quizLayout {
            grid-template-columns: minmax(0, 1fr);
          }
          .statsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
          .statsGrid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </>
  );
}
