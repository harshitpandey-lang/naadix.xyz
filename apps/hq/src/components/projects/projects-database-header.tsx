"use client";

interface ProjectsDatabaseHeaderProps {
  search?: string;
}

export function ProjectsDatabaseHeader({
  search,
}: ProjectsDatabaseHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#29383d] pb-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#f2eadf]">
          Project Database
        </span>

        <span className="rounded-md bg-[#20292c] px-1.5 py-0.5 text-[10px] text-[#667b84]">
          Database
        </span>

        {search && (
          <span className="text-xs text-[#53676f]">
            · filtered by &quot;{search}&quot;
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-[#53676f]">Executive view</span>
      </div>
    </div>
  );
}
