"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent, CalendarView } from "@/src/types/calendar";
import type { Goal } from "@/src/types/goals";

export function useCalendarData(date: Date, view: CalendarView) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { startDate, endDate } = getDateRange(date, view);

        const response = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch calendar data");
        }

        const data = await response.json();
        setEvents(data.events || []);
        setGoals(data.goals || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date, view]);

  return { events, goals, error, isLoading };
}

function getDateRange(date: Date, view: CalendarView) {
  const startDate = new Date(date);
  const endDate = new Date(date);

  if (view === "month") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);
  } else if (view === "week") {
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek;
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek + 1));
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}
