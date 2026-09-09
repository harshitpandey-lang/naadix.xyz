"use client";

interface ProjectHeaderProps {
  name: string;
  category: string;
  status: string | null;
  progress: number | null;
  updated_at: string;
}

export function ProjectHeader({
  name,
  category,
  status,
  progress,
  updated_at,
}: ProjectHeaderProps) {
  const statusColors: Record<string, string> = {
    PLANNED: "bg-slate-100 text-slate-700",
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  };

  const statusDisplay = status || "Not specified";
  const statusColor = status ? (statusColors[status] || "bg-gray-100 text-gray-700") : "bg-gray-200 text-gray-600";

  return (
    <div className="border-b border-[var(--hq-line)] pb-8 mb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--hq-cream)] mb-3">
            {name}
          </h1>
          <p className="text-lg text-[var(--hq-muted)]">{category}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${statusColor}`}>
          {statusDisplay}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-8">
        {progress !== null && (
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--hq-muted)] mb-2">
              Progress
            </p>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-[var(--hq-line)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-[var(--hq-cream)]">
                {progress}%
              </span>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--hq-muted)] mb-2">
            Last Updated
          </p>
          <p className="text-lg font-semibold text-[var(--hq-cream)]">
            {new Date(updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
