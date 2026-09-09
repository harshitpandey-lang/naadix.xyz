interface ProjectPropertiesProps {
  category?: string | null;
  status?: string | null;
  progress?: number | null;
  slug?: string | null;
}

function statusLabel(status?: string | null) {
  if (!status) return "—";

  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function ProjectProperties({
  category,
  status,
  progress,
  slug,
}: ProjectPropertiesProps) {
  const safeProgress = Math.min(
    100,
    Math.max(0, Number(progress ?? 0)),
  );

  return (
    <div className="border-y border-[#29383d]">
      <div className="grid grid-cols-[100px_1fr] items-center border-b border-[#202a2d] py-3 sm:grid-cols-[120px_1fr]">
        <div className="text-xs text-[#53676f]">
          Status
        </div>

        <div className="text-sm text-[#c8c0b5]">
          {statusLabel(status)}
        </div>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center border-b border-[#202a2d] py-3 sm:grid-cols-[120px_1fr]">
        <div className="text-xs text-[#53676f]">
          Category
        </div>

        <div className="text-sm text-[#c8c0b5]">
          {category || "—"}
        </div>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center border-b border-[#202a2d] py-3 sm:grid-cols-[120px_1fr]">
        <div className="text-xs text-[#53676f]">
          Progress
        </div>

        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#202a2d] sm:w-40">
            <div
              className="h-full rounded-full bg-[#6d7f86]"
              style={{
                width: `${safeProgress}%`,
              }}
            />
          </div>

          <span className="text-xs text-[#91a6b2]">
            {safeProgress}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center py-3 sm:grid-cols-[120px_1fr]">
        <div className="text-xs text-[#53676f]">
          Slug
        </div>

        <code className="truncate text-xs text-[#667b84]">
          {slug || "—"}
        </code>
      </div>
    </div>
  );
}
