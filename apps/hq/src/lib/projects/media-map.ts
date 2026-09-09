import "server-only";

import fs from "node:fs";
import path from "node:path";

export interface ProjectMediaItem {
  path: string;
  alt: string;
  caption: string;
}

const IMAGES_MD_PATH = path.join(process.cwd(), "src/lib/projects/images.md");

function parseImagesMarkdown(markdown: string): Record<string, ProjectMediaItem[]> {
  const mapping: Record<string, ProjectMediaItem[]> = {};
  const lines = markdown.split(/\r?\n/);

  let activeSlug: string | null = null;

  for (const line of lines) {
    const slugHeading = /^##\s+([a-z0-9-]+)\s*$/i.exec(line.trim());
    if (slugHeading) {
      activeSlug = slugHeading[1].trim().toLowerCase();
      mapping[activeSlug] = mapping[activeSlug] ?? [];
      continue;
    }

    if (!activeSlug) {
      continue;
    }

    const mediaLine = /^-\s+([^|]+)\|\s*([^|]+)\|\s*(.+)$/.exec(line);
    if (!mediaLine) {
      continue;
    }

    const mediaPath = mediaLine[1].trim();
    const alt = mediaLine[2].trim();
    const caption = mediaLine[3].trim();

    if (!mediaPath.startsWith("/images/projects/")) {
      continue;
    }

    if (!alt || !caption) {
      continue;
    }

    mapping[activeSlug].push({
      path: mediaPath,
      alt,
      caption,
    });
  }

  return mapping;
}

function readMediaMap(): Record<string, ProjectMediaItem[]> {
  if (!fs.existsSync(IMAGES_MD_PATH)) {
    return {};
  }

  const markdown = fs.readFileSync(IMAGES_MD_PATH, "utf8");
  return parseImagesMarkdown(markdown);
}

const PROJECT_MEDIA_MAP = readMediaMap();

export function getProjectMediaBySlug(slug?: string | null): ProjectMediaItem[] {
  if (!slug) {
    return [];
  }

  const normalizedSlug = slug.trim().toLowerCase();
  return PROJECT_MEDIA_MAP[normalizedSlug] ?? [];
}
