import type { Metadata } from "next";
import { DashboardOverview } from "@/src/components/dashboard/dashboard-overview";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { requireUser } from "@/src/lib/require-user";

export const metadata: Metadata = { title: "Today", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function TodayPage() { const { user } = await requireUser("/today"); const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Founder"; return <DashboardShell name={name} role="Founder, NaadiX"><DashboardOverview name={name} role="Founder, NaadiX" /></DashboardShell>; }
