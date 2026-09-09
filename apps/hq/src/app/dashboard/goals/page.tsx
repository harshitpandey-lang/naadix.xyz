import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { GoalsWorkspace } from "@/src/components/goals/goals-workspace";
import { profile as publicProfile } from "@/src/data/profile/profile";
import { getGoals } from "@/src/lib/goals";
import { getOrCreateProfile } from "@/src/lib/profile";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Goals | Personal HQ | NAADIX",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/dashboard/goals");
  }

  const supabase = await createClient();

  const { data: claims } =
    await supabase.auth.getClaims();

  const userId =
    typeof claims?.claims.sub === "string"
      ? claims.claims.sub
      : null;

  if (!userId) {
    redirect("/login?next=/dashboard/goals");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/goals");
  }

  const [privateProfile, goals] =
    await Promise.all([
      getOrCreateProfile(user),
      getGoals(),
    ]);

  const name =
    privateProfile?.display_name ??
    publicProfile.name;

  const role =
    publicProfile.headline
      .split("|")[0]
      .trim();

  return (
    <DashboardShell
      name={name}
      role={role}
    >
      <GoalsWorkspace
        initialGoals={goals}
      />
    </DashboardShell>
  );
}
