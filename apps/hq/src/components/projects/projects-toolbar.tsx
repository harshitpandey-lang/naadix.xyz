"use client";

import Link from "next/link";

interface ProjectsToolbarProps {
  search?: string;
  status?: string;
  category?: string;
  domain?: string;
  sort?: string;
  view?: string;
}

export function ProjectsToolbar({
  search,
  status,
  category,
  domain,
  sort,
  view = "table",
}: ProjectsToolbarProps) {
  const buildUrl = (
    nextStatus?: string,
    nextCategory?: string,
    nextDomain?: string,
    nextSort?: string,
    nextSearch?: string,
  ) => {
    const params = new URLSearchParams();

    if (nextStatus) {
      params.set("status", nextStatus);
    }

    if (nextCategory) {
      params.set("category", nextCategory);
    }

    if (nextDomain) {
      params.set("domain", nextDomain);
    }

    if (nextSort) {
      params.set("sort", nextSort);
    }

    if (nextSearch) {
      params.set("search", nextSearch);
    }

    if (view !== "table") {
      params.set("view", view);
    }

    const query = params.toString();

    return query ? `/projects?${query}` : "/projects";
  };

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildUrl(undefined, category, domain, sort, search)}
          className={`rounded-md border px-3 py-1.5 text-xs transition ${
            !status
              ? "border-[#43545b] bg-[#202a2d] text-[#f2eadf]"
              : "border-[#29383d] text-[#667b84] hover:bg-[#182124] hover:text-[#f2eadf]"
          }`}
        >
          All
        </Link>

        <Link
          href={buildUrl("ACTIVE", category, domain, sort, search)}
          className={`rounded-md border px-3 py-1.5 text-xs transition ${
            status === "ACTIVE"
              ? "border-[#43545b] bg-[#202a2d] text-[#f2eadf]"
              : "border-[#29383d] text-[#667b84] hover:bg-[#182124] hover:text-[#f2eadf]"
          }`}
        >
          Active
        </Link>

        <Link
          href={buildUrl("COMPLETED", category, domain, sort, search)}
          className={`rounded-md border px-3 py-1.5 text-xs transition ${
            status === "COMPLETED"
              ? "border-[#43545b] bg-[#202a2d] text-[#f2eadf]"
              : "border-[#29383d] text-[#667b84] hover:bg-[#182124] hover:text-[#f2eadf]"
          }`}
        >
          Completed
        </Link>

        <Link
          href={buildUrl("PLANNED", category, domain, sort, search)}
          className={`rounded-md border px-3 py-1.5 text-xs transition ${
            status === "PLANNED"
              ? "border-[#43545b] bg-[#202a2d] text-[#f2eadf]"
              : "border-[#29383d] text-[#667b84] hover:bg-[#182124] hover:text-[#f2eadf]"
          }`}
        >
          Planned
        </Link>

        <form
          action="/projects"
          method="GET"
          className="ml-auto flex items-center"
        >
          {status && (
            <input
              type="hidden"
              name="status"
              value={status}
            />
          )}

          {category && (
            <input
              type="hidden"
              name="category"
              value={category}
            />
          )}

          {domain && (
            <input
              type="hidden"
              name="domain"
              value={domain}
            />
          )}

          {sort && (
            <input
              type="hidden"
              name="sort"
              value={sort}
            />
          )}

          {view !== "table" && (
            <input
              type="hidden"
              name="view"
              value={view}
            />
          )}

          <div className="flex items-center rounded-md border border-[#29383d] bg-[#131d1f] px-2.5">
            <span className="mr-2 text-xs text-[#53676f]">
              ?
            </span>

            <input
              type="search"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search projects..."
              className="h-8 w-40 bg-transparent text-xs text-[#91a6b2] outline-none placeholder:text-[#53676f] sm:w-52"
            />
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
          Category
        </span>

        <Link
          href={buildUrl(status, undefined, domain, sort, search)}
          className={`rounded-md px-2.5 py-1 text-xs transition ${
            !category
              ? "bg-[#202a2d] text-[#f2eadf]"
              : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
          }`}
        >
          All
        </Link>

        {[
          "Robotics & Embedded Systems",
          "AI & Automation",
          "Web & EdTech",
          "Sustainability / AgriTech",
        ].map((item) => (
          <Link
            key={item}
            href={buildUrl(status, item, domain, sort, search)}
            className={`rounded-md px-2.5 py-1 text-xs transition ${
              category === item
                ? "bg-[#202a2d] text-[#f2eadf]"
                : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
            }`}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
          Domain
        </span>

        <Link
          href={buildUrl(status, category, undefined, sort, search)}
          className={`rounded-md px-2.5 py-1 text-xs transition ${
            !domain
              ? "bg-[#202a2d] text-[#f2eadf]"
              : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
          }`}
        >
          All
        </Link>

        {["Software", "Hardware", "AI", "Web", "Education", "Automation"].map((item) => (
          <Link
            key={item}
            href={buildUrl(status, category, item, sort, search)}
            className={`rounded-md px-2.5 py-1 text-xs transition ${
              domain === item
                ? "bg-[#202a2d] text-[#f2eadf]"
                : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
            }`}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
          Sort
        </span>

        <Link
          href={buildUrl(status, category, domain, "updated-desc", search)}
          className={`rounded-md px-2.5 py-1 text-xs transition ${
            !sort || sort === "updated-desc"
              ? "bg-[#202a2d] text-[#f2eadf]"
              : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
          }`}
        >
          Recently Updated
        </Link>

        <Link
          href={buildUrl(status, category, domain, "name-asc", search)}
          className={`rounded-md px-2.5 py-1 text-xs transition ${
            sort === "name-asc"
              ? "bg-[#202a2d] text-[#f2eadf]"
              : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
          }`}
        >
          Name A-Z
        </Link>

        <Link
          href={buildUrl(status, category, domain, "status", search)}
          className={`rounded-md px-2.5 py-1 text-xs transition ${
            sort === "status"
              ? "bg-[#202a2d] text-[#f2eadf]"
              : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
          }`}
        >
          Status
        </Link>
      </div>
    </div>
  );
}
