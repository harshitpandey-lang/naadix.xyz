import type { ProjectBlockType } from "@/src/lib/projects/block-types";

export interface SlashCommandItem {
  type: ProjectBlockType;
  label: string;
  description?: string;
  category: "BASIC" | "LISTS" | "MEDIA" | "ADVANCED";
  icon?: string;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  // BASIC
  { type: "paragraph", label: "Text", category: "BASIC", description: "Start with an empty text block" },
  { type: "heading1", label: "Heading 1", category: "BASIC", description: "Large heading" },
  { type: "heading2", label: "Heading 2", category: "BASIC", description: "Medium heading" },
  { type: "heading3", label: "Heading 3", category: "BASIC", description: "Small heading" },
  { type: "quote", label: "Quote", category: "BASIC", description: "A quote or callout" },

  // LISTS
  { type: "bullet_list", label: "Bulleted list", category: "LISTS", description: "Create a bullet list" },
  { type: "numbered_list", label: "Numbered list", category: "LISTS", description: "Create a numbered list" },
  { type: "todo", label: "To-do", category: "LISTS", description: "Create a to-do item" },

  // MEDIA
  { type: "image", label: "Image", category: "MEDIA", description: "Add an image" },
  { type: "gallery", label: "Gallery", category: "MEDIA", description: "Create a gallery" },
  { type: "file", label: "File", category: "MEDIA", description: "Attach a file" },

  // ADVANCED
  { type: "callout", label: "Callout", category: "ADVANCED", description: "Add a callout box" },
  { type: "code", label: "Code", category: "ADVANCED", description: "Add a code block" },
  { type: "divider", label: "Divider", category: "ADVANCED", description: "Add a divider line" },
  { type: "toggle", label: "Toggle", category: "ADVANCED", description: "Create collapsible content" },
  { type: "table", label: "Table", category: "ADVANCED", description: "Add a table" },
];

export function filterSlashCommands(query: string): SlashCommandItem[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return SLASH_COMMANDS;

  return SLASH_COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(lowerQuery) || (cmd.description?.toLowerCase().includes(lowerQuery) ?? false)).sort((a, b) => {
    const aStartsWith = a.label.toLowerCase().startsWith(lowerQuery);
    const bStartsWith = b.label.toLowerCase().startsWith(lowerQuery);
    return aStartsWith === bStartsWith ? 0 : aStartsWith ? -1 : 1;
  });
}

export function groupSlashCommands(commands: SlashCommandItem[]): Record<string, SlashCommandItem[]> {
  const grouped: Record<string, SlashCommandItem[]> = {};

  for (const cmd of commands) {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category].push(cmd);
  }

  return grouped;
}
