import type { ReactNode } from "react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardMobileNavigation } from "./dashboard-mobile-navigation";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardShell({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--hq)] text-white lg:flex">
      <DashboardSidebar name={name} role={role} />
      <div className="min-w-0 flex-1">
        <DashboardHeader name={name} />
        <DashboardMobileNavigation />
        {children}
      </div>
    </div>
  );
}
