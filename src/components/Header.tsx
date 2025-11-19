// src/components/Header.tsx
import React, { useState, ReactNode } from "react";
import Image from "next/image";
import QuickActionsMenu from "./QuickActionsMenu";
import {
  BellIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  PencilSquareIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

type HeaderProps = {
  profile?: {
    full_name?: string | null;
    company_name?: string | null;
    title?: string | null;
    employee_number?: string | null;
  };
};

export default function Header({ profile }: HeaderProps) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const router = useRouter();

  const userName = profile?.full_name ?? "Andreas Ekelöf";
  const companyName = profile?.title ?? profile?.company_name ?? "Helsingbuss";
  const employeeNumber = profile?.employee_number ?? "XXXXXXXX";

  const togglePanel = (panel: string) => {
    setHelpOpen(false);
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // till login
  };

  return (
    <>
      {/* TOPP-BAR */}
      <header className="bg-[#1D2937] text-white px-6 lg:px-8 py-3 flex justify-between items-center shadow fixed top-0 left-0 right-0 z-50 h-[60px]">
        {/* Logo */}
        <div className="flex items-center">
          <Image src="/vit_logo.png" alt="Helsingbuss" width={140} height={40} />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 relative">
          {/* Guida mig */}
          <button
            type="button"
            className="border border-white/60 rounded-full px-3.5 py-1 text-xs font-medium hover:bg-white hover:text-[#1D2937] transition"
          >
            Guida mig
          </button>

          {/* Skapa ny */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCreateMenuOpen((v) => !v);
                setActivePanel(null);
                setHelpOpen(false);
              }}
              className="bg-white text-[#1D2937] text-xs font-semibold rounded-full px-3.5 py-1 hover:bg-slate-100 transition inline-flex items-center gap-1"
            >
              <span className="text-base leading-none">+</span>
              <span>Skapa ny</span>
            </button>
            {createMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-xl shadow-lg z-50">
                <QuickActionsMenu />
              </div>
            )}
          </div>

          {/* Ikoner – rapporter, anteckningar, notiser, hjälp-dropdown */}
          <div className="flex items-center gap-1">
            <IconButton
              title="Rapporter"
              active={activePanel === "reports"}
              onClick={() => togglePanel("reports")}
            >
              <ChartBarIcon className="h-5 w-5" />
            </IconButton>

            <IconButton
              title="Anteckningar"
              active={activePanel === "notes"}
              onClick={() => togglePanel("notes")}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </IconButton>

            <IconButton
              title="Notifieringar"
              active={activePanel === "notifications"}
              onClick={() => togglePanel("notifications")}
            >
              <BellIcon className="h-5 w-5" />
            </IconButton>

            <div className="relative">
              <IconButton
                title="Hjälp"
                active={helpOpen}
                onClick={() => {
                  setHelpOpen((v) => !v);
                  setActivePanel(null);
                }}
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </IconButton>

              {helpOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-lg z-50 text-sm">
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50">
                    ✨ Fråga AI-assistenten
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 border-t border-slate-100">
                    📘 Hjälp
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profil – öppnar konto-panel */}
          <button
            type="button"
            onClick={() => togglePanel("account")}
            className="flex items-center gap-2 cursor-pointer pl-3 border-l border-white/20 ml-1"
          >
            <div className="flex flex-col items-end leading-tight">
              <span className="font-medium text-xs sm:text-sm">{userName}</span>
              <span className="text-[10px] sm:text-xs text-slate-200">
                {companyName}
              </span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-slate-100" />
          </button>
        </div>
      </header>

      {/* SIDOPANELER */}
      {activePanel && (
        <div className="fixed top-[60px] right-0 bottom-0 w-full max-w-sm bg-white shadow-xl border-l border-slate-200 z-40">
          {activePanel === "reports" && (
            <ReportsPanel onClose={() => setActivePanel(null)} />
          )}
          {activePanel === "notes" && (
            <NotesPanel onClose={() => setActivePanel(null)} />
          )}
          {activePanel === "notifications" && (
            <NotificationsPanel onClose={() => setActivePanel(null)} />
          )}
          {activePanel === "account" && (
            <AccountPanel
              onClose={() => setActivePanel(null)}
              userName={userName}
              companyName={companyName}
              employeeNumber={employeeNumber}
              onLogout={handleLogout}
            />
          )}
        </div>
      )}
    </>
  );
}

/* ---------- Hjälpkomponenter & paneler ---------- */

function IconButton({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-white transition 
      ${
        active
          ? "bg-white/20 border-white"
          : "bg-white/5 border-white/30 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

type PanelProps = {
  onClose: () => void;
};

function PanelShell({
  title,
  children,
  onClose,
}: PanelProps & { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Stäng
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

/* Rapporter */
function ReportsPanel({ onClose }: PanelProps) {
  return (
    <PanelShell title="Rapporter" onClose={onClose}>
      <div className="p-4 text-sm text-slate-700">
        <p className="text-xs text-slate-500 mb-2">
          Här kan du lägga dina rapport-listor senare.
        </p>
        <ul className="space-y-1">
          <li className="py-1 border-b border-slate-100">Trafivo – körjournal</li>
          <li className="py-1 border-b border-slate-100">Intäkter per linje</li>
          <li className="py-1 border-b border-slate-100">Offerter & bokningar</li>
          <li className="py-1">Ekonomiöversikt</li>
        </ul>
      </div>
    </PanelShell>
  );
}

/* Anteckningar */
function NotesPanel({ onClose }: PanelProps) {
  return (
    <PanelShell title="Anteckningar" onClose={onClose}>
      <div className="p-4 flex flex-col h-full">
        <button
          type="button"
          className="self-end mb-3 rounded-full bg-[#1D2937] text-white text-xs px-3 py-1 hover:bg-slate-900"
        >
          Ny anteckning
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-slate-500">
          <span>Det finns inga anteckningar</span>
        </div>
      </div>
    </PanelShell>
  );
}

/* Notiser */
function NotificationsPanel({ onClose }: PanelProps) {
  return (
    <PanelShell title="Notifieringar" onClose={onClose}>
      <div className="p-4 flex flex-col items-center justify-center h-full text-xs text-slate-500">
        <span>Det finns inga notifieringar</span>
      </div>
    </PanelShell>
  );
}

/* Konto / profil */
function AccountPanel({
  onClose,
  userName,
  companyName,
  employeeNumber,
  onLogout,
}: PanelProps & {
  userName: string;
  companyName: string;
  employeeNumber: string;
  onLogout: () => void;
}) {
  return (
    <PanelShell title={userName} onClose={onClose}>
      <div className="p-4 space-y-4 text-sm text-slate-800">
        <div>
          <p className="font-semibold">{userName}</p>
          <p className="text-xs text-slate-500">{companyName}</p>
          <p className="mt-1 text-xs text-slate-500">
            Anställningsnr: {employeeNumber}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <button
            onClick={onLogout}
            className="w-full justify-center px-3 py-2 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50"
          >
            Logga ut
          </button>
        </div>
      </div>
    </PanelShell>
  );
}
