import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Goal,
  NotebookPen,
  Sparkles,
} from "lucide-react";

import {
  getEventsForRange,
  getScheduledGoalsForRange,
} from "@/src/lib/calendar";
import { getGoals } from "@/src/lib/goals";

async function getTodaySchedule() {
  try {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      events,
      scheduledGoals,
      allGoals,
    ] = await Promise.all([
      getEventsForRange(
        today.toISOString(),
        tomorrow.toISOString(),
      ),
      getScheduledGoalsForRange(
        today.toISOString(),
        tomorrow.toISOString(),
      ),
      getGoals(),
    ]);

    const todayDate =
      today.toISOString().split("T")[0];

    const todayGoals = allGoals.filter(
      (goal) => goal.due_date === todayDate,
    );

    return {
      events: events.sort(
        (a, b) =>
          new Date(a.start_at).getTime() -
          new Date(b.start_at).getTime(),
      ),
      scheduledGoals: scheduledGoals.sort(
        (a, b) =>
          new Date(a.scheduled_start!).getTime() -
          new Date(b.scheduled_start!).getTime(),
      ),
      todayGoals,
    };
  } catch (error) {
    console.error(
      "Failed to fetch today schedule:",
      error,
    );

    return {
      events: [],
      scheduledGoals: [],
      todayGoals: [],
    };
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

export async function DashboardOverview({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const {
    events,
    scheduledGoals,
    todayGoals,
  } = await getTodaySchedule();

  const completedToday = todayGoals.filter(
    (goal) => goal.completed,
  ).length;

  const totalToday = todayGoals.length;

  const progressPercent =
    totalToday > 0
      ? Math.round(
          (completedToday / totalToday) * 100,
        )
      : 0;

  const scheduleItems = [
    ...events.map((event) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      time: event.start_at,
    })),
    ...scheduledGoals.map((goal) => ({
      id: goal.id,
      type: "goal" as const,
      title: goal.title,
      time: goal.scheduled_start!,
    })),
  ].sort(
    (a, b) =>
      new Date(a.time).getTime() -
      new Date(b.time).getTime(),
  );

  const firstName =
    name.trim().split(" ")[0] || name;

  return (
    <main className="hq-content">
      {/* ------------------------------------------------
          PAGE INTRO
      ------------------------------------------------ */}

      <section className="mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hq-accent)]">
              <Sparkles size={13} />
              Today
            </div>

            <h2 className="text-3xl font-semibold tracking-[-0.055em] text-[var(--hq-cream)] sm:text-4xl">
              Your workspace for the day.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--hq-muted)]">
              Welcome back, {firstName}. Keep an eye on
              what matters today and move through it at
              your own pace.
            </p>
          </div>

          <div className="shrink-0 rounded-lg border border-[var(--hq-line)] bg-[var(--hq-panel)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hq-muted)]">
              Today&apos;s progress
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--hq-cream)]">
                {progressPercent}%
              </span>

              <span className="text-xs text-[var(--hq-muted)]">
                {completedToday}/{totalToday} goals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------
          OVERVIEW CARDS
      ------------------------------------------------ */}

      <section
        aria-label="Today overview"
        className="grid gap-3 md:grid-cols-3"
      >
        <article className="hq-panel hq-hover rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--hq-accent-soft)] text-[var(--hq-accent)]">
              <Goal size={16} />
            </span>

            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--hq-muted)]">
              Goals
            </span>
          </div>

          <p className="mt-5 text-2xl font-semibold text-[var(--hq-cream)]">
            {completedToday}
            <span className="text-base font-normal text-[var(--hq-muted)]">
              {" "}
              / {totalToday}
            </span>
          </p>

          <p className="mt-1 text-xs text-[var(--hq-muted)]">
            completed today
          </p>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-[var(--hq-green)] transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </article>

        <article className="hq-panel hq-hover rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--hq-accent-soft)] text-[var(--hq-accent)]">
              <CalendarDays size={16} />
            </span>

            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--hq-muted)]">
              Schedule
            </span>
          </div>

          <p className="mt-5 text-2xl font-semibold text-[var(--hq-cream)]">
            {scheduleItems.length}
          </p>

          <p className="mt-1 text-xs text-[var(--hq-muted)]">
            items scheduled today
          </p>
        </article>

        <article className="hq-panel hq-hover rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--hq-accent-soft)] text-[var(--hq-accent)]">
              <CheckCircle2 size={16} />
            </span>

            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--hq-muted)]">
              Status
            </span>
          </div>

          <p className="mt-5 text-2xl font-semibold text-[var(--hq-cream)]">
            {totalToday === 0
              ? "Open"
              : progressPercent === 100
                ? "Done"
                : "In progress"}
          </p>

          <p className="mt-1 text-xs text-[var(--hq-muted)]">
            {totalToday === 0
              ? "Nothing is blocking your day."
              : "Keep moving through today's plan."}
          </p>
        </article>
      </section>

      {/* ------------------------------------------------
          TODAY'S PLAN
      ------------------------------------------------ */}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hq-muted)]">
              Workspace
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[var(--hq-cream)]">
              Today&apos;s plan
            </h2>
          </div>

          <Link
            href="/dashboard/calendar"
            className="flex items-center gap-1 text-xs text-[var(--hq-muted)] transition hover:text-white"
          >
            Open calendar
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="hq-panel overflow-hidden rounded-lg">
          {scheduleItems.length > 0 ? (
            <div>
              {scheduleItems.map(
                (item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 px-4 py-4 sm:px-5 ${
                      index > 0
                        ? "border-t border-[var(--hq-line-soft)]"
                        : ""
                    }`}
                  >
                    <div className="flex w-16 shrink-0 items-center gap-2 text-xs text-[var(--hq-muted)]">
                      <Clock3 size={13} />
                      {formatTime(item.time)}
                    </div>

                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                        item.type === "goal"
                          ? "bg-[var(--hq-accent-soft)] text-[var(--hq-accent)]"
                          : "bg-white/[0.045] text-[var(--hq-muted-strong)]"
                      }`}
                    >
                      {item.type === "goal" ? (
                        <Goal size={14} />
                      ) : (
                        <CalendarDays size={14} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[var(--hq-cream)]">
                        {item.title}
                      </p>

                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--hq-muted)]">
                        {item.type === "goal"
                          ? "Scheduled goal"
                          : "Calendar event"}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto grid h-9 w-9 place-items-center rounded-md bg-white/[0.04] text-[var(--hq-muted)]">
                <CalendarDays size={17} />
              </div>

              <p className="mt-3 text-sm text-[var(--hq-cream)]">
                Your day is clear.
              </p>

              <p className="mt-1 text-xs text-[var(--hq-muted)]">
                Nothing is scheduled for today.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------
          QUICK ACCESS
      ------------------------------------------------ */}

      <section className="mt-10">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hq-muted)]">
            Navigate
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[var(--hq-cream)]">
            Quick access
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/calendar"
            className="hq-panel hq-hover group rounded-lg p-4"
          >
            <CalendarDays
              size={18}
              className="text-[var(--hq-accent)]"
            />

            <p className="mt-5 text-sm font-medium text-[var(--hq-cream)]">
              Calendar
            </p>

            <p className="mt-1 text-xs text-[var(--hq-muted)]">
              Plan your time
            </p>

            <ArrowUpRight
              size={14}
              className="mt-4 text-[var(--hq-muted)] transition group-hover:text-white"
            />
          </Link>

          <Link
            href="/dashboard/goals"
            className="hq-panel hq-hover group rounded-lg p-4"
          >
            <Goal
              size={18}
              className="text-[var(--hq-accent)]"
            />

            <p className="mt-5 text-sm font-medium text-[var(--hq-cream)]">
              Goals
            </p>

            <p className="mt-1 text-xs text-[var(--hq-muted)]">
              Keep moving forward
            </p>

            <ArrowUpRight
              size={14}
              className="mt-4 text-[var(--hq-muted)] transition group-hover:text-white"
            />
          </Link>

          <div className="hq-panel rounded-lg p-4 opacity-70">
            <FolderKanban
              size={18}
              className="text-[var(--hq-muted-strong)]"
            />

            <p className="mt-5 text-sm font-medium text-[var(--hq-cream)]">
              Projects
            </p>

            <p className="mt-1 text-xs text-[var(--hq-muted)]">
              Coming to your workspace
            </p>
          </div>

          <div className="hq-panel rounded-lg p-4 opacity-70">
            <NotebookPen
              size={18}
              className="text-[var(--hq-muted-strong)]"
            />

            <p className="mt-5 text-sm font-medium text-[var(--hq-cream)]">
              Journal
            </p>

            <p className="mt-1 text-xs text-[var(--hq-muted)]">
              Coming to your workspace
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------
          PROFILE
      ------------------------------------------------ */}

      <section className="mt-10 border-t border-[var(--hq-line)] pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d9e4ea] text-xs font-bold text-[var(--navy)]">
              HP
            </span>

            <div>
              <p className="text-sm font-medium text-[var(--hq-cream)]">
                {name}
              </p>

              <p className="mt-0.5 text-xs text-[var(--hq-muted)]">
                {role}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--hq-muted)] transition hover:text-white"
          >
            View public profile
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </main>
  );
}
