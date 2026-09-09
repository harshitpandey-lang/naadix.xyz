import { createClient } from "@/src/lib/supabase/server";
import type { CalendarEvent, CalendarEventInput, CalendarEventUpdate } from "@/src/types/calendar";
import type { Goal } from "@/src/types/goals";

async function currentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to sign in again.");
  return { supabase, userId: user.id };
}

export async function getCalendarEvent(id: string) {
  const { supabase, userId } = await currentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id,title,description,start_at,end_at,all_day,location,category,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) throw new Error("Unable to load event.");
  return data as CalendarEvent;
}

export async function getEventsForRange(start: string, end: string) {
  const { supabase } = await currentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id,title,description,start_at,end_at,all_day,location,category,created_at,updated_at")
    .lt("start_at", end)
    .gt("end_at", start)
    .order("start_at");
  if (error) throw new Error("Unable to load calendar events.");
  return (data ?? []) as CalendarEvent[];
}

export async function getScheduledGoalsForRange(start: string, end: string) {
  const { supabase } = await currentUserId();
  const { data, error } = await supabase
    .from("goals")
    .select("id,title,description,goal_type,target_value,unit,due_date,scheduled_start,scheduled_end,completed,completed_at,created_at")
    .not("scheduled_start", "is", null)
    .lt("scheduled_start", end)
    .gt("scheduled_end", start)
    .order("scheduled_start");
  if (error) throw new Error("Unable to load scheduled goals.");
  return (data ?? []) as Goal[];
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const { supabase, userId } = await currentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ ...input, user_id: userId })
    .select("id,title,description,start_at,end_at,all_day,location,category,created_at,updated_at")
    .single();
  if (error) throw new Error("Unable to create event.");
  return data as CalendarEvent;
}

export async function updateCalendarEvent(id: string, input: CalendarEventUpdate) {
  const { supabase, userId } = await currentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id,title,description,start_at,end_at,all_day,location,category,created_at,updated_at")
    .single();
  if (error) throw new Error("Unable to update event.");
  return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string) {
  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error("Unable to delete event.");
}
