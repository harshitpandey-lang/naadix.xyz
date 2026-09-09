// Utilities for handling rich text formatting without external libraries
// Supports bold, italic, underline, strikethrough, code, and links

export interface TextMark {
  type: "bold" | "italic" | "underline" | "strikethrough" | "code" | "link";
  start: number;
  end: number;
  data?: Record<string, unknown>;
}

export function applyMark(text: string, selection: { start: number; end: number }, markType: TextMark["type"], data?: Record<string, unknown>): string {
  if (selection.start === selection.end) return text;

  const before = text.slice(0, selection.start);
  const selected = text.slice(selection.start, selection.end);
  const after = text.slice(selection.end);

  let marked = "";

  switch (markType) {
    case "bold":
      marked = `**${selected}**`;
      break;
    case "italic":
      marked = `_${selected}_`;
      break;
    case "underline":
      marked = `<u>${selected}</u>`;
      break;
    case "strikethrough":
      marked = `~~${selected}~~`;
      break;
    case "code":
      marked = `\`${selected}\``;
      break;
    case "link":
      marked = `[${selected}](${data?.url || ""})`;
      break;
  }

  return before + marked + after;
}

export function renderFormattedText(text: string) {
  // Simple rendering of markdown-style marks
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/~~(.*?)~~/g, "<s>$1</s>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  return html;
}

export function sanitizeUrl(url: string): string | null {
  try {
    // Reject dangerous protocols
    if (url.startsWith("javascript:") || url.startsWith("data:") || url.startsWith("vbscript:")) {
      return null;
    }

    // Allow http, https, mailto, and internal routes starting with /
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("/")) {
      return url;
    }

    // If no protocol, assume https
    return `https://${url}`;
  } catch {
    return null;
  }
}
