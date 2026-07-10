import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Award } from "lucide-react";
import { BRAND_GRADIENT } from "@/lib/gradients";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { serial },
    include: { user: true, course: true },
  });
  if (!certificate) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div
        className="rounded-2xl p-1"
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        <div className="rounded-[calc(1rem-2px)] bg-card p-10 text-center sm:p-14">
          <Award className="mx-auto size-10 text-primary" />
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Certificate of Completion
          </p>
          <p className="mt-6 font-heading text-3xl font-semibold">{certificate.user.name}</p>
          <p className="mt-2 text-muted-foreground">has completed</p>
          <p className="mt-2 font-heading text-2xl">{certificate.course.title}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            Issued{" "}
            {certificate.issuedAt.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}Kingdom Tribe City
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">Serial: {certificate.serial}</p>
        </div>
      </div>
    </div>
  );
}
