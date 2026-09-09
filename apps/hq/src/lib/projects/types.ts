export type CanonicalProjectStatus =
  | "IDEA"
  | "PLANNED"
  | "ACTIVE"
  | "ON_HOLD"
  | "BLOCKED"
  | "COMPLETED"
  | "ARCHIVED"
  | "PAUSED";

export const PROJECT_STATUS_OPTIONS: CanonicalProjectStatus[] = [
  "IDEA",
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "BLOCKED",
  "COMPLETED",
  "ARCHIVED",
];

export type ProjectDatabaseView = "database" | "board" | "timeline" | "gallery";

export type ProjectSortKey =
  | "updated-desc"
  | "updated-asc"
  | "name-asc"
  | "name-desc"
  | "status"
  | "status-asc"
  | "status-desc"
  | "created-desc"
  | "created-asc";

export interface ProjectRecord {
  id: string;
  slug: string;
  name: string;
  category: string;
  status?: string | null;
  short_description?: string | null;
  progress?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
  domain?: string | null;
  technologies?: string[] | null;
  skills?: string[] | null;
  hardware?: string[] | null;
  software?: string[] | null;
  overview?: string | null;
  objective?: string | null;
  implementation?: string | null;
  key_achievements?: string | null;
  outcome?: string | null;
  challenges?: string | null;
  current_status?: string | null;
  next_steps?: string | null;
  my_role?: string | null;
  my_contribution?: string | null;
  github_url?: string | null;
  live_demo_url?: string | null;
  project_url?: string | null;
  technical_documentation?: string | null;
  key_learnings?: string | null;
  contributors?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface ProjectFilterParams {
  search?: string;
  status?: string;
  category?: string;
  domain?: string;
  sort?: ProjectSortKey;
  view?: ProjectDatabaseView;
  group?: string;
  visibleProperties?: string[];
}
