import { ProjectFilterParams, ProjectRecord, ProjectSortKey } from "@/src/lib/projects/types";

const DEFAULT_SORT: ProjectSortKey = "updated-desc";

function normalize(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function toTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const result = Date.parse(value);
  return Number.isNaN(result) ? 0 : result;
}

function bySort(sort: ProjectSortKey) {
  return (a: ProjectRecord, b: ProjectRecord) => {
    switch (sort) {
      case "updated-asc":
        return toTimestamp(a.updated_at) - toTimestamp(b.updated_at);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "status":
        return normalize(a.status).localeCompare(normalize(b.status));
      case "updated-desc":
      default:
        return toTimestamp(b.updated_at) - toTimestamp(a.updated_at);
    }
  };
}

export function applyProjectFiltersAndSort(
  projects: ProjectRecord[],
  params: ProjectFilterParams,
): ProjectRecord[] {
  const search = normalize(params.search);
  const status = normalize(params.status);
  const category = normalize(params.category);
  const domain = normalize(params.domain);
  const sort = params.sort ?? DEFAULT_SORT;

  const filtered = projects.filter((project) => {
    const projectStatus = normalize(project.status);
    const projectCategory = normalize(project.category);
    const projectDomain = normalize(project.domain as string | null | undefined);

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
      const searchable = [project.name, project.short_description, project.overview]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(search)) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort(bySort(sort));
}

export function buildExecutiveSummary(projects: ProjectRecord[]) {
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const completedProjects = projects.filter((project) => project.status === "COMPLETED");
  const plannedProjects = projects.filter((project) => project.status === "PLANNED");

  const recentlyUpdated = [...projects]
    .sort((a, b) => toTimestamp(b.updated_at) - toTimestamp(a.updated_at))
    .slice(0, 5);

  const projectsByCategory = projects.reduce<Record<string, ProjectRecord[]>>((acc, project) => {
    const key = project.category || "Uncategorized";
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(project);
    return acc;
  }, {});

  return {
    total: projects.length,
    active: activeProjects.length,
    completed: completedProjects.length,
    planned: plannedProjects.length,
    recentlyUpdated,
    activeProjects,
    projectsByCategory,
  };
}
