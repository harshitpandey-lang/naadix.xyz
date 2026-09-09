import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/src/lib/pages/sample-pages";
import { PageRenderer } from "@/src/components/pages/page-renderer";

export default async function UniversalPageRoute(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const page = getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0b1214] px-6 py-12 text-[#e5ded3]">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="border-b border-[#29383d] pb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link href="/pages" className="text-sm text-[#91a6b2] transition hover:text-[#f2eadf]">
              ← Back to pages
            </Link>
            <Link href={`/pages/${page.slug}/edit`} className="rounded-md border border-[#29383d] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#e5ded3] transition hover:bg-[#182124]">
              Edit page
            </Link>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-[#91a6b2]">{page.status}</p>
          <h1 className="mt-3 text-4xl font-semibold text-[#f2eadf]">{page.title}</h1>
        </header>

        <PageRenderer page={page} />
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  return [{ slug: "welcome" }, { slug: "lab-notes" }, { slug: "knowledge-base" }];
}
