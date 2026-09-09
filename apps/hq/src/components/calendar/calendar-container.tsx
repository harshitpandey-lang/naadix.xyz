"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import { CalendarMonthView } from "./calendar-month-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarDayView } from "./calendar-day-view";
import { EventFormDialog } from "./event-form-dialog";
import { useCalendarData } from "./use-calendar-data";

import type { CalendarView } from "@/src/types/calendar";

export function CalendarContainer({
  timezone,
}: {
  timezone: string;
}) {
  const [view, setView] =
    useState<CalendarView>("month");

  const [date, setDate] =
    useState(() => new Date());

  const [showNewEventDialog, setShowNewEventDialog] =
    useState(false);

  const [isLoading, startTransition] =
    useTransition();

  const {
    events,
    goals,
    error,
  } = useCalendarData(date, view);

  const navigatePrevious = () => {
    startTransition(() => {
      const nextDate = new Date(date);

      if (view === "month") {
        nextDate.setMonth(
          nextDate.getMonth() - 1,
        );
      } else if (view === "week") {
        nextDate.setDate(
          nextDate.getDate() - 7,
        );
      } else {
        nextDate.setDate(
          nextDate.getDate() - 1,
        );
      }

      setDate(nextDate);
    });
  };

  const navigateNext = () => {
    startTransition(() => {
      const nextDate = new Date(date);

      if (view === "month") {
        nextDate.setMonth(
          nextDate.getMonth() + 1,
        );
      } else if (view === "week") {
        nextDate.setDate(
          nextDate.getDate() + 7,
        );
      } else {
        nextDate.setDate(
          nextDate.getDate() + 1,
        );
      }

      setDate(nextDate);
    });
  };

  const navigateToday = () => {
    startTransition(() => {
      setDate(new Date());
    });
  };

  const periodLabel =
    view === "month"
      ? new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(date)
      : view === "day"
        ? new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(date)
        : new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(date);

  return (
    <main className="hq-content">
      {/* ------------------------------------------------
          PAGE HEADER
      ------------------------------------------------ */}

      <section className="mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hq-accent)]">
              <CalendarDays size={13} />
              Workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[var(--hq-cream)] sm:text-4xl">
              Calendar
            </h1>

            <p className="mt-2 text-sm text-[var(--hq-muted)]">
              Your time, goals, and commitments in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowNewEventDialog(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--hq-accent)] px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:brightness-110"
          >
            <Plus size={15} />
            New event
          </button>
        </div>
      </section>

      {/* ------------------------------------------------
          CALENDAR TOOLBAR
      ------------------------------------------------ */}

      <section className="hq-panel rounded-lg">
        <div className="flex flex-col gap-3 border-b border-[var(--hq-line)] p-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={navigatePrevious}
              disabled={isLoading}
              className="grid h-8 w-8 place-items-center rounded-md text-[var(--hq-muted)] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              aria-label="Previous period"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={navigateToday}
              disabled={isLoading}
              className="h-8 rounded-md border border-[var(--hq-line)] px-3 text-xs font-medium text-[var(--hq-muted-strong)] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
            >
              Today
            </button>

            <button
              type="button"
              onClick={navigateNext}
              disabled={isLoading}
              className="grid h-8 w-8 place-items-center rounded-md text-[var(--hq-muted)] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              aria-label="Next period"
            >
              <ChevronRight size={16} />
            </button>

            <span className="ml-2 hidden text-sm font-medium text-[var(--hq-cream)] sm:inline">
              {periodLabel}
            </span>
          </div>

          {/* View switcher */}
          <div className="flex items-center rounded-md border border-[var(--hq-line)] bg-black/10 p-0.5">
            {(
              ["month", "week", "day"] as const
            ).map((calendarView) => (
              <button
                key={calendarView}
                type="button"
                onClick={() =>
                  setView(calendarView)
                }
                className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition ${
                  view === calendarView
                    ? "bg-white/[0.08] text-white"
                    : "text-[var(--hq-muted)] hover:text-white"
                }`}
              >
                {calendarView}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile period label */}
        <div className="border-b border-[var(--hq-line-soft)] px-4 py-3 sm:hidden">
          <p className="text-sm font-medium text-[var(--hq-cream)]">
            {periodLabel}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-b border-red-900/50 bg-red-900/10 px-4 py-3">
            <p className="text-xs text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Calendar */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--hq)]/70 backdrop-blur-[2px]">
              <div className="rounded-lg border border-[var(--hq-line)] bg-[var(--hq-panel)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--hq-line)] border-t-[var(--hq-accent)]" />
                  <span className="text-xs text-[var(--hq-muted)]">
                    Updating calendar...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {view === "month" && (
              <CalendarMonthView
                date={date}
                events={events}
                goals={goals}
              />
            )}

            {view === "week" && (
              <CalendarWeekView
                date={date}
                events={events}
                goals={goals}
              />
            )}

            {view === "day" && (
              <CalendarDayView
                date={date}
                events={events}
                goals={goals}
              />
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------
          EVENT DIALOG
      ------------------------------------------------ */}

      <EventFormDialog
        open={showNewEventDialog}
        onOpenChange={
          setShowNewEventDialog
        }
        onSuccess={() => {
          setShowNewEventDialog(false);

          startTransition(() => {
            setDate(
              new Date(date),
            );
          });
        }}
      />

      {/* Keep timezone consumed by this
          workspace without changing the
          existing calendar data contract. */}
      <span className="sr-only">
        Calendar timezone: {timezone}
      </span>
    </main>
  );
}
