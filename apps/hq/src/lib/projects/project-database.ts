import { CanonicalProjectStatus, ProjectDatabaseView, ProjectFilterParams, ProjectRecord, ProjectSortKey } from "@/src/lib/projects/types";

export type ProjectPropertyType = "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "DATE" | "CHECKBOX" | "URL" | "STATUS";

export interface ProjectPropertyDefinition {
  key: string;
  label: string;
  type: ProjectPropertyType;
  visibleByDefault?: boolean;
  options?: string[];
}

export const PROJECT_PROPERTY_DEFINITIONS: ProjectPropertyDefinition[] = [
  { key: "name", label: "Name", type: "TEXT", visibleByDefault: true },
  { key: "status", label: "Status", type: "STATUS", visibleByDefault: true, options: ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED", "IDEA", "ON_HOLD", "BLOCKED"] },
  { key: "category", label: "Category", type: "SELECT", visibleByDefault: true },
  { key: "domain", label: "Domain", type: "MULTI_SELECT", visibleByDefault: true },
  { key: "project_type", label: "Project Type", type: "SELECT" },
  { key: "technologies", label: "Technologies", type: "MULTI_SELECT", visibleByDefault: true },
  { key: "skills", label: "Skills", type: "MULTI_SELECT" },
  { key: "hardware", label: "Hardware", type: "MULTI_SELECT" },
  { key: "software", label: "Software", type: "MULTI_SELECT" },
  { key: "start_date", label: "Start Date", type: "DATE" },
  { key: "end_date", label: "End Date", type: "DATE" },
  { key: "updated_at", label: "Last Updated", type: "DATE", visibleByDefault: true },
  { key: "my_role", label: "My Role", type: "TEXT" },
  { key: "github_url", label: "GitHub", type: "URL" },
  { key: "live_demo_url", label: "Live Demo", type: "URL" },
  { key: "short_description", label: "Short Description", type: "TEXT" },
  { key: "overview", label: "Overview", type: "TEXT" },
];

export const DEFAULT_VISIBLE_PROPERTIES = [
  "name",
  "status",
  "category",
  "domain",
  "technologies",
  "updated_at",
] as const;

export const PROJECT_VIEW_OPTIONS: Array<{ id: ProjectDatabaseView; label: string }> = [
  { id: "database", label: "Database" },
  { id: "board", label: "Board" },
  { id: "timeline", label: "Timeline" },
  { id: "gallery", label: "Gallery" },
];

export function getProjectPropertyDefinition(key: string) {
  return PROJECT_PROPERTY_DEFINITIONS.find((property) => property.key === key);
}

export function normalizeArrayValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

export function formatArrayPills(values: unknown): string[] {
  return normalizeArrayValues(values);
}

export function getProjectValue(project: ProjectRecord, key: string) {
  const value = project[key as keyof ProjectRecord];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }

  return typeof value === "string" ? value : value ?? null;
}

export function filterProjects(projects: ProjectRecord[], filters: ProjectFilterParams): ProjectRecord[] {
  const search = (filters.search ?? "").trim().toLowerCase();
  const status = (filters.status ?? "").trim().toLowerCase();
  const category = (filters.category ?? "").trim().toLowerCase();
  const domain = (filters.domain ?? "").trim().toLowerCase();

  return projects.filter((project) => {
    const projectStatus = String(project.status ?? "").trim().toLowerCase();
    const projectCategory = String(project.category ?? "").trim().toLowerCase();
    const projectDomain = String(project.domain ?? "").trim().toLowerCase();

    if (status && status !== "all" && projectStatus !== status) {
      return false;
    }

    if (category && category !== "all" && projectCategory !== category) {
      return false;
    }

    if (domain && domain !== "all" && projectDomain !== domain) {
      return false;
    }

    if (search) {
      const haystack = [
        project.name,
        project.short_description,
        project.category,
        project.domain,
        project.my_role,
        project.status,
        ...(Array.isArray(project.technologies) ? project.technologies : []),
        ...(Array.isArray(project.skills) ? project.skills : []),
      ]
        .filter((value): value is string => typeof value === "string")
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export function sortProjects(projects: ProjectRecord[], sort: ProjectSortKey = "updated-desc"): ProjectRecord[] {
  const normalized = [...projects];

  normalized.sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return (a.name ?? "").localeCompare(b.name ?? "");
      case "name-desc":
        return (b.name ?? "").localeCompare(a.name ?? "");
      case "status-asc":
        return String(a.status ?? "").localeCompare(String(b.status ?? ""));
      case "status-desc":
        return String(b.status ?? "").localeCompare(String(a.status ?? ""));
      case "updated-asc":
        return new Date(a.updated_at ?? 0).getTime() - new Date(b.updated_at ?? 0).getTime();
      case "updated-desc":
      default:
        return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
    }
  });

  return normalized;
}

export function groupProjectsByStatus(projects: ProjectRecord[]) {
  const groups: Record<string, ProjectRecord[]> = {};

  for (const project of projects) {
    const key = (project.status as CanonicalProjectStatus | string | null) ?? "UNSPECIFIED";
    groups[key] ??= [];
    groups[key].push(project);
  }

  return groups;
}

export function groupProjectsBy(projects: ProjectRecord[], key: "status" | "category" | "domain" | "project_type") {
  const groups: Record<string, ProjectRecord[]> = {};

  for (const project of projects) {
    const value = String(project[key] ?? "Uncategorized").trim() || "Uncategorized";
    groups[value] ??= [];
    groups[value].push(project);
  }

  return groups;
}
