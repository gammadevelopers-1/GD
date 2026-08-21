import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeading } from "@/components/admin/page-heading";
import { ProfileEditor } from "@/components/admin/profile/profile-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireViewer } from "@/data/auth";
import { getMyProfile } from "@/data/profile";
import { ROLE_LABELS } from "@/lib/team/records";
import { formatDate, formatMoney } from "@/lib/projects/format";
import { TONE_SOFT } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Profile · Internal platform" };

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const profile = await getMyProfile(viewer);
  if (!profile) notFound();

  const employment = profile.employment;

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeading title={profile.displayName ?? profile.fullName} />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <ProfileEditor profile={profile} />

          <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
            <CardContent className="p-5">
              <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
                Projects
              </h2>
              {profile.projects.length ? (
                <ul className="mt-4 space-y-2">
                  {profile.projects.map((project) => (
                    <li
                      key={project.id}
                      className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-black/80">
                        {project.name}
                      </span>
                      {project.responsibility ? (
                        <span className="truncate text-[11px] text-black/40">
                          {project.responsibility}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[12px] text-black/40">
                  You are not on a project yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
                Your record
              </h2>
              <Badge
                variant="outline"
                className={cn("rounded-full font-semibold", TONE_SOFT.ok)}
              >
                {profile.activatedAt ? "Active" : "Not signed in yet"}
              </Badge>
            </div>

            <dl className="mt-4 space-y-2.5">
              <Row label="Official name" value={profile.fullName} />
              <Row label="Email" value={profile.email ?? "Not recorded"} />
              <Row label="Role" value={ROLE_LABELS[profile.role]} />
              <Row
                label="Job title"
                value={profile.jobTitle ?? "Not recorded"}
              />
              <Row label="Phone" value={profile.phone ?? "Not recorded"} />
              <Row label="Projects" value={String(profile.projects.length)} />

              {employment ? (
                <>
                  <Row
                    label="Employment"
                    value={employment.employmentType ?? "Not recorded"}
                  />
                  <Row
                    label="Started"
                    value={
                      employment.startDate
                        ? formatDate(employment.startDate)
                        : "Not recorded"
                    }
                  />
                  <Row
                    label="Salary"
                    value={
                      employment.salaryAmount === null
                        ? "Not recorded"
                        : formatMoney(employment.salaryAmount, "PKR")
                    }
                  />
                  <Row label="CNIC" value={employment.cnic ?? "Not recorded"} />
                  <Row
                    label="Bank"
                    value={employment.bankName ?? "Not recorded"}
                  />
                  <Row
                    label="Account"
                    value={employment.bankAccountNumber ?? "Not recorded"}
                  />
                </>
              ) : null}
            </dl>

            {profile.documents.length ? (
              <ul className="mt-5 space-y-2">
                {profile.documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5"
                  >
                    <FileText className="size-4 shrink-0 text-black/35" />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-black/80">
                      {document.fileName}
                    </span>
                    {document.url ? (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-medium text-black/60 hover:text-black"
                      >
                        Open
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-5 text-[11.5px] text-black/40">
              An owner keeps these details. Ask them to change anything here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11.5px] text-black/45">{label}</dt>
      <dd className="min-w-0 truncate text-[12.5px] text-black/75 capitalize">
        {value}
      </dd>
    </div>
  );
}
