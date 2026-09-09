"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CalendarEvent, CalendarCategory } from "@/src/types/calendar";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEvent?: CalendarEvent | null;
  onSuccess?: () => void;
}

const CATEGORIES: CalendarCategory[] = ["College", "Study", "Project", "Personal", "Other"];

export function EventFormDialog({
  open,
  onOpenChange,
  initialEvent,
  onSuccess,
}: EventFormDialogProps) {
  const [formData, setFormData] = useState({
    title: initialEvent?.title ?? "",
    description: initialEvent?.description ?? "",
    startDate: initialEvent?.start_at ? new Date(initialEvent.start_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    startTime: initialEvent?.start_at ? new Date(initialEvent.start_at).toTimeString().slice(0, 5) : "09:00",
    endDate: initialEvent?.end_at ? new Date(initialEvent.end_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    endTime: initialEvent?.end_at ? new Date(initialEvent.end_at).toTimeString().slice(0, 5) : "10:00",
    allDay: initialEvent?.all_day ?? false,
    location: initialEvent?.location ?? "",
    category: (initialEvent?.category as CalendarCategory) ?? "Personal",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);

      // Validation
      if (!formData.title.trim()) {
        setError("Title is required");
        return;
      }

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (endDateTime <= startDateTime && !formData.allDay) {
        setError("End time must be after start time");
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        all_day: formData.allDay,
        location: formData.location.trim() || null,
        category: formData.category,
      };

      const url = initialEvent ? `/api/calendar/events/${initialEvent.id}` : "/api/calendar/events";
      const method = initialEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save event");
      }

      onOpenChange(false);
      onSuccess?.();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[#1a2326] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--hq-cream)]">
                {initialEvent ? "Edit Event" : "New Event"}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-md p-1 hover:bg-white/10 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8cbde0]">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mathematics Class"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white placeholder-[#4a5f66] focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8cbde0]">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes..."
                  rows={3}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white placeholder-[#4a5f66] focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  disabled={isSubmitting}
                  className="rounded border-[var(--hq-line)]"
                />
                <label htmlFor="allDay" className="text-sm text-[var(--hq-muted)]">
                  All day
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8cbde0]">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                  />
                </div>
                {!formData.allDay && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8cbde0]">Start Time *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      disabled={isSubmitting}
                      className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8cbde0]">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                  />
                </div>
                {!formData.allDay && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8cbde0]">End Time *</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      disabled={isSubmitting}
                      className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8cbde0]">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Room 101"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white placeholder-[#4a5f66] focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8cbde0]">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CalendarCategory })}
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-md border border-[var(--hq-line)] bg-[#0f1315] px-3 py-2 text-sm text-white focus:border-[#8cbde0] focus:outline-none disabled:opacity-50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-md bg-red-900/20 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-md border border-[var(--hq-line)] px-4 py-2 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-md bg-[#8cbde0] px-4 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-[#a8cde8] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : initialEvent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
