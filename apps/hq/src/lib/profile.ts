import type { User } from "@supabase/supabase-js";
import { profile as publicProfile } from "@/src/data/profile/profile";
import { createClient } from "./supabase/server";

export type PrivateProfile = {
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
};

export async function getOrCreateProfile(user: User): Promise<PrivateProfile | null> {
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;
  if (readError && readError.code !== "PGRST116") return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, display_name: publicProfile.name, timezone: "Asia/Kolkata" })
    .select("display_name, username, avatar_url, timezone")
    .single();

  if (!error) return data;

  // A second request may have created the profile after the initial read.
  // Re-read on a unique-constraint conflict rather than treating it as unavailable.
  if (error.code === "23505") {
    const { data: concurrentProfile } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url, timezone")
      .eq("user_id", user.id)
      .maybeSingle();

    return concurrentProfile;
  }

  return null;
}
