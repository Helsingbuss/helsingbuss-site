// src/components/sundra/Shell.tsx
import React from "react";
import { Topbar, type TopbarProps } from "@/components/sundra/Topbar";
import { Sidebar } from "@/components/sundra/Sidebar";

type ShellProps = {
  children: React.ReactNode;

  // Bakåtkompatibelt med hur ni anropat Shell innan
  title?: string;
  subtitle?: string;
  homeHref?: string;
  notificationsCount?: number;
  showSearch?: boolean;
  rightSlot?: React.ReactNode;

  // Behålls för framtiden (ni kan vilja styra nav senare),
  // men just nu bygger Sidebar sin meny beroende på /admin eller /agent.
  navItems?: any;
} & Pick<
  TopbarProps,
  "userInitial" | "userLabel"
>;

export function Shell({
  children,
  title,
  subtitle,
  homeHref,
  notificationsCount,
  showSearch,
  rightSlot,
  userInitial,
  userLabel,
}: ShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title={title}
        subtitle={subtitle}
        homeHref={homeHref}
        notificationsCount={notificationsCount}
        showSearch={showSearch}
        rightSlot={rightSlot}
        userInitial={userInitial}
        userLabel={userLabel}
      />

      <div className="relative">
        <Sidebar />

        {/* Sidebar är fixed och är w-72 på md+ → flytta innehåll åt höger då */}
        <main className="p-6 md:ml-72">{children}</main>
      </div>
    </div>
  );
}
