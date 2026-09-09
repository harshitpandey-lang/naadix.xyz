import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { ProjectsDatabase } from "@/src/components/projects/projects-database";
import { ProjectsBoard } from "@/src/components/projects/projects-board";
import { ProjectsTimeline } from "@/src/components/projects/projects-timeline";
import { ProjectsGallery } from "@/src/components/projects/projects-gallery";
import { ProjectsDatabaseHeader } from "@/src/components/projects/projects-database-header";
import { ProjectsViewsBar } from "@/src/components/projects/projects-views-bar";
import { ProjectsPageHeader } from "@/src/components/projects/projects-page-header";
import { ProjectsToolbar } from "@/src/components/projects/projects-toolbar";
import { ProjectStats } from "@/src/components/projects/project-stats";
import { buildExecutiveSummary, applyProjectFiltersAndSort } from "@/src/lib/projects/project-filters";
import { ProjectSortKey } from "@/src/lib/projects/types";
import { getStatusChipClass, getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectsPageShell } from "@/src/components/projects/projects-page-shell";
import Link from "next/link";

export const metadata = {
  title: "Projects Update - Naadix HQ",
};

interface SearchParams {
  status?: string;
  category?: string;
  domain?: string;
  sort?: ProjectSortKey;
  search?: string;
  view?: string;
}

export default async function ProjectsDashboardPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const hasSession = await verifyCEOSession();

  if (!hasSession) {
    redirect("/projects/ceo-login");
  }

  const searchParams = await props.searchParams;
  const supabase = createAdminClient();

  const { data: projectsData } = await supabase
    .from("projects")
    .select("*")
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false });

  const projects = projectsData ?? [];
  const filteredProjects = applyProjectFiltersAndSort(projects, {
    search: searchParams?.search,
    status: searchParams?.status,
    category: searchParams?.category,
    domain: searchParams?.domain,
    sort: searchParams?.sort,
  });
  const summary = buildExecutiveSummary(filteredProjects);
  const view = searchParams?.view === "gallery" || searchParams?.view === "board" || searchParams?.view === "timeline" || searchParams?.view === "database"
    ? searchParams.view
    : "database";

  return (
    <div className="min-h-screen bg-[#0b1214] text-[#e5ded3]">
      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          <ProjectsPageShell>
            <ProjectsPageHeader projectCount={filteredProjects.length} />

            <section className="mb-7">
              <ProjectStats projects={filteredProjects} />
            </section>

          <section className="mb-8 grid gap-5 lg:grid-cols-3">
            <article className="rounded-md border border-[#29383d] bg-[#0f1719] p-4 lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#91a6b2]">
                Recently Updated Projects
              </h2>

              <div className="mt-3 divide-y divide-[#202a2d]">
                {summary.recentlyUpdated.length === 0 && (
                  <p className="py-3 text-xs text-[#667b84]">No updated projects yet.</p>
                )}

                {summary.recentlyUpdated.map((project) => (
                  <div key={project.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="truncate text-sm font-medium text-[#e5ded3] hover:text-[#f2eadf] hover:underline"
                      >
                        {project.name}
                      </Link>

                      <p className="mt-0.5 text-xs text-[#667b84]">
                        {project.category || "—"} · {project.updated_at ? new Date(project.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }) : "No date"}
                      </p>
                    </div>

                    <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-md border border-[#29383d] bg-[#0f1719] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#91a6b2]">
                Active Projects
              </h2>

              <div className="mt-3 space-y-2">
                {summary.activeProjects.length === 0 && (
                  <p className="text-xs text-[#667b84]">No active projects.</p>
                )}

                {summary.activeProjects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="block rounded-md border border-[#202a2d] px-3 py-2 text-xs text-[#c8c0b5] hover:bg-[#131d1f]"
                  >
                    <span className="font-medium text-[#e5ded3]">{project.name}</span>
                    <span className="mt-1 block text-[#667b84]">{project.category || "—"}</span>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <section className="mb-7 rounded-md border border-[#29383d] bg-[#0f1719] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#91a6b2]">
              Projects by Category
            </h2>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(summary.projectsByCategory).map(([category, items]) => (
                <div key={category} className="rounded-md border border-[#202a2d] px-3 py-2">
                  <p className="text-xs font-medium text-[#e5ded3]">{category}</p>
                  <p className="mt-1 text-[11px] text-[#667b84]">{items.length} projects</p>
                </div>
              ))}
            </div>
          </section>

          <ProjectsToolbar
            search={searchParams?.search}
            status={searchParams?.status}
            category={searchParams?.category}
            domain={searchParams?.domain}
            sort={searchParams?.sort}
            view={view}
          />

          <ProjectsViewsBar
            view={view}
            search={searchParams?.search}
            status={searchParams?.status}
            category={searchParams?.category}
            domain={searchParams?.domain}
            sort={searchParams?.sort}
          />

          <div className="mt-4">
            {view === "board" ? (
              <ProjectsBoard projects={filteredProjects} />
            ) : view === "timeline" ? (
              <ProjectsTimeline projects={filteredProjects} />
            ) : view === "gallery" ? (
              <ProjectsGallery projects={filteredProjects} />
            ) : (
              <ProjectsDatabase projects={filteredProjects} />
            )}
          </div>

          <div className="mt-4">
            <ProjectsDatabaseHeader
              search={searchParams?.search}
            />
          </div>
          </ProjectsPageShell>
        </div>
      </main>
    </div>
  );
}
