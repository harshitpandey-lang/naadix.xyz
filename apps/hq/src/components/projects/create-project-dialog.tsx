"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  "Robotics & Embedded Systems",
  "AI & Automation",
  "Web & EdTech",
  "Sustainability / AgriTech",
];

const STATUSES = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    category: CATEGORIES[0],
    status: "PLANNED",
    progress: 0,
  });

  const handleInputChange = (
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("Project name is required");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const newProject = await response.json();

      // Close dialog and redirect to edit page
      onOpenChange(false);
      router.push(`/projects/${newProject.slug}/edit`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-[#29383d] bg-[#0f1719] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#29383d] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#f2eadf]">
            Create New Project
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-[#667b84] hover:bg-[#182124] hover:text-[#f2eadf]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {error && (
            <div className="rounded-md border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#e5ded3]">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Nexis – Desk Buddy"
              className="mt-2 w-full rounded border border-[#29383d] bg-[#0b1214] px-3 py-2 text-[#f2eadf] placeholder-[#53676f] focus:border-[#91a6b2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e5ded3]">
              Short Description
            </label>
            <textarea
              value={formData.short_description}
              onChange={(e) =>
                handleInputChange("short_description", e.target.value)
              }
              placeholder="Brief overview of the project"
              rows={3}
              className="mt-2 w-full rounded border border-[#29383d] bg-[#0b1214] px-3 py-2 text-[#f2eadf] placeholder-[#53676f] focus:border-[#91a6b2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e5ded3]">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="mt-2 w-full rounded border border-[#29383d] bg-[#0b1214] px-3 py-2 text-[#f2eadf] focus:border-[#91a6b2] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e5ded3]">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="mt-2 w-full rounded border border-[#29383d] bg-[#0b1214] px-3 py-2 text-[#f2eadf] focus:border-[#91a6b2] focus:outline-none"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e5ded3]">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  handleInputChange("progress", parseInt(e.target.value, 10))
                }
                className="mt-2 w-full rounded border border-[#29383d] bg-[#0b1214] px-3 py-2 text-[#f2eadf] focus:border-[#91a6b2] focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[#29383d] px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded border border-[#29383d] px-4 py-2 text-sm font-medium text-[#e5ded3] hover:bg-[#182124]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
