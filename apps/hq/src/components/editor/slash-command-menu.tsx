"use client";

import { useEffect, useRef } from "react";
import type { SlashCommandItem } from "@/src/lib/slash-commands";
import { groupSlashCommands } from "@/src/lib/slash-commands";

interface SlashCommandMenuProps {
  commands: SlashCommandItem[];
  selectedIndex: number;
  onSelect: (cmd: SlashCommandItem) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function SlashCommandMenu({ commands, selectedIndex, onSelect, position }: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const grouped = groupSlashCommands(commands);
  const categoryOrder = ["BASIC", "LISTS", "MEDIA", "ADVANCED"];

  // Auto-scroll to selected item
  useEffect(() => {
    const selected = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: position?.top,
        left: position?.left,
      }}
      className="z-50 max-h-96 w-64 overflow-y-auto rounded-lg border border-[#29383d] bg-[#0f1719] shadow-lg"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {categoryOrder.map((category) => {
        const cmds = grouped[category];
        if (!cmds || cmds.length === 0) return null;

        return (
          <div key={category}>
            <div className="sticky top-0 bg-[#0f1719] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#667b84]">
              {category}
            </div>

            {cmds.map((cmd) => {
              const globalIdx = commands.findIndex((c) => c.type === cmd.type);

              return (
                <button
                  key={cmd.type}
                  data-index={globalIdx}
                  onClick={() => onSelect(cmd)}
                  className={`w-full px-3 py-2 text-left text-sm transition ${globalIdx === selectedIndex ? "bg-[#182124] text-[#f2eadf]" : "text-[#c8c0b5] hover:bg-[#131d1f]"}`}
                >
                  <div className="font-medium">{cmd.label}</div>
                  {cmd.description && <div className="text-xs text-[#667b84]">{cmd.description}</div>}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
