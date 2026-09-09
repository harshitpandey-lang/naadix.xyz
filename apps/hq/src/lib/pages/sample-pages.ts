import { createPageRecord } from "@/src/lib/pages/types";

export const universalPages = [
  createPageRecord({
    id: "page-welcome",
    slug: "welcome",
    title: "Welcome to Naadix HQ",
    summary: "A personal operating system overview for the current workspace.",
    status: "published",
    blocks: [
      {
        id: "welcome-heading",
        type: "heading1",
        position: 0,
        content: "Welcome to Naadix HQ",
      },
      {
        id: "welcome-summary",
        type: "paragraph",
        position: 1,
        content:
          "This workspace is being evolved from a collection of isolated features into a personal operating system. The same block engine powers projects, notes, diaries, knowledge pages, and eventual dashboard content.",
      },
      {
        id: "welcome-principles",
        type: "bullet_list",
        position: 2,
        content: "Keep the existing app stable\nReuse the current data structures\nAdd a generic page layer rather than a second competing content system\nGrow the block engine as the shared foundation",
      },
    ],
  }),
  createPageRecord({
    id: "page-lab-notes",
    slug: "lab-notes",
    title: "Lab Notes",
    summary: "A lightweight playground for sketches, observations, and process notes.",
    status: "draft",
    blocks: [
      {
        id: "notes-heading",
        type: "heading2",
        position: 0,
        content: "Lab Notes",
      },
      {
        id: "notes-callout",
        type: "callout",
        position: 1,
        content: "The page engine should stay content-first, lean, and extensible. Rich features can be layered in without rewriting the data model.",
      },
      {
        id: "notes-checklist",
        type: "todo",
        position: 2,
        content: "Document shared block patterns",
      },
    ],
  }),
  createPageRecord({
    id: "page-knowledge-base",
    slug: "knowledge-base",
    title: "Knowledge Base",
    summary: "The long-term home for reusable operating notes, processes, and decisions.",
    status: "draft",
    blocks: [
      {
        id: "kb-heading",
        type: "heading2",
        position: 0,
        content: "Knowledge Base",
      },
      {
        id: "kb-para",
        type: "paragraph",
        position: 1,
        content:
          "This space is designed to capture the recurring patterns behind the HQ system so that the same engine works for guides, references, and long-form knowledge pages.",
      },
      {
        id: "kb-code",
        type: "code",
        position: 2,
        content: "const systemGoal = 'Build a reliable personal operating system';",
      },
    ],
  }),
];

export function getPageBySlug(slug: string) {
  return universalPages.find((page) => page.slug === slug) ?? null;
}
