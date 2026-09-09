"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectItem {
  id: string;
  project_id: string;
  section: string;
  title: string;
  description?: string | null;
  date?: string | null;
  status?: string | null;
  url?: string | null;
  image_url?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ProjectItemsManagerProps {
  project: ProjectRecord;
  items: ProjectItem[];
  onItemsChange?: () => void;
}

const ITEM_SECTIONS = [
  { value: "media", label: "Media / Images" },
  { value: "links", label: "Links / References" },
  { value: "learnings", label: "Learnings" },
  { value: "challenges", label: "Challenges" },
  { value: "timeline", label: "Timeline" },
  { value: "completed_work", label: "Completed Work" },
  { value: "current_work", label: "Current Work" },
];

const ITEM_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

export function ProjectItemsManager({
  project,
  items,
  onItemsChange,
}: ProjectItemsManagerProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemSection, setNewItemSection] = useState(ITEM_SECTIONS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newItemData, setNewItemData] = useState({
    title: "",
    description: "",
    date: "",
    status: "TODO",
    url: "",
    image_url: "",
    alt_text: "",
    caption: "",
  });

  const handleAddItem = async () => {
    if (!newItemData.title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.slug}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: newItemSection,
          title: newItemData.title,
          description: newItemData.description || null,
          date: newItemData.date || null,
          status: newItemData.status || null,
          url: newItemData.url || null,
          image_url: newItemData.image_url || null,
          alt_text: newItemData.alt_text || null,
          caption: newItemData.caption || null,
          position: items.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add item");
      }

      // Reset form
      setNewItemData({
        title: "",
        description: "",
        date: "",
        status: "TODO",
        url: "",
        image_url: "",
        alt_text: "",
        caption: "",
      });
      setIsAddingItem(false);

      // Refresh items
      onItemsChange?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const response = await fetch(
        `/api/projects/${project.slug}/items/${itemId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      onItemsChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete item",
      );
    }
  };

  // Group items by section
  const itemsBySection: Record<string, ProjectItem[]> = {};
  ITEM_SECTIONS.forEach((section) => {
    itemsBySection[section.value] = items.filter(
      (item) => item.section === section.value,
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-[var(--hq-cream)]">
          Project Items & Media
        </h3>

        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Item Sections */}
        <div className="space-y-3">
          {ITEM_SECTIONS.map((section) => {
            const sectionItems = itemsBySection[section.value] || [];
            const isExpanded = expandedSection === section.value;

            return (
              <div
                key={section.value}
                className="rounded-md border border-[var(--hq-line)] bg-[var(--hq-panel)] p-4"
              >
                <button
                  onClick={() =>
                    setExpandedSection(
                      isExpanded ? null : section.value,
                    )
                  }
                  className="flex w-full items-center justify-between text-left"
                >
                  <h4 className="font-medium text-[var(--hq-cream)]">
                    {section.label}
                  </h4>
                  <span className="text-xs text-[var(--hq-muted)]">
                    {sectionItems.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-2">
                    {sectionItems.length === 0 ? (
                      <p className="text-xs text-[var(--hq-muted)]">
                        No items in this section
                      </p>
                    ) : (
                      sectionItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-md border border-[var(--hq-line)] bg-[var(--hq)] p-3"
                        >
                          <GripVertical className="mt-1 h-4 w-4 shrink-0 text-[var(--hq-muted)]" />
                          <div className="flex-1">
                            <p className="font-medium text-[var(--hq-cream)]">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="mt-1 text-xs text-[var(--hq-muted)]">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="shrink-0 rounded-md p-1 text-[var(--hq-muted)] hover:bg-[var(--hq-line)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Item Form */}
        <div className="mt-6 rounded-md border border-[var(--hq-line)] bg-[var(--hq-panel)] p-4">
          {!isAddingItem ? (
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[var(--hq-line)] py-2 text-sm text-[var(--hq-muted)] hover:text-[var(--hq-cream)]"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--hq-cream)]">
                  Section
                </label>
                <select
                  value={newItemSection}
                  onChange={(e) => setNewItemSection(e.target.value)}
                  className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {ITEM_SECTIONS.map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--hq-cream)]">
                  Title *
                </label>
                <input
                  type="text"
                  value={newItemData.title}
                  onChange={(e) =>
                    setNewItemData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Item title"
                  className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--hq-cream)]">
                  Description
                </label>
                <textarea
                  value={newItemData.description}
                  onChange={(e) =>
                    setNewItemData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description"
                  rows={2}
                  className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              {newItemSection === "media" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--hq-cream)]">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={newItemData.image_url}
                      onChange={(e) =>
                        setNewItemData((prev) => ({
                          ...prev,
                          image_url: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--hq-cream)]">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={newItemData.alt_text}
                      onChange={(e) =>
                        setNewItemData((prev) => ({
                          ...prev,
                          alt_text: e.target.value,
                        }))
                      }
                      placeholder="Image description"
                      className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--hq-cream)]">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={newItemData.caption}
                      onChange={(e) =>
                        setNewItemData((prev) => ({
                          ...prev,
                          caption: e.target.value,
                        }))
                      }
                      placeholder="Image caption"
                      className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {newItemSection === "links" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--hq-cream)]">
                    URL
                  </label>
                  <input
                    type="url"
                    value={newItemData.url}
                    onChange={(e) =>
                      setNewItemData((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              )}

              {(newItemSection === "completed_work" ||
                newItemSection === "current_work" ||
                newItemSection === "challenges") && (
                <div>
                  <label className="block text-sm font-medium text-[var(--hq-cream)]">
                    Status
                  </label>
                  <select
                    value={newItemData.status}
                    onChange={(e) =>
                      setNewItemData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    {ITEM_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddingItem(false)}
                  className="flex-1 rounded border border-[var(--hq-line)] px-3 py-2 text-sm font-medium text-[var(--hq-cream)] hover:bg-[var(--hq-line)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={isLoading}
                  className="flex-1 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Item"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
