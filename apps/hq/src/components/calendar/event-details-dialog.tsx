"use client";

import { useState } from "react";
import { X, Trash2, Edit2 } from "lucide-react";
import type { CalendarEvent } from "@/src/types/calendar";
import { EventFormDialog } from "./event-form-dialog";

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const startTime = new Date(event.start_at);
  const endTime = new Date(event.end_at);
  const dateLabel = startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = event.all_day
    ? "All day"
    : `${startTime.getHours().toString().padStart(2, "0")}:${startTime
        .getMinutes()
        .toString()
        .padStart(2, "0")} - ${endTime.getHours().toString().padStart(2, "0")}:${endTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      onOpenChange(false);
      setIsDeleting(false);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete event");
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[#1a2326] p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--hq-cream)]">{event.title}</h2>
                <p className="mt-1 text-sm text-[var(--hq-muted)]">
                  {dateLabel} • {timeLabel}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-md p-1 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {event.description && (
              <div className="mb-4">
                <p className="text-sm text-[var(--hq-muted)] leading-6">{event.description}</p>
              </div>
            )}

            <div className="mb-6 space-y-2">
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-[var(--hq-muted)]">
                  <span>📍</span> {event.location}
                </div>
              )}
              {event.category && (
                <div className="flex items-center gap-2 text-sm text-[var(--hq-muted)]">
                  <span>🏷️</span> {event.category}
                </div>
              )}
            </div>

            {isDeleting ? (
              <div className="rounded-lg bg-red-900/20 p-4">
                <p className="mb-3 text-sm text-red-300">Delete this event?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 rounded-md border border-[var(--hq-line)] px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[#8cbde0] px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-[#a8cde8]"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="flex items-center justify-center gap-2 rounded-md border border-[var(--hq-line)] px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <EventFormDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        initialEvent={event}
        onSuccess={() => {
          setIsEditing(false);
          onOpenChange(false);
          window.location.reload();
        }}
      />
    </>
  );
}
