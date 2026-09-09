"use client";

import { useState } from "react";
import type { PageRecord } from "@/src/lib/pages/types";
import type { ProjectBlock } from "@/src/lib/projects/block-types";

interface PageEditorProps {
  page: PageRecord;
}

export function PageEditor({ page }: PageEditorProps) {
  const [blocks, setBlocks] = useState<ProjectBlock[]>(page.blocks);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-md border border-[#29383d] bg-[#0f1719] p-4">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-[#667b84]">
            <span>Block {index + 1}</span>
            <span>{block.type}</span>
          </div>

          <textarea
            value={block.content}
            onChange={(event) => {
              const nextValue = event.target.value;
              setBlocks((current) => current.map((item) => (item.id === block.id ? { ...item, content: nextValue } : item)));
            }}
            className="w-full resize-none bg-transparent text-sm leading-7 text-[#e5ded3] outline-none"
            rows={block.type === "code" ? 8 : 4}
          />
        </div>
      ))}
    </div>
  );
}
