"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Copy, Trash2, Archive, Edit2, ExternalLink } from "lucide-react";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectRowMenuProps {
  project: ProjectRecord;
  onDuplicate?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onArchive?: () => Promise<void>;
}

export function ProjectRowMenu({
  project,
  onDuplicate,
  onDelete,
  onArchive,
}: ProjectRowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (action: () => Promise<void> | undefined) => {
    if (!action) return;
    setIsLoading(true);
    try {
      await action();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="rounded p-1.5 text-[#667b84] hover:bg-[#182124] hover:text-[#e5ded3]"
        title="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-[#29383d] bg-[#0f1719] py-1 shadow-lg">
          <Link
            href={`/projects/${project.slug}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#e5ded3] hover:bg-[#182124]"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Link>

          <Link
            href={`/projects/${project.slug}/edit`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#e5ded3] hover:bg-[#182124]"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>

          {onDuplicate && (
            <button
              type="button"
              onClick={() => handleAction(onDuplicate)}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e5ded3] hover:bg-[#182124] disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
          )}

          {onArchive && (
            <button
              type="button"
              onClick={() => handleAction(onArchive)}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e5ded3] hover:bg-[#182124] disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}

          {onDelete && (
            <div className="border-t border-[#29383d]">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${project.name}"? This action cannot be undone.`
                    )
                  ) {
                    handleAction(onDelete);
                  }
                }}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#d6979a] hover:bg-[#182124] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
