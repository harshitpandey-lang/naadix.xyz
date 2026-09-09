import Link from "next/link";
import { universalPages } from "@/src/lib/pages/sample-pages";

export default function PagesIndexPage() {
  return (
    <main className="min-h-screen bg-[#0b1214] px-6 py-12 text-[#e5ded3]">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 border-b border-[#29383d] pb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#91a6b2]">Universal Pages</p>
          <h1 className="text-4xl font-semibold text-[#f2eadf]">Page library</h1>
          <p className="max-w-2xl text-sm leading-7 text-[#788990]">
            This is the reusable page layer that will eventually support notes, diaries, knowledge articles, and project documents without depending on a separate content table.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {universalPages.map((page) => (
            <Link
              key={page.id}
              href={`/pages/${page.slug}`}
              className="rounded-xl border border-[#29383d] bg-[#101a1c] p-5 transition hover:border-[#3d4d52] hover:bg-[#121d20]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#f2eadf]">{page.title}</span>
                <span className="rounded-full border border-[#29383d] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#91a6b2]">
                  {page.status}
                </span>
              </div>
              <p className="text-sm leading-6 text-[#788990]">{page.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
