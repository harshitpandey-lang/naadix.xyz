"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  GripVertical,
  Italic,
  Link2,
  Plus,
  Strikethrough,
  Underline,
} from "lucide-react";
import { ProjectBlock, PROJECT_BLOCK_TYPE_OPTIONS, buildBlockPayload } from "@/src/lib/projects/block-types";

interface BlockEditorProps {
  projectSlug: string;
  blocks: ProjectBlock[];
  onBlocksChange?: (blocks: ProjectBlock[]) => void;
}

interface SlashMenuState {
  blockId: string;
  query: string;
}

const SLASH_COMMANDS = [
  { label: "Text", type: "paragraph", category: "Basic" },
  { label: "Heading 1", type: "heading1", category: "Basic" },
  { label: "Heading 2", type: "heading2", category: "Basic" },
  { label: "Heading 3", type: "heading3", category: "Basic" },
  { label: "Quote", type: "quote", category: "Basic" },
  { label: "Bulleted list", type: "bullet_list", category: "Lists" },
  { label: "Numbered list", type: "numbered_list", category: "Lists" },
  { label: "To-do", type: "todo", category: "Lists" },
  { label: "Image", type: "image", category: "Media" },
  { label: "Gallery", type: "gallery", category: "Media" },
  { label: "File", type: "file", category: "Media" },
  { label: "Callout", type: "callout", category: "Advanced" },
  { label: "Code", type: "code", category: "Advanced" },
  { label: "Divider", type: "divider", category: "Advanced" },
  { label: "Toggle", type: "toggle", category: "Advanced" },
  { label: "Table", type: "table", category: "Advanced" },
] as const;

const TURN_INTO_TYPES: Array<{ value: ProjectBlock["type"]; label: string }> = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading1", label: "Heading 1" },
  { value: "heading2", label: "Heading 2" },
  { value: "heading3", label: "Heading 3" },
  { value: "bullet_list", label: "Bulleted list" },
  { value: "numbered_list", label: "Numbered list" },
  { value: "todo", label: "To-do" },
  { value: "quote", label: "Quote" },
  { value: "callout", label: "Callout" },
  { value: "code", label: "Code" },
  { value: "toggle", label: "Toggle" },
];

const CALL_OUT_VARIANTS = {
  gray: "border-[#29383d] bg-[#101a1c] text-[#dfe3df]",
  blue: "border-[#20415d] bg-[#0f1b2b] text-[#cde5ff]",
  green: "border-[#224b3f] bg-[#0d1e1b] text-[#d2f7df]",
  yellow: "border-[#58452b] bg-[#201b12] text-[#f0ddb1]",
  orange: "border-[#5a3427] bg-[#231812] text-[#f8d2a9]",
  red: "border-[#552b2d] bg-[#201314] text-[#f6c7c7]",
  purple: "border-[#3c2a56] bg-[#171423] text-[#e4d5ff]",
} as const;

function createBlockTemplate(type: ProjectBlock["type"], position: number): ProjectBlock {
  const id = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const timestamp = new Date().toISOString();

  switch (type) {
    case "callout":
      return { id, type, position, content: "Callout", metadata: { color: "gray", icon: "•" }, created_at: timestamp, updated_at: timestamp };
    case "code":
      return { id, type, position, content: "", metadata: { language: "text" }, created_at: timestamp, updated_at: timestamp };
    case "todo":
      return { id, type, position, content: "New task", metadata: { completed: false }, created_at: timestamp, updated_at: timestamp };
    case "toggle":
      return { id, type, position, content: "Implementation details", metadata: { open: true, childContent: "" }, created_at: timestamp, updated_at: timestamp };
    case "image":
      return { id, type, position, content: "", image_url: "", metadata: { alt: "", caption: "" }, created_at: timestamp, updated_at: timestamp };
    case "divider":
      return { id, type, position, content: "---", created_at: timestamp, updated_at: timestamp };
    default:
      return { id, type, position, content: "", created_at: timestamp, updated_at: timestamp };
  }
}

function getTextForBlock(block: ProjectBlock): string {
  return block.content ?? block.title ?? block.description ?? "";
}

