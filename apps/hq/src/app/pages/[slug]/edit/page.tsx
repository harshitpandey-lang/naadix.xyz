import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/src/lib/pages/sample-pages";
import { PageEditor } from "@/src/components/pages/page-editor";

export default async function UniversalPageEditPage(props: {
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
            <Link href={`/pages/${page.slug}`} className="text-sm text-[#91a6b2] transition hover:text-[#f2eadf]">
              ← Back to page
            </Link>
            <span className="text-xs uppercase tracking-[0.18em] text-[#667b84]">Editing</span>
          </div>

          <h1 className="text-4xl font-semibold text-[#f2eadf]">{page.title}</h1>
        </header>

        <PageEditor page={page} />
      </div>
    </main>
  );
}
