import { createClient } from "@/src/lib/supabase/server";
import type { Goal, GoalInput } from "@/src/types/goals";

async function currentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to sign in again.");
  return { supabase, userId: user.id };
}

export async function getGoals() {
  const { supabase } = await currentUserId();
  const { data, error } = await supabase.from("goals").select("id,title,description,goal_type,target_value,unit,due_date,scheduled_start,scheduled_end,completed,completed_at,created_at").order("due_date").order("scheduled_start", { nullsFirst: false });
  if (error) throw new Error("Unable to load goals.");
  return (data ?? []) as Goal[];
}

export async function createGoal(input: GoalInput) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("goals").insert({ ...input, user_id: userId });
  if (error) throw new Error("Unable to create goal.");
}

export async function updateGoal(id: string, input: GoalInput) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("goals").update(input).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("Unable to update goal.");
}

export async function setGoalCompleted(id: string, completed: boolean) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("goals").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("Unable to update goal.");
}

export async function deleteGoal(id: string) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("Unable to delete goal.");
}
