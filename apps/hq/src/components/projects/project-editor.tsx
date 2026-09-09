"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectEditorProps {
  project: ProjectRecord;
}

type InputValue = string | number | null;

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "array";
  options?: string[];
}

interface SectionConfig {
  title: string;
  fields: FieldConfig[];
}

function hasKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeInputValue(value: string): InputValue {
  return value === "" ? null : value;
}

function parseArrayValue(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .join(", ");
}

function parseArrayInput(value: string): string[] | null {
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return parsed.length > 0 ? parsed : null;
}

export function ProjectEditor({ project }: ProjectEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(project);

  const sections: SectionConfig[] = [
    {
      title: "Basic Information",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "short_description", label: "Short Description", type: "textarea" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["", "PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
        },
        { key: "category", label: "Category", type: "text" },
        { key: "domain", label: "Domain", type: "text" },
      ],
    },
    {
      title: "Project Timeline",
      fields: [
        { key: "start_date", label: "Start Date", type: "text" },
        { key: "end_date", label: "End Date", type: "text" },
        { key: "updated_at", label: "Last Updated", type: "text" },
      ],
    },
    {
      title: "Role",
      fields: [
        { key: "my_role", label: "My Role", type: "textarea" },
        { key: "my_contribution", label: "My Contribution", type: "textarea" },
      ],
    },
    {
      title: "Purpose",
      fields: [
        { key: "overview", label: "Overview", type: "textarea" },
        { key: "objective", label: "Objective", type: "textarea" },
      ],
    },
    {
      title: "Technical",
      fields: [
        { key: "technologies", label: "Technologies", type: "array" },
        { key: "skills", label: "Skills", type: "array" },
        { key: "hardware", label: "Hardware", type: "array" },
        { key: "software", label: "Software", type: "array" },
      ],
    },
    {
      title: "Development",
      fields: [
        { key: "implementation", label: "Implementation", type: "textarea" },
        { key: "challenges", label: "Challenges", type: "textarea" },
      ],
    },
    {
      title: "Results",
      fields: [
        { key: "key_achievements", label: "Key Achievements", type: "textarea" },
        { key: "outcome", label: "Outcome", type: "textarea" },
      ],
    },
    {
      title: "Project State",
      fields: [
        { key: "current_status", label: "Current Status", type: "textarea" },
        { key: "next_steps", label: "Next Steps", type: "textarea" },
      ],
    },
    {
      title: "Resources",
      fields: [
        { key: "github_url", label: "GitHub URL", type: "text" },
        { key: "live_demo_url", label: "Live Demo URL", type: "text" },
        { key: "project_url", label: "Project URL", type: "text" },
      ],
    },
    {
      title: "Media",
      fields: [{ key: "media_notes", label: "Project Images / Media Notes", type: "textarea" }],
    },
  ];

  const handleInputChange = (
    key: string,
    value: string,
    type: FieldConfig["type"],
  ) => {
    setFormData((prev) => {
      if (type === "array") {
        return {
          ...prev,
          [key]: parseArrayInput(value),
        };
      }

      if (type === "number") {
        const nextValue = value === "" ? null : Number(value);
        return {
          ...prev,
          [key]: Number.isNaN(nextValue) ? null : nextValue,
        };
      }

      return {
        ...prev,
        [key]: normalizeInputValue(value),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = Object.keys(formData).reduce<Record<string, unknown>>((acc, key) => {
        if (!hasKey(project as Record<string, unknown>, key)) {
          return acc;
        }

        acc[key] = formData[key];
        return acc;
      }, {});

      const response = await fetch(`/api/projects/${project.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update project");

      router.push(`/projects/${project.slug}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
      {sections.map((section) => {
        const visibleFields = section.fields.filter((field) => hasKey(formData, field.key));

        if (visibleFields.length === 0) {
          return null;
        }

        return (
          <section key={section.title} className="border-t border-[var(--hq-line)] pt-8">
            <h2 className="mb-5 text-xl font-bold text-[var(--hq-cream)]">{section.title}</h2>

            <div className="space-y-4">
              {visibleFields.map((field) => {
                const fieldValue = formData[field.key];

                return (
                  <div key={field.key}>
                    <label className="mb-2 block text-sm font-medium text-[var(--hq-cream)]">
                      {field.label}
                    </label>

                    {field.type === "textarea" && (
                      <textarea
                        name={field.key}
                        value={(fieldValue as string | null) ?? ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value, field.type)}
                        rows={4}
                        className="w-full rounded border border-[var(--hq-line)] bg-[var(--hq-panel)] px-4 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        name={field.key}
                        value={(fieldValue as string | null) ?? ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value, field.type)}
                        className="w-full rounded border border-[var(--hq-line)] bg-[var(--hq-panel)] px-4 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                      >
                        {field.options?.map((option) => (
                          <option key={option || "empty"} value={option}>
                            {option || "Not specified"}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "array" && (
                      <input
                        type="text"
                        name={field.key}
                        value={parseArrayValue(fieldValue)}
                        onChange={(e) => handleInputChange(field.key, e.target.value, field.type)}
                        className="w-full rounded border border-[var(--hq-line)] bg-[var(--hq-panel)] px-4 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                        placeholder="Comma-separated values"
                      />
                    )}

                    {(field.type === "text" || field.type === "number") && (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        name={field.key}
                        value={
                          typeof fieldValue === "number"
                            ? String(fieldValue)
                            : ((fieldValue as string | null) ?? "")
                        }
                        onChange={(e) => handleInputChange(field.key, e.target.value, field.type)}
                        className="w-full rounded border border-[var(--hq-line)] bg-[var(--hq-panel)] px-4 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex gap-4 border-t border-[var(--hq-line)] pt-8">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-[var(--accent)] px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-[var(--hq-line)] px-6 py-2 font-medium text-[var(--hq-cream)] hover:bg-[var(--hq-panel)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
