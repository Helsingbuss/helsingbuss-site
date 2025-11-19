// src/components/Layout.tsx
import React, { ReactNode } from "react";
import Link from "next/link";
import Header from "./Header";
import {
  HomeIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  UsersIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

interface LayoutProps {
  children: ReactNode;
  active: string;
}

export default function Layout({ children, active }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Gemensam topp-rad */}
      <Header />

      <div className="flex flex-1 pt-[60px]">
        {/* Sidebar (klistrad meny) */}
        <aside className="fixed top-[60px] left-0 w-[303px] h-[calc(100vh-60px)] bg-white border-r border-slate-200 px-4 py-6 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Navigering
          </p>

          <nav className="space-y-1">
            <SidebarLink
              href="/dashboard"
              label="Hem"
              active={active === "dashboard"}
              icon={<HomeIcon className="h-5 w-5" />}
            />

            <SidebarLink
              href="/profile"
              label="Min användarprofil"
              active={active === "profile"}
              icon={<UserCircleIcon className="h-5 w-5" />}
            />

            <SidebarLink
              href="/company"
              label="Företagsinställningar"
              active={active === "company"}
              icon={<BuildingOfficeIcon className="h-5 w-5" />}
            />

            <SidebarLink
              href="/users"
              label="Hantera användare"
              active={active === "users"}
              icon={<UsersIcon className="h-5 w-5" />}
            />

            <SidebarLink
              href="/tickets"
              label="Paketresor"
              active={active === "tickets"}
              icon={<TicketIcon className="h-5 w-5" />}
            />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-[303px] py-10 px-6">{children}</main>
      </div>
    </div>
  );
}

type SidebarLinkProps = {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
};

function SidebarLink({ href, label, active, icon }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
      ${
        active
          ? "bg-[#1D2937] text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border
        ${
          active
            ? "border-white/40 bg-white/10 text-white"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
