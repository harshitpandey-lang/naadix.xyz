import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import Link from "next/link";
import Image from "next/image";
import { ProjectsSidebar } from "@/src/components/projects/projects-sidebar";
import { ProjectsMobileHeader } from "@/src/components/projects/projects-mobile-header";
import { ProjectDocument } from "@/src/components/projects/project-document";
import { ProjectPropertyEditorShell } from "@/src/components/projects/project-property-editor-shell";
import { getProjectMediaBySlug } from "@/src/lib/projects/media-map";
import { getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";

export const metadata = {
  title: "Project Detail - Naadix HQ",
};

interface ProjectItemRecord {
  id: string;
  section: string;
  title: string;
  description?: string | null;
  url?: string | null;
  image_url?: string | null;
  alt_text?: string | null;
  caption?: string | null;
}

function nonEmptyText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function safeDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(time));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export default async function ProjectDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const hasSession = await verifyCEOSession();

  if (!hasSession) {
    redirect("/projects/ceo-login");
  }

  const { slug } = await props.params;
  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !project) {
    redirect("/projects");
  }

  const { data: itemsData } = await supabase
    .from("project_items")
    .select("*")
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  const projectRecord = project as ProjectRecord;
  const items = (itemsData ?? []) as ProjectItemRecord[];

  const technologyValues = toStringArray(projectRecord.technologies);
  const skillValues = toStringArray(projectRecord.skills);
  const hardwareValues = toStringArray(projectRecord.hardware);
  const softwareValues = toStringArray(projectRecord.software);

  const documentSections = [
    { title: "Overview", key: "overview", content: nonEmptyText(projectRecord.overview) },
    { title: "My Role", key: "my-role", content: nonEmptyText(projectRecord.my_role) },
    { title: "Objective", key: "objective", content: nonEmptyText(projectRecord.objective) },
    {
      title: "My Contribution",
      key: "my-contribution",
      content: nonEmptyText(projectRecord.my_contribution),
    },
    {
      title: "Implementation",
      key: "implementation",
      content:
        nonEmptyText(projectRecord.implementation) ||
        nonEmptyText(projectRecord.technical_documentation),
    },
    {
      title: "Key Achievements",
      key: "key-achievements",
      content:
        nonEmptyText(projectRecord.key_achievements) ||
        nonEmptyText(projectRecord.key_learnings),
    },
    { title: "Outcome", key: "outcome", content: nonEmptyText(projectRecord.outcome) },
    {
      title: "Challenges",
      key: "challenges",
      content: nonEmptyText(projectRecord.challenges),
    },
    {
      title: "Current Status",
      key: "current-status",
      content: nonEmptyText(projectRecord.current_status),
    },
    {
      title: "Next Steps",
      key: "next-steps",
      content: nonEmptyText(projectRecord.next_steps),
    },
  ];

  const mappedMedia = getProjectMediaBySlug(projectRecord.slug);
  const itemMedia = items
    .filter((item) => item.section === "media")
    .map((item) => ({
      path: item.image_url ?? "",
      alt: item.alt_text ?? item.title,
      caption: item.caption ?? item.description ?? item.title,
    }))
    .filter((item) => item.path.startsWith("/images/projects/") && item.alt.trim().length > 0);

  const media = mappedMedia.length > 0 ? mappedMedia : itemMedia;

  const itemLinks = items
    .filter((item) => item.section === "links")
    .map((item) => ({
      label: item.title,
      url: item.url,
      description: item.description,
    }))
    .filter((item) => Boolean(nonEmptyText(item.url)));

  const metadataLine = [
    getStatusLabel(projectRecord.status),
    nonEmptyText(projectRecord.category),
    nonEmptyText(projectRecord.domain as string | null | undefined),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  const githubUrl = nonEmptyText(projectRecord.github_url);
  const liveDemoUrl = nonEmptyText(projectRecord.live_demo_url);
  const projectUrl = nonEmptyText(projectRecord.project_url);

  const lastUpdated = safeDate(projectRecord.updated_at);

  return (
    <div className="min-h-screen bg-[#0b1214] text-[#e5ded3]">
      <ProjectsSidebar />
      <ProjectsMobileHeader />

      <main className="min-h-screen md:ml-60">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 md:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/projects"
              className="rounded-md px-2 py-1.5 text-xs text-[#667b84] transition hover:bg-[#182124] hover:text-[#f2eadf]"
            >
              Back to Projects
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href={`/projects/${projectRecord.slug}/edit`}
                className="rounded-md border border-[#29383d] px-2 py-1.5 text-xs text-[#91a6b2] transition hover:bg-[#182124] hover:text-[#f2eadf]"
              >
                Edit Project
              </Link>

              <form action="/api/projects/ceo/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md px-2 py-1.5 text-xs text-[#667b84] transition hover:bg-[#182124] hover:text-[#f2eadf]"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>

          <header className="border-b border-[#29383d] pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[#f2eadf] sm:text-4xl">
              {projectRecord.name}
            </h1>

            {nonEmptyText(projectRecord.short_description) && (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#788990]">
                {projectRecord.short_description}
              </p>
            )}

            {metadataLine && (
              <p className="mt-4 text-xs uppercase tracking-wider text-[#91a6b2]">
                {metadataLine}
              </p>
            )}
          </header>

          <div className="mt-10 space-y-10">
            <ProjectPropertyEditorShell project={projectRecord} />
            <ProjectDocument sections={documentSections} />

            {(technologyValues.length > 0 ||
              skillValues.length > 0 ||
              hardwareValues.length > 0 ||
              softwareValues.length > 0) && (
              <section id="technology-skills" className="scroll-mt-20 border-t border-[#29383d] pt-8">
                <h2 className="text-xl font-semibold text-[#f2eadf]">Technology & Skills</h2>

                <div className="mt-4 space-y-3">
                  {technologyValues.length > 0 && (
                    <p className="text-sm text-[#c8c0b5]">
                      <span className="font-medium text-[#e5ded3]">Technologies:</span> {technologyValues.join(", ")}
                    </p>
                  )}

                  {skillValues.length > 0 && (
                    <p className="text-sm text-[#c8c0b5]">
                      <span className="font-medium text-[#e5ded3]">Skills:</span> {skillValues.join(", ")}
                    </p>
                  )}

                  {hardwareValues.length > 0 && (
                    <p className="text-sm text-[#c8c0b5]">
                      <span className="font-medium text-[#e5ded3]">Hardware:</span> {hardwareValues.join(", ")}
                    </p>
                  )}

                  {softwareValues.length > 0 && (
                    <p className="text-sm text-[#c8c0b5]">
                      <span className="font-medium text-[#e5ded3]">Software:</span> {softwareValues.join(", ")}
                    </p>
                  )}
                </div>
              </section>
            )}

            <section id="project-media" className="scroll-mt-20 border-t border-[#29383d] pt-8">
              <h2 className="text-xl font-semibold text-[#f2eadf]">Project Media</h2>

              {media.length === 0 ? (
                <div className="mt-4 rounded-md border border-dashed border-[#29383d] px-4 py-5 text-sm text-[#667b84]">
                  No project media has been added yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {media.map((item) => (
                    <figure key={`${item.path}-${item.caption}`} className="overflow-hidden rounded-md border border-[#29383d] bg-[#0f1719]">
                      <Image
                        src={item.path}
                        alt={item.alt}
                        width={1200}
                        height={800}
                        className="h-auto w-full"
                      />

                      <figcaption className="border-t border-[#29383d] px-3 py-2 text-xs leading-5 text-[#667b84]">
                        {item.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            {(githubUrl || liveDemoUrl || projectUrl || itemLinks.length > 0) && (
              <section id="project-links" className="scroll-mt-20 border-t border-[#29383d] pt-8">
                <h2 className="text-xl font-semibold text-[#f2eadf]">Project Links</h2>

                <div className="mt-4 space-y-2 text-sm text-[#c8c0b5]">
                  {githubUrl && (
                    <p>
                      <span className="font-medium text-[#e5ded3]">GitHub:</span>{" "}
                      <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">
                        {githubUrl}
                      </a>
                    </p>
                  )}

                  {liveDemoUrl && (
                    <p>
                      <span className="font-medium text-[#e5ded3]">Live Demo:</span>{" "}
                      <a href={liveDemoUrl} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">
                        {liveDemoUrl}
                      </a>
                    </p>
                  )}

                  {projectUrl && (
                    <p>
                      <span className="font-medium text-[#e5ded3]">Other Project Link:</span>{" "}
                      <a href={projectUrl} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">
                        {projectUrl}
                      </a>
                    </p>
                  )}

                  {itemLinks.map((item) => (
                    <p key={`${item.label}-${item.url}`}>
                      <span className="font-medium text-[#e5ded3]">{item.label}:</span>{" "}
                      <a href={item.url as string} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">
                        {item.url}
                      </a>
                      {item.description && <span className="text-[#667b84]"> · {item.description}</span>}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {githubUrl && (
              <section id="github-evidence" className="scroll-mt-20 border-t border-[#29383d] pt-8">
                <h2 className="text-xl font-semibold text-[#f2eadf]">GitHub Project Evidence</h2>
                <p className="mt-3 text-sm leading-6 text-[#788990]">
                  GitHub serves as an evidence layer for repository activity and technical implementation. The project report above remains the primary, manually maintained record.
                </p>

                <div className="mt-4 space-y-2 text-sm text-[#c8c0b5]">
                  <p>
                    <span className="font-medium text-[#e5ded3]">Repository:</span>{" "}
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">
                      {githubUrl}
                    </a>
                  </p>

                  <p>
                    <span className="font-medium text-[#e5ded3]">README / Documentation:</span>{" "}
                    <a
                      href={`${githubUrl.replace(/\/$/, "")}/#readme`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]"
                    >
                      Open README
                    </a>
                  </p>

                  {technologyValues.length > 0 && (
                    <p>
                      <span className="font-medium text-[#e5ded3]">Technology evidence tags:</span>{" "}
                      {technologyValues.join(", ")}
                    </p>
                  )}
                </div>
              </section>
            )}

            {lastUpdated && (
              <section id="last-updated" className="scroll-mt-20 border-t border-[#29383d] pt-8">
                <h2 className="text-xl font-semibold text-[#f2eadf]">Last Updated</h2>
                <p className="mt-3 text-sm text-[#667b84]">{lastUpdated}</p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
