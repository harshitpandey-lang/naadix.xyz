"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { getStatusChipClass, getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";

interface EditingState {
  field: string | null;
  value: unknown;
}

interface ProjectPropertyEditorProps {
  project: ProjectRecord;
  onSave?: (updates: Partial<ProjectRecord>) => Promise<void>;
}

function safeDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function compactList(values?: string[] | null) {
  if (!Array.isArray(values) || values.length === 0) {
    return "—";
  }

  return values.filter(Boolean).join(" · ");
}

export function ProjectPropertyEditor({
  project,
  onSave,
}: ProjectPropertyEditorProps) {
  const [editing, setEditing] = useState<EditingState>({ field: null, value: null });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = (field: string, value: unknown) => {
    setEditing({ field, value });
    setError(null);
  };

  const handleSave = async () => {
    if (!editing.field) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave?.({
        [editing.field]: editing.value,
      });
      setEditing({ field: null, value: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const properties = [
    { key: "status", label: "Status", type: "select" as const },
    { key: "category", label: "Category", type: "text" as const },
    { key: "domain", label: "Domain", type: "text" as const },
    { key: "technologies", label: "Technologies", type: "array" as const },
    { key: "skills", label: "Skills", type: "array" as const },
    { key: "created_at", label: "Start Date", type: "date" as const, editable: false },
    { key: "updated_at", label: "Last Updated", type: "date" as const, editable: false },
    { key: "my_role", label: "My Role", type: "text" as const },
    { key: "github_url", label: "GitHub", type: "url" as const },
    { key: "live_demo_url", label: "Live Demo", type: "url" as const },
  ];

  return (
    <section className="mt-8 rounded-md border border-[#29383d] bg-[#0f1719] p-4">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#91a6b2]">
        Properties
      </h2>

      {error && (
        <div className="mb-4 rounded-md border border-[#552b2d] bg-[#201314] px-3 py-2 text-xs text-[#f6c7c7]">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const isEditing = editing.field === property.key;
          const value = project[property.key as keyof ProjectRecord];
          const isEditable = property.editable !== false;

          return (
            <div
              key={property.key}
              className={`rounded-md border px-3 py-2.5 ${
                isEditing
                  ? "border-[#43545b] bg-[#101b1d]"
                  : "border-[#202a2d] bg-[#131d1f]"
              } ${isEditable ? "cursor-pointer hover:border-[#29383d]" : ""}`}
            >
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#53676f]">
                {property.label}
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  {property.type === "select" && property.key === "status" && (
                    <select
                      value={String(editing.value ?? "")}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-1 text-xs text-[#e5ded3] outline-none"
                    >
                      <option value="">Not set</option>
                      <option value="PLANNED">Planned</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  )}

                  {property.type === "text" && (
                    <input
                      type="text"
                      value={String(editing.value ?? "")}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-1 text-xs text-[#e5ded3] outline-none"
                      placeholder="Enter value"
                    />
                  )}

                  {property.type === "url" && (
                    <input
                      type="url"
                      value={String(editing.value ?? "")}
                      onChange={(e) =>
                        setEditing({ ...editing, value: e.target.value })
                      }
                      className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-1 text-xs text-[#e5ded3] outline-none"
                      placeholder="https://..."
                    />
                  )}

                  {property.type === "array" && (
                    <input
                      type="text"
                      value={
                        Array.isArray(editing.value)
                          ? editing.value.join(", ")
                          : ""
                      }
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          value: e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-1 text-xs text-[#e5ded3] outline-none"
                      placeholder="Comma-separated values"
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 rounded border border-[#29383d] bg-[#182124] px-2 py-1 text-[10px] font-medium text-[#91a6b2] hover:bg-[#202a2d] disabled:opacity-50"
                    >
                      {isSaving ? "…" : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditing({ field: null, value: null })}
                      className="rounded border border-[#29383d] px-2 py-1 text-[#667b84] hover:bg-[#182124] hover:text-[#e5ded3]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => isEditable && handleStartEdit(property.key, value)}
                  className="mt-1.5 min-h-[20px] text-sm text-[#e5ded3]"
                >
                  {property.key === "status" ? (
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(
                        project.status,
                      )}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  ) : property.type === "date" ? (
                    safeDate(value as string | null)
                  ) : property.type === "array" ? (
                    compactList(value as string[] | null)
                  ) : property.key.includes("url") ? (
                    value ? (
                      <Link
                        href={String(value)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]"
                      >
                        {String(value)}
                      </Link>
                    ) : (
                      "—"
                    )
                  ) : (
                    String(value ?? "—")
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