function filterSlashCommands(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return SLASH_COMMANDS;
  }

  return SLASH_COMMANDS.filter((item) => {
    const haystack = `${item.label} ${item.category}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

function isSafeUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return false;
  }

  try {
    const url = new URL(trimmed, "https://example.com");
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) || trimmed.startsWith("/") || trimmed.startsWith("#");
  } catch {
    return false;
  }
}

export function BlockEditor({ projectSlug, blocks, onBlocksChange }: BlockEditorProps) {
  const [localBlocks, setLocalBlocks] = useState<ProjectBlock[]>(() => blocks);
  const [newType, setNewType] = useState<ProjectBlock["type"]>("paragraph");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [menuBlockId, setMenuBlockId] = useState<string | null>(null);
  const [toolbarBlockId, setToolbarBlockId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const dirtyRef = useRef(false);
  const saveVersionRef = useRef(0);

  const sortedBlocks = useMemo(
    () => [...localBlocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [localBlocks],
  );

  const persistBlocks = useCallback(
    async (nextBlocks: ProjectBlock[]) => {
      const requestId = ++saveVersionRef.current;
      setSaveState("saving");

      try {
        await Promise.all(
          nextBlocks.map(async (block, index) => {
            const payload = buildBlockPayload({ ...block, position: index });

            if (block.id.startsWith("temp-")) {
              const response = await fetch(`/api/projects/${projectSlug}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, position: index, type: block.type }),
              });

              if (!response.ok) {
                throw new Error("Failed to create block");
              }

              return;
            }

            const response = await fetch(`/api/projects/${projectSlug}/items/${block.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, position: index, type: block.type }),
            });

            if (!response.ok) {
              throw new Error("Failed to update block");
            }
          }),
        );

        if (saveVersionRef.current === requestId) {
          setSaveState("saved");
        }
      } catch {
        if (saveVersionRef.current === requestId) {
          setSaveState("error");
        }
      }
    },
    [projectSlug],
  );

  const commitBlocks = useCallback(
    (nextBlocks: ProjectBlock[]) => {
      const normalized = nextBlocks.map((block, index) => ({ ...block, position: index }));
      setLocalBlocks(normalized);
      onBlocksChange?.(normalized);
      dirtyRef.current = true;
      setSaveState("unsaved");
    },
    [onBlocksChange],
  );

  useEffect(() => {
    if (!dirtyRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistBlocks(sortedBlocks);
      dirtyRef.current = false;
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [persistBlocks, sortedBlocks]);

  const updateBlock = useCallback((blockId: string, updater: (block: ProjectBlock) => ProjectBlock) => {
    setLocalBlocks((current) => {
      const next = current.map((block) => (block.id === blockId ? updater(block) : block));
      const normalized = next.map((block, index) => ({ ...block, position: index }));
      onBlocksChange?.(normalized);
      dirtyRef.current = true;
      setSaveState("unsaved");
      return normalized;
    });
  }, [onBlocksChange]);

  const focusBlock = useCallback((blockId: string) => {
    const input = inputRefs.current[blockId];
    const textarea = textareaRefs.current[blockId];
    const target = input ?? textarea;

    if (target) {
      requestAnimationFrame(() => {
        target.focus();
      });
    }
  }, []);

  const insertBlockAfter = useCallback(
    (blockId: string, type: ProjectBlock["type"] = "paragraph") => {
      const index = sortedBlocks.findIndex((block) => block.id === blockId);
      if (index === -1) {
        return;
      }

      const next = [...sortedBlocks];
      next.splice(index + 1, 0, createBlockTemplate(type, index + 1));
      commitBlocks(next);
    },
    [commitBlocks, sortedBlocks],
  );

  const addBlockAtEnd = useCallback(() => {
    const next = [...sortedBlocks, createBlockTemplate(newType, sortedBlocks.length)];
    commitBlocks(next);
  }, [commitBlocks, newType, sortedBlocks]);

  const duplicateBlock = useCallback((blockId: string) => {
    const index = sortedBlocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      return;
    }

    const duplicate: ProjectBlock = {
      ...sortedBlocks[index],
      id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      position: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: sortedBlocks[index].metadata ? { ...sortedBlocks[index].metadata } : null,
    };

    const next = [...sortedBlocks];
    next.splice(index + 1, 0, duplicate);
    commitBlocks(next);
  }, [commitBlocks, sortedBlocks]);

  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    const index = sortedBlocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sortedBlocks.length) {
      return;
    }

    const next = [...sortedBlocks];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    commitBlocks(next);
  }, [commitBlocks, sortedBlocks]);

  const deleteBlock = useCallback((blockId: string) => {
    const block = sortedBlocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const next = sortedBlocks.filter((item) => item.id !== blockId).map((item, index) => ({ ...item, position: index }));
    commitBlocks(next);

    if (!block.id.startsWith("temp-")) {
      void fetch(`/api/projects/${projectSlug}/items/${block.id}`, { method: "DELETE" }).catch(() => {
        setSaveState("error");
      });
    }
  }, [commitBlocks, projectSlug, sortedBlocks]);

  const applyFormatting = useCallback((blockId: string, format: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    const target = inputRefs.current[blockId] ?? textareaRefs.current[blockId];
    if (!target) {
      return;
    }

    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? selectionStart;
    const selected = target.value.slice(selectionStart, selectionEnd) || "text";
    const replacements = {
      bold: `**${selected}**`,
      italic: `*${selected}*`,
      underline: `<u>${selected}</u>`,
      strikethrough: `~~${selected}~~`,
      code: `\`${selected}\``,
    } as const;

    const nextValue = `${target.value.slice(0, selectionStart)}${replacements[format]}${target.value.slice(selectionEnd)}`;
    updateBlock(blockId, (block) => ({ ...block, content: nextValue, updated_at: new Date().toISOString() }));
    setToolbarBlockId(null);
    requestAnimationFrame(() => {
      target.focus();
      const cursor = selectionStart + replacements[format].length;
      target.setSelectionRange(cursor, cursor);
    });
  }, [updateBlock]);

  const insertLink = useCallback((blockId: string) => {
    const target = inputRefs.current[blockId] ?? textareaRefs.current[blockId];
    if (!target) {
      return;
    }

    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? selectionStart;
    const selectedText = target.value.slice(selectionStart, selectionEnd) || "link text";
    const nextUrl = window.prompt("Enter a safe URL", "https://");

    if (!nextUrl) {
      return;
    }

    if (!isSafeUrl(nextUrl)) {
      window.alert("Only safe http/https, mailto, tel, relative, or anchor links are allowed.");
      return;
    }

    const markdown = `[${selectedText}](${nextUrl})`;
    const nextValue = `${target.value.slice(0, selectionStart)}${markdown}${target.value.slice(selectionEnd)}`;
    updateBlock(blockId, (block) => ({ ...block, content: nextValue, updated_at: new Date().toISOString() }));
    setToolbarBlockId(null);
  }, [updateBlock]);

  const replaceSlashContent = useCallback((blockId: string, type: ProjectBlock["type"]) => {
    const block = sortedBlocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const target = inputRefs.current[blockId] ?? textareaRefs.current[blockId];
    if (!target) {
      return;
    }

    const value = target.value;
    const lastSlash = value.lastIndexOf("/");
    const before = lastSlash >= 0 ? value.slice(0, lastSlash) : value;
    const trimmedBefore = before.trimEnd();

    const nextContent =
      type === "divider"
        ? "---"
        : type === "todo"
          ? "New task"
          : type === "toggle"
            ? "Implementation details"
            : type === "callout"
              ? "Callout"
              : type === "code"
                ? ""
                : trimmedBefore || "Text";

    const nextBlock: ProjectBlock = {
      ...block,
      type,
      content: nextContent,
      metadata:
        type === "todo"
          ? { completed: false }
          : type === "callout"
            ? { color: "gray", icon: "•" }
            : type === "toggle"
              ? { open: true, childContent: "" }
              : type === "code"
                ? { language: "text" }
                : type === "image"
                  ? { alt: "", caption: "" }
                  : block.metadata,
      updated_at: new Date().toISOString(),
    };

    const nextBlocks = sortedBlocks.map((item) => (item.id === blockId ? nextBlock : item));
    commitBlocks(nextBlocks);
    setSlashMenu(null);
    requestAnimationFrame(() => {
      const focusTarget = inputRefs.current[blockId] ?? textareaRefs.current[blockId];
      if (focusTarget) {
        focusTarget.focus();
        focusTarget.setSelectionRange(nextContent.length, nextContent.length);
      }
    });
  }, [commitBlocks, sortedBlocks]);

  const handleTextKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, block: ProjectBlock) => {
      const target = event.currentTarget;
      const value = target.value;

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const nextType = block.type === "heading1" || block.type === "heading2" || block.type === "heading3" ? "paragraph" : "paragraph";
        insertBlockAfter(block.id, nextType);
        return;
      }

      if (event.key === "Enter" && event.shiftKey) {
        return;
      }

      if (event.key === "Backspace" && value.length === 0) {
        event.preventDefault();
        const index = sortedBlocks.findIndex((item) => item.id === block.id);
        if (index > 0) {
          const previous = sortedBlocks[index - 1];
          deleteBlock(block.id);
          requestAnimationFrame(() => {
            focusBlock(previous.id);
          });
        }
        return;
      }

      if (event.key === "ArrowDown" && target.selectionStart === value.length && target.selectionEnd === value.length) {
        const index = sortedBlocks.findIndex((item) => item.id === block.id);
        if (index >= 0 && index < sortedBlocks.length - 1) {
          event.preventDefault();
          focusBlock(sortedBlocks[index + 1].id);
        }
      }

      if (event.key === "ArrowUp" && target.selectionStart === 0 && target.selectionEnd === 0) {
        const index = sortedBlocks.findIndex((item) => item.id === block.id);
        if (index > 0) {
          event.preventDefault();
          focusBlock(sortedBlocks[index - 1].id);
        }
      }

      if (event.key === "/") {
        setSlashMenu({ blockId: block.id, query: "" });
      }

      if (event.key === "Escape") {
        setSlashMenu(null);
        setMenuBlockId(null);
      }
    },
    [deleteBlock, focusBlock, insertBlockAfter, sortedBlocks],
  );

  const renderBlockContent = (block: ProjectBlock, onChange: (value: string) => void) => {
    const sharedClass = "w-full bg-transparent text-base leading-7 text-[#f2eadf] outline-none placeholder:text-[#667b84]";

    const onTextChange = (value: string) => {
      onChange(value);
      const slashIndex = value.lastIndexOf("/");
      if (slashIndex >= 0) {
        setSlashMenu({ blockId: block.id, query: value.slice(slashIndex + 1) });
      } else {
        setSlashMenu(null);
      }
    };

    switch (block.type) {
      case "heading1":
        return (
          <input
            ref={(element) => {
              inputRefs.current[block.id] = element;
            }}
            value={block.content ?? ""}
            onChange={(event) => onTextChange(event.target.value)}
            onFocus={() => setToolbarBlockId(block.id)}
            onKeyDown={(event) => handleTextKeyDown(event, block)}
            className="w-full bg-transparent text-3xl font-semibold tracking-tight text-[#f2eadf] outline-none placeholder:text-[#667b84]"
            placeholder="Heading 1"
          />
        );
      case "heading2":
        return (
          <input
            ref={(element) => {
              inputRefs.current[block.id] = element;
            }}
            value={block.content ?? ""}
            onChange={(event) => onTextChange(event.target.value)}
            onFocus={() => setToolbarBlockId(block.id)}
            onKeyDown={(event) => handleTextKeyDown(event, block)}
            className="w-full bg-transparent text-2xl font-semibold tracking-tight text-[#f2eadf] outline-none placeholder:text-[#667b84]"
            placeholder="Heading 2"
          />
        );
      case "heading3":
        return (
          <input
            ref={(element) => {
              inputRefs.current[block.id] = element;
            }}
            value={block.content ?? ""}
            onChange={(event) => onTextChange(event.target.value)}
            onFocus={() => setToolbarBlockId(block.id)}
            onKeyDown={(event) => handleTextKeyDown(event, block)}
            className="w-full bg-transparent text-xl font-semibold tracking-tight text-[#f2eadf] outline-none placeholder:text-[#667b84]"
            placeholder="Heading 3"
          />
        );
      case "quote":
        return (
          <blockquote className="border-l border-[#29383d] pl-4 text-[#c9c0b8]">
            <textarea
              ref={(element) => {
                textareaRefs.current[block.id] = element;
              }}
              value={block.content ?? ""}
              rows={3}
              onChange={(event) => onTextChange(event.target.value)}
              onFocus={() => setToolbarBlockId(block.id)}
              onKeyDown={(event) => handleTextKeyDown(event, block)}
              className={`${sharedClass} italic`}
              placeholder="Write a quote..."
            />
          </blockquote>
        );
      case "bullet_list":
        return (
          <div className="pl-5">
            <textarea
              ref={(element) => {
                textareaRefs.current[block.id] = element;
              }}
              value={block.content ?? ""}
              rows={3}
              onChange={(event) => onTextChange(event.target.value)}
              onFocus={() => setToolbarBlockId(block.id)}
              onKeyDown={(event) => handleTextKeyDown(event, block)}
              className={`${sharedClass} list-disc`}
              placeholder="List item"
            />
          </div>
        );
      case "numbered_list":
        return (
          <div className="pl-5">
            <textarea
              ref={(element) => {
                textareaRefs.current[block.id] = element;
              }}
              value={block.content ?? ""}
              rows={3}
              onChange={(event) => onTextChange(event.target.value)}
              onFocus={() => setToolbarBlockId(block.id)}
              onKeyDown={(event) => handleTextKeyDown(event, block)}
              className={`${sharedClass} list-decimal`}
              placeholder="List item"
            />
          </div>
        );
      case "todo": {
        const complete = Boolean((block.metadata as Record<string, unknown> | null)?.completed);
        return (
          <label className="flex items-center gap-3 rounded-md border border-[#29383d] bg-[#0f1719] p-3 text-[#e5ded3]">
            <input
              type="checkbox"
              checked={complete}
              onChange={() => {
                const nextMetadata = { ...((block.metadata as Record<string, unknown>) ?? {}), completed: !complete };
                updateBlock(block.id, (current) => ({ ...current, metadata: nextMetadata, updated_at: new Date().toISOString() }));
              }}
              className="h-4 w-4 accent-[#91a6b2]"
            />
            <input
              ref={(element) => {
                inputRefs.current[block.id] = element;
              }}
              value={block.content ?? ""}
              onChange={(event) => onTextChange(event.target.value)}
              onFocus={() => setToolbarBlockId(block.id)}
              onKeyDown={(event) => handleTextKeyDown(event, block)}
              className={`${sharedClass} ${complete ? "line-through text-[#667b84]" : ""}`}
              placeholder="To-do item"
            />
          </label>
        );
      }
      case "callout": {
        const variant = (block.metadata as Record<string, unknown> | null)?.color ?? "gray";
        const selectedVariant = CALL_OUT_VARIANTS[variant as keyof typeof CALL_OUT_VARIANTS] ?? CALL_OUT_VARIANTS.gray;
        return (
          <div className={`rounded-md border p-4 ${selectedVariant}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-sm">{String((block.metadata as Record<string, unknown> | null)?.icon ?? "•")}</span>
              <textarea
                ref={(element) => {
                  textareaRefs.current[block.id] = element;
                }}
                value={block.content ?? ""}
                rows={3}
                onChange={(event) => onTextChange(event.target.value)}
                onFocus={() => setToolbarBlockId(block.id)}
                onKeyDown={(event) => handleTextKeyDown(event, block)}
                className="w-full resize-none bg-transparent text-base leading-7 outline-none placeholder:text-current/70"
                placeholder="Callout text..."
              />
            </div>
          </div>
        );
      }
      case "code": {
        const language = String((block.metadata as Record<string, unknown> | null)?.language ?? "text");
        return (
          <div className="overflow-hidden rounded-md border border-[#29383d] bg-[#0d1517] text-[#dfeaf1]">
            <div className="flex items-center justify-between border-b border-[#29383d] bg-[#101a1c] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#91a6b2]">
              <select
                value={language}
                onChange={(event) => {
                  updateBlock(block.id, (current) => ({
                    ...current,
                    metadata: { ...((current.metadata as Record<string, unknown>) ?? {}), language: event.target.value },
                    updated_at: new Date().toISOString(),
                  }));
                }}
                className="bg-transparent text-inherit outline-none"
              >
                {[
                  "text",
                  "javascript",
                  "typescript",
                  "python",
                  "bash",
                  "json",
                  "css",
                  "html",
                ].map((option) => (
                  <option key={option} value={option} className="bg-[#101a1c] text-[#f2eadf]">{option}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(block.content ?? "");
                }}
                className="inline-flex items-center gap-1 rounded border border-[#29383d] px-2 py-1"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>

            <textarea
              ref={(element) => {
                textareaRefs.current[block.id] = element;
              }}
              value={block.content ?? ""}
              rows={8}
              onChange={(event) => onTextChange(event.target.value)}
              onFocus={() => setToolbarBlockId(block.id)}
              onKeyDown={(event) => handleTextKeyDown(event, block)}
              className="w-full resize-none bg-transparent p-3 font-mono text-sm leading-6 text-[#dfeaf1] outline-none placeholder:text-[#667b84]"
              placeholder="Write code..."
            />
          </div>
        );
      }
      case "toggle": {
        const isOpen = Boolean((block.metadata as Record<string, unknown> | null)?.open ?? true);
        const childContent = String((block.metadata as Record<string, unknown> | null)?.childContent ?? "");
        return (
          <div className="rounded-md border border-[#29383d] bg-[#0f1719] p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  updateBlock(block.id, (current) => ({
                    ...current,
                    metadata: { ...((current.metadata as Record<string, unknown>) ?? {}), open: !isOpen },
                    updated_at: new Date().toISOString(),
                  }));
                }}
                className="text-[#91a6b2]"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <input
                ref={(element) => {
                  inputRefs.current[block.id] = element;
                }}
                value={block.content ?? ""}
                onChange={(event) => onTextChange(event.target.value)}
                onFocus={() => setToolbarBlockId(block.id)}
                onKeyDown={(event) => handleTextKeyDown(event, block)}
                className="w-full bg-transparent text-base font-medium text-[#f2eadf] outline-none placeholder:text-[#667b84]"
                placeholder="Toggle title"
              />
            </div>
            {isOpen && (
              <textarea
                ref={(element) => {
                  textareaRefs.current[block.id] = element;
                }}
                value={childContent}
                rows={4}
                onChange={(event) => {
                  updateBlock(block.id, (current) => ({
                    ...current,
                    metadata: { ...((current.metadata as Record<string, unknown>) ?? {}), childContent: event.target.value },
                    updated_at: new Date().toISOString(),
                  }));
                }}
                className="mt-3 w-full resize-none bg-transparent text-sm leading-7 text-[#788990] outline-none placeholder:text-[#667b84]"
                placeholder="Implementation details"
              />
            )}
          </div>
        );
      }
      case "image": {
        const source = block.image_url ?? block.content ?? "";
        const altText = String((block.metadata as Record<string, unknown> | null)?.alt ?? "");
        const caption = String((block.metadata as Record<string, unknown> | null)?.caption ?? "");

        return (
          <div className="rounded-md border border-[#29383d] bg-[#0f1719] p-3">
            {source ? (
              <div className="space-y-2">
                <Image
                  src={source}
                  alt={altText || "Project media"}
                  width={1200}
                  height={800}
                  unoptimized
                  className="max-h-[420px] w-full rounded-md border border-[#29383d] object-cover"
                />
                {caption && <p className="text-xs text-[#667b84]">{caption}</p>}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[#29383d] p-6 text-sm text-[#667b84]">Image block — use an existing project media URL.</div>
            )}
            <div className="mt-3 grid gap-2">
              <input
                value={source}
                onChange={(event) => {
                  updateBlock(block.id, (current) => ({
                    ...current,
                    image_url: event.target.value,
                    content: event.target.value,
                    updated_at: new Date().toISOString(),
                  }));
                }}
                placeholder="Existing project media URL"
                className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-2 text-xs text-[#f2eadf] outline-none placeholder:text-[#667b84]"
              />
              <input
                value={altText}
                onChange={(event) => {
                  updateBlock(block.id, (current) => ({
                    ...current,
                    metadata: { ...((current.metadata as Record<string, unknown>) ?? {}), alt: event.target.value },
                    updated_at: new Date().toISOString(),
                  }));
                }}
                placeholder="Alt text"
                className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-2 text-xs text-[#f2eadf] outline-none placeholder:text-[#667b84]"
              />
              <input
                value={caption}
                onChange={(event) => {
                  updateBlock(block.id, (current) => ({
                    ...current,
                    metadata: { ...((current.metadata as Record<string, unknown>) ?? {}), caption: event.target.value },
                    updated_at: new Date().toISOString(),
                  }));
                }}
                placeholder="Caption"
                className="w-full rounded border border-[#29383d] bg-[#0d1517] px-2 py-2 text-xs text-[#f2eadf] outline-none placeholder:text-[#667b84]"
              />
            </div>
          </div>
        );
      }
      case "divider":
        return <div className="my-4 h-px w-full bg-[#29383d]" />;
      case "table":
        return <div className="rounded-md border border-[#29383d] bg-[#101a1c] p-3 text-sm text-[#667b84]">Table block placeholder</div>;
      case "gallery":
        return <div className="rounded-md border border-[#29383d] bg-[#101a1c] p-3 text-sm text-[#667b84]">Gallery block placeholder</div>;
      case "file":
        return <div className="rounded-md border border-[#29383d] bg-[#101a1c] p-3 text-sm text-[#667b84]">File block placeholder</div>;
      case "link":
        return (
          <div className="rounded-md border border-[#29383d] bg-[#101a1c] p-3">
            <input
              ref={(element) => {
                inputRefs.current[block.id] = element;
              }}
              value={block.content ?? ""}
              onChange={(event) => onTextChange(event.target.value)}
              className="w-full bg-transparent text-base text-[#f2eadf] outline-none placeholder:text-[#667b84]"
              placeholder="Link text"
            />
            <input
              value={block.url ?? ""}
              onChange={(event) => {
                updateBlock(block.id, (current) => ({ ...current, url: event.target.value, updated_at: new Date().toISOString() }));
              }}
              className="mt-2 w-full bg-transparent text-sm text-[#91a6b2] outline-none placeholder:text-[#667b84]"
              placeholder="https://example.com"
            />
          </div>
        );
      default:
        return (
          <textarea
            ref={(element) => {
              textareaRefs.current[block.id] = element;
            }}
            value={block.content ?? ""}
            rows={4}
            onChange={(event) => onTextChange(event.target.value)}
            onFocus={() => setToolbarBlockId(block.id)}
            onKeyDown={(event) => handleTextKeyDown(event, block)}
            className={sharedClass}
            placeholder="Type text..."
          />
        );
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3 py-6 text-[#f2eadf]">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#53676f]">
        <span>Document blocks</span>
        <span className={saveState === "error" ? "text-[#d0868d]" : saveState === "unsaved" ? "text-[#e9d7a4]" : "text-[#91a6b2]"}>
          {saveState === "saving" ? "Saving..." : saveState === "error" ? "Save failed" : saveState === "unsaved" ? "Unsaved changes" : "Saved"}
        </span>
      </div>

      {sortedBlocks.map((block) => {
        const isMenuOpen = menuBlockId === block.id;
        const isToolbarOpen = toolbarBlockId === block.id;

        return (
          <div
            key={block.id}
            className={`group relative rounded-md border px-2 py-2 transition ${dropTargetId === block.id ? "border-[#91a6b2]" : "border-transparent hover:border-[#29383d]"}`}
            draggable
            onDragStart={() => setDraggedId(block.id)}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTargetId(block.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!draggedId || draggedId === block.id) {
                return;
              }

              const from = sortedBlocks.findIndex((item) => item.id === draggedId);
              const to = sortedBlocks.findIndex((item) => item.id === block.id);
              if (from === -1 || to === -1) {
                return;
              }

              const next = [...sortedBlocks];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              commitBlocks(next);
              setDraggedId(null);
              setDropTargetId(null);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setDropTargetId(null);
            }}
          >
            <div className="pointer-events-none absolute -left-12 top-2 hidden h-8 items-center gap-1 rounded-md border border-[#29383d] bg-[#101a1c] p-1 text-[#667b84] group-hover:pointer-events-auto group-focus-within:pointer-events-auto md:flex">
              <button type="button" title="Add block" onClick={() => insertBlockAfter(block.id, "paragraph")} className="rounded p-1 hover:bg-[#182124] hover:text-[#e5ded3]">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Menu" onClick={() => setMenuBlockId((current) => (current === block.id ? null : block.id))} className="rounded p-1 hover:bg-[#182124] hover:text-[#e5ded3]">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            </div>

            {isToolbarOpen && (
              <div className="absolute -top-10 left-0 z-20 flex items-center gap-1 rounded-md border border-[#29383d] bg-[#101a1c] p-1 text-[#dfeaf1] shadow-sm">
                {[{ key: "bold", icon: Bold }, { key: "italic", icon: Italic }, { key: "underline", icon: Underline }, { key: "strikethrough", icon: Strikethrough }, { key: "code", icon: Code2 }, { key: "link", icon: Link2 }].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "link") {
                        insertLink(block.id);
                        return;
                      }
                      applyFormatting(block.id, key as "bold" | "italic" | "underline" | "strikethrough" | "code");
                    }}
                    className="rounded p-1.5 hover:bg-[#182124]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            {isMenuOpen && (
              <div className="absolute left-0 top-10 z-30 w-56 rounded-md border border-[#29383d] bg-[#101a1c] p-2 text-sm text-[#e5ded3] shadow-lg">
                <button type="button" onClick={() => duplicateBlock(block.id)} className="block w-full rounded px-2 py-1.5 text-left hover:bg-[#182124]">Duplicate</button>
                <button type="button" onClick={() => moveBlock(block.id, "up")} className="block w-full rounded px-2 py-1.5 text-left hover:bg-[#182124]">Move up</button>
                <button type="button" onClick={() => moveBlock(block.id, "down")} className="block w-full rounded px-2 py-1.5 text-left hover:bg-[#182124]">Move down</button>
                <div className="mt-2 border-t border-[#29383d] pt-2">
                  <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[#667b84]">Turn into</p>
                  {TURN_INTO_TYPES.map((option) => (
                    <button key={option.value} type="button" onClick={() => {
                      const next = sortedBlocks.map((item) => item.id === block.id ? { ...item, type: option.value, content: getTextForBlock(item) || "Text", updated_at: new Date().toISOString() } : item);
                      commitBlocks(next);
                      setMenuBlockId(null);
                    }} className="block w-full rounded px-2 py-1.5 text-left hover:bg-[#182124]">{option.label}</button>
                  ))}
                </div>
                <button type="button" onClick={() => deleteBlock(block.id)} className="mt-2 block w-full rounded px-2 py-1.5 text-left text-[#d6979a] hover:bg-[#182124]">Delete</button>
              </div>
            )}

            <div className="min-h-[28px]">
              {renderBlockContent(block, (value) => {
                updateBlock(block.id, (current) => ({
                  ...current,
                  content: value,
                  updated_at: new Date().toISOString(),
                }));
              })}
            </div>

            {slashMenu?.blockId === block.id && (
              <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-md border border-[#29383d] bg-[#101a1c] p-2 shadow-lg">
                <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#91a6b2]">Commands</div>
                <div className="max-h-64 space-y-1 overflow-auto">
                  {filterSlashCommands(slashMenu.query).slice(0, 12).map((item) => (
                    <button key={item.label} type="button" onClick={() => replaceSlashContent(block.id, item.type)} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-[#e5ded3] hover:bg-[#182124]">
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#667b84]">{item.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 flex items-center gap-3 rounded-md border border-dashed border-[#29383d] bg-[#0f1719] p-3">
        <button type="button" onClick={addBlockAtEnd} className="inline-flex items-center gap-2 rounded-md border border-[#29383d] bg-[#131d1f] px-3 py-2 text-sm text-[#e5ded3] hover:bg-[#182124]">
          <Plus className="h-4 w-4" />
          Add block
        </button>

        <select value={newType} onChange={(event) => setNewType(event.target.value as ProjectBlock["type"])} className="rounded-md border border-[#29383d] bg-[#0d1517] px-2 py-2 text-sm text-[#e5ded3]">
          {PROJECT_BLOCK_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <button type="button" onClick={addBlockAtEnd} className="rounded-md bg-[#91a6b2] px-3 py-2 text-sm text-[#0b1214]">Insert</button>
      </div>
    </div>
  );
}
