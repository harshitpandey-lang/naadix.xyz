import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import Link from "next/link";
import { ProjectEditor } from "@/src/components/projects/project-editor";
import { ProjectActionsManager } from "@/src/components/projects/project-actions-manager";
import { BlockEditor } from "@/src/components/projects/block-editor";

export const metadata = {
  title: "Edit Project - Naadix HQ CEO Portal",
};

export default async function ProjectEditPage(props: {
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

  const { data: actionsData } = await supabase
    .from("project_actions")
    .select("*")
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  const items = itemsData ?? [];
  const actions = actionsData ?? [];

  return (
    <div className="min-h-screen bg-[var(--hq)] text-white">
      {/* Header */}
      <header className="border-b border-[var(--hq-line)] bg-[var(--hq-panel)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/projects/${slug}`}
            className="text-[var(--hq-muted)] hover:text-[var(--hq-cream)] transition"
          >
            ← Back to Project
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--hq-cream)] mb-12">
          Edit Project
        </h1>

        <ProjectEditor project={project} />

        <hr className="my-12 border-[var(--hq-line)]" />

        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-bold text-[var(--hq-cream)]">
              Document Blocks
            </h2>
            <p className="mb-6 text-sm text-[var(--hq-muted)]">
              A reusable block-based content engine for project documents, notes, and future knowledge content.
            </p>
            <BlockEditor projectSlug={project.slug} blocks={items.map((item) => ({
              id: item.id,
              type: item.type ?? "paragraph",
              position: item.position ?? 0,
              content: item.content ?? item.description ?? item.title ?? "",
              created_at: item.created_at,
              updated_at: item.updated_at,
              title: item.title,
              description: item.description,
              url: item.url,
              image_url: item.image_url,
              alt_text: item.alt_text,
              caption: item.caption,
              section: item.section,
              metadata: item.metadata ?? null,
            }))} />
          </div>
        </div>

        <hr className="my-12 border-[var(--hq-line)]" />

        <ProjectActionsManager
          project={project}
          actions={actions}
        />
      </main>
    </div>
  );
}
