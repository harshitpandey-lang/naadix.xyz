import { Award } from "lucide-react";
import type { Certification } from "@/src/types/profile";
import { SectionHeading } from "./section-heading";

export function CertificationsSection({
  certifications,
}: {
  certifications: Certification[];
}) {
  return (
    <section className="section rule">
      <div className="container">
        <SectionHeading
          eyebrow="06 / Certifications"
          title="Learning, documented."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {certifications.map((certification) => (
            <article key={certification.name} className="card p-6">
              <Award
                size={20}
                className="text-[var(--accent)]"
                aria-hidden="true"
              />

              <h3 className="mt-12 text-lg font-semibold leading-7">
                {certification.name}
              </h3>

              {certification.issuer && (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {certification.issuer}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}