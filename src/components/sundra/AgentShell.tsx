// src/components/sundra/AgentShell.tsx
import React from "react";
import { Shell } from "@/components/sundra/Shell";
import { SUNDRa_AGENT_NAV } from "@/modules/sundra/shared/nav";

export function AgentShell({ children }: { children: React.ReactNode }) {
  return (
    <Shell title="Sundra – Bokningsagent" navItems={SUNDRa_AGENT_NAV}>
      {children}
    </Shell>
  );
}
