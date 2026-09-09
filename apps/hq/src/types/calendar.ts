import type { Goal } from "./goals";

export type CalendarCategory = "College" | "Study" | "Project" | "Personal" | "Other";
export type CalendarView = "month" | "week" | "day";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string | null;
  category: CalendarCategory | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEventInput = Omit<CalendarEvent, "id" | "created_at" | "updated_at">;
export type CalendarEventUpdate = Partial<CalendarEventInput>;

export type ScheduledGoal = Goal & {
  kind: "goal";
};

export type CalendarEventWithKind = CalendarEvent & {
  kind: "event";
};

export type CalendarItem = CalendarEventWithKind | ScheduledGoal;

export function isCalendarEvent(item: CalendarItem): item is CalendarEventWithKind {
  return item.kind === "event";
}

export function isScheduledGoal(item: CalendarItem): item is ScheduledGoal {
  return item.kind === "goal";
}
