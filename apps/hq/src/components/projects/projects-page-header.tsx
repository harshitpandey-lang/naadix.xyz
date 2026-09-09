interface ProjectsPageHeaderProps {
  projectCount: number;
}

export function ProjectsPageHeader({
  projectCount,
}: ProjectsPageHeaderProps) {
  return (
    <header className="mb-8 space-y-2 border-b border-[#29383d] pb-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[#53676f]">
        Naadix HQ
      </p>

      <p className="text-sm uppercase tracking-[0.28em] text-[#91a6b2]">
        Projects
      </p>

      <h1 className="text-4xl font-semibold tracking-tight text-[#f2eadf] md:text-5xl">
        Projects Update
      </h1>

      <p className="max-w-2xl text-sm leading-6 text-[#667b84]">
        Executive project database for active operations, planned work, and completed outcomes.
      </p>

      <p className="text-xs text-[#53676f]">
        {projectCount} projects in this workspace
      </p>
    </header>
  );
}
