import Image from "next/image";
import type { ProjectBlock } from "@/src/lib/projects/block-types";
import type { PageRecord } from "@/src/lib/pages/types";

interface PageRendererProps {
  page: PageRecord;
}

function renderBlockContent(block: ProjectBlock) {
  switch (block.type) {
    case "heading1":
      return <h1 className="text-3xl font-semibold tracking-tight text-[#f2eadf]">{block.content || "Untitled heading"}</h1>;
    case "heading2":
      return <h2 className="text-2xl font-semibold tracking-tight text-[#f2eadf]">{block.content || "Untitled heading"}</h2>;
    case "heading3":
      return <h3 className="text-xl font-semibold tracking-tight text-[#f2eadf]">{block.content || "Untitled heading"}</h3>;
    case "quote":
      return <blockquote className="border-l border-[#29383d] pl-4 text-base italic text-[#c8c0b5]">{block.content || "Quote"}</blockquote>;
    case "callout":
      return <div className="rounded-md border border-[#29383d] bg-[#131d1f] p-4 text-[#c8c0b5]">{block.content || "Callout"}</div>;
    case "code":
      return <pre className="overflow-x-auto rounded-md border border-[#29383d] bg-[#0d1517] p-4 text-sm text-[#c8dce5]"><code>{block.content || ""}</code></pre>;
    case "divider":
      return <div className="h-px w-full bg-[#29383d]" />;
    case "todo":
      return <div className="flex items-center gap-3 rounded-md border border-[#29383d] bg-[#0f1719] p-3 text-[#e5ded3]"><input type="checkbox" readOnly checked={Boolean(block.content)} className="h-4 w-4" /><span>{block.content || "To-do item"}</span></div>;
    case "image":
      if (!block.image_url && !block.content) return <div className="rounded-md border border-dashed border-[#29383d] p-4 text-sm text-[#667b84]">Image block</div>;
      return (
        <figure className="space-y-2">
          <Image
            src={block.image_url ?? block.content}
            alt={block.alt_text ?? block.title ?? "Page image"}
            width={1200}
            height={600}
            className="max-h-[420px] w-full rounded-md border border-[#29383d] object-cover"
          />
          {(block.caption || block.alt_text) && <figcaption className="text-xs text-[#667b84]">{block.caption ?? block.alt_text}</figcaption>}
        </figure>
      );
    case "link":
      return (
        <a href={block.url ?? "#"} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-4 hover:text-[#f2eadf]">
          {block.content || block.url || "Link"}
        </a>
      );
    case "bullet_list":
      return (
        <ul className="list-disc space-y-2 pl-6 text-[#788990]">
          {(block.content || "").split("\n").filter(Boolean).map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}
        </ul>
      );
    case "numbered_list":
      return (
        <ol className="list-decimal space-y-2 pl-6 text-[#788990]">
          {(block.content || "").split("\n").filter(Boolean).map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}
        </ol>
      );
    default:
      return <p className="whitespace-pre-wrap text-base leading-7 text-[#788990]">{block.content || "Type something..."}</p>;
  }
}

export function PageRenderer({ page }: PageRendererProps) {
  return (
    <article className="space-y-6">
      {page.summary && <p className="text-sm uppercase tracking-[0.18em] text-[#91a6b2]">{page.summary}</p>}
      {page.blocks.map((block) => (
        <div key={block.id}>{renderBlockContent(block)}</div>
      ))}
    </article>
  );
}
