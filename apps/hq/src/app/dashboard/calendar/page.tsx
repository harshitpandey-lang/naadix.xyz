import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarContainer } from "@/src/components/calendar/calendar-container";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { profile as publicProfile } from "@/src/data/profile/profile";
import { getOrCreateProfile } from "@/src/lib/profile";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Calendar | Personal HQ | NAADIX",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!isSupabaseConfigured()) redirect("/login?next=/dashboard/calendar");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims.sub === "string" ? claims.claims.sub : null;
  if (!userId) redirect("/login?next=/dashboard/calendar");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/calendar");

  const privateProfile = await getOrCreateProfile(user);
  const name = privateProfile?.display_name ?? publicProfile.name;
  const role = publicProfile.headline.split("|")[0].trim();
  const timezone = privateProfile?.timezone ?? "Asia/Kolkata";

  return (
    <DashboardShell name={name} role={role}>
      <CalendarContainer timezone={timezone} />
    </DashboardShell>
  );
}
