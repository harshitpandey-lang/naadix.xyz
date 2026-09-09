"use client";

import Link from "next/link";

interface ProjectsViewsBarProps {
  view?: string;
  search?: string;
  status?: string;
  category?: string;
  domain?: string;
  sort?: string;
}

export function ProjectsViewsBar({
  view = "database",
  search,
  status,
  category,
  domain,
  sort,
}: ProjectsViewsBarProps) {
  const buildUrl = (nextView: string) => {
    const params = new URLSearchParams();

    if (status) {
      params.set("status", status);
    }

    if (category) {
      params.set("category", category);
    }

    if (domain) {
      params.set("domain", domain);
    }

    if (sort) {
      params.set("sort", sort);
    }

    if (search) {
      params.set("search", search);
    }

    if (nextView !== "database") {
      params.set("view", nextView);
    }

    const query = params.toString();

    return query ? `/projects?${query}` : "/projects";
  };

  const views = [
    {
      id: "database",
      label: "Database",
      icon: "▦",
    },
    {
      id: "board",
      label: "Board",
      icon: "▣",
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: "↔",
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: "◫",
    },
  ];

  return (
    <div className="mb-4 flex items-center gap-1 rounded-md border border-[#29383d] bg-[#0f1719] p-1">
      {views.map((item) => {
        const active = view === item.id;

        return (
          <Link
            key={item.id}
            href={buildUrl(item.id)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition ${
              active
                ? "bg-[#182124] text-[#f2eadf]"
                : "text-[#53676f] hover:bg-[#131d1f] hover:text-[#91a6b2]"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
