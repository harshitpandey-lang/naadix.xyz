import type { ProjectBlock } from "@/src/lib/projects/block-types";

export type PageStatus = "draft" | "published" | "archived";

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  status?: PageStatus;
  blocks: ProjectBlock[];
  created_at?: string;
  updated_at?: string;
}

export function createPageRecord(input: Partial<PageRecord> & Pick<PageRecord, "slug" | "title">): PageRecord {
  return {
    id: input.id ?? `page-${input.slug}`,
    slug: input.slug,
    title: input.title,
    summary: input.summary ?? null,
    status: input.status ?? "draft",
    blocks: input.blocks ?? [],
    created_at: input.created_at ?? new Date().toISOString(),
    updated_at: input.updated_at ?? new Date().toISOString(),
  };
}
