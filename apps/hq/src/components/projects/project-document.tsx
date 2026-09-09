interface Section {
  title: string;
  key: string;
  content?: string | null;
}

interface ProjectDocumentProps {
  sections: Section[];
}

export function ProjectDocument({ sections }: ProjectDocumentProps) {
  return (
    <div className="space-y-10">
      {sections.map((section) => {
        if (!section.content) return null;

        return (
          <section key={section.key} id={section.key} className="scroll-mt-20 border-t border-[#29383d] pt-8">
            <h2 className="text-xl font-semibold text-[#f2eadf]">
              {section.title}
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#788990]">
              {section.content}
            </p>
          </section>
        );
      })}
    </div>
  );
}
