import Image from "next/image";
import Link from "next/link";
import { getProjectMediaBySlug } from "@/src/lib/projects/media-map";
import { getStatusChipClass, getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectsGalleryProps {
  projects: ProjectRecord[];
}

export function ProjectsGallery({ projects }: ProjectsGalleryProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-[#29383d] bg-[#0f1719] px-4 py-8 text-center text-sm text-[#667b84]">
        No projects match the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const media = getProjectMediaBySlug(project.slug);
        const cover = media[0]?.path ?? "/images/projects/placeholder-project.jpg";
        const safeCover = cover.startsWith("/") ? cover : "/images/projects/placeholder-project.jpg";

        return (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="overflow-hidden rounded-md border border-[#29383d] bg-[#0f1719] transition hover:border-[#43545b] hover:bg-[#101b1d]"
          >
            <div className="relative h-44 overflow-hidden bg-[#151f21]">
              {media.length > 0 ? (
                <Image
                  src={safeCover}
                  alt={project.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,_#1c2b2d,_#0d1517)] text-sm text-[#667b84]">
                  No image
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-medium text-[#e5ded3]">{project.name}</div>
                <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <p className="line-clamp-3 text-xs leading-5 text-[#667b84]">
                {project.short_description || "No short description provided."}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
