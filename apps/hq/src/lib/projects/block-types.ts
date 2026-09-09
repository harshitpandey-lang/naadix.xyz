export type ProjectBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bullet_list"
  | "numbered_list"
  | "todo"
  | "quote"
  | "divider"
  | "callout"
  | "code"
  | "table"
  | "image"
  | "gallery"
  | "file"
  | "video"
  | "link"
  | "toggle";

export interface ProjectBlock {
  id: string;
  type: ProjectBlockType;
  position: number;
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  section?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  image_url?: string | null;
  alt_text?: string | null;
  caption?: string | null;
}

export const PROJECT_BLOCK_TYPE_OPTIONS: Array<{ value: ProjectBlockType; label: string }> = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading1", label: "Heading 1" },
  { value: "heading2", label: "Heading 2" },
  { value: "heading3", label: "Heading 3" },
  { value: "todo", label: "To-do" },
  { value: "quote", label: "Quote" },
  { value: "callout", label: "Callout" },
  { value: "code", label: "Code" },
  { value: "divider", label: "Divider" },
  { value: "image", label: "Image" },
  { value: "link", label: "Link" },
];

export function isProjectBlockType(value: string): value is ProjectBlockType {
  return PROJECT_BLOCK_TYPE_OPTIONS.some((option) => option.value === value);
}

export function normalizeProjectBlock(item: Record<string, unknown>): ProjectBlock {
  const rawType = typeof item.type === "string" ? item.type : typeof item.block_type === "string" ? item.block_type : "paragraph";
  const type = isProjectBlockType(rawType) ? rawType : "paragraph";
  const content =
    typeof item.content === "string"
      ? item.content
      : typeof item.title === "string"
        ? item.title
        : typeof item.description === "string"
          ? item.description
          : "";

  return {
    id: String(item.id ?? crypto.randomUUID()),
    type,
    position: Number(item.position ?? 0),
    content,
    metadata:
      typeof item.metadata === "object" && item.metadata !== null
        ? (item.metadata as Record<string, unknown>)
        : typeof item.data === "object" && item.data !== null
          ? (item.data as Record<string, unknown>)
          : null,
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
    updated_at: typeof item.updated_at === "string" ? item.updated_at : undefined,
    section: typeof item.section === "string" ? item.section : null,
    title: typeof item.title === "string" ? item.title : null,
    description: typeof item.description === "string" ? item.description : null,
    url: typeof item.url === "string" ? item.url : null,
    image_url: typeof item.image_url === "string" ? item.image_url : null,
    alt_text: typeof item.alt_text === "string" ? item.alt_text : null,
    caption: typeof item.caption === "string" ? item.caption : null,
  };
}

export function buildBlockPayload(block: Partial<ProjectBlock>) {
  return {
    type: block.type ?? "paragraph",
    position: block.position ?? 0,
    content: block.content ?? "",
    metadata: block.metadata ?? null,
    title: block.title ?? null,
    description: block.description ?? null,
    url: block.url ?? null,
    image_url: block.image_url ?? null,
    alt_text: block.alt_text ?? null,
    caption: block.caption ?? null,
  };
}
