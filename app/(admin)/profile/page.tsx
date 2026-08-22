import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import {
  ProfileHeader,
  type ProfileStat,
} from "@/components/admin/profile/profile-header";
import { ProfileEditor } from "@/components/admin/profile/profile-editor";
import { Card, CardContent } from "@/components/ui/card";
import { PanelSkeleton } from "@/components/admin/skeletons";
import { requireViewer, type Viewer } from "@/data/auth";
import { getMyProfile, type MyProfile } from "@/data/profile";
import { EMPLOYMENT_LABELS, ROLE_LABELS } from "@/lib/team/records";
import { formatDate, formatMoney, initials } from "@/lib/projects/format";
import { CARD_HOVER } from "@/lib/admin-ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Profile · Internal platform" };

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

function monthYear(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildStats(profile: MyProfile): ProfileStat[] {
  const since = profile.employment?.startDate
    ? new Date(`${profile.employment.startDate}T00:00:00`)
    : new Date(profile.createdAt);
  const years = (Date.now() - since.getTime()) / MS_PER_YEAR;

  return [
    { label: "Projects", value: String(profile.projects.length) },
    { label: "Documents", value: String(profile.documents.length) },
    {
      label: "Tenure",
      value:
        years < 1
          ? Math.max(1, Math.round(years * 12)).toString()
          : years.toFixed(1),
      suffix: years < 1 ? "mo" : "yrs",
    },
    { label: "Member since", value: monthYear(since.toISOString()) },
  ];
}

export default async function ProfilePage() {
  const viewer = await requireViewer();

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileBody viewer={viewer} />
    </Suspense>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[1140px] space-y-4" aria-busy role="status">
      <span className="sr-only">Loading profile</span>
      <PanelSkeleton lines={4} />
      <PanelSkeleton lines={6} />
    </div>
  );
}

async function ProfileBody({ viewer }: { viewer: Viewer }) {
  const profile = await getMyProfile(viewer);
  if (!profile) notFound();

  const employment = profile.employment;
  const name = profile.displayName ?? profile.fullName;
  const joined = employment?.startDate
    ? monthYear(`${employment.startDate}T00:00:00`)
    : monthYear(profile.createdAt);
  const subtitle = profile.jobTitle
    ? `${profile.jobTitle} · joined ${joined}`
    : `Joined ${joined}`;

  return (
    <div className="mx-auto max-w-[1140px] space-y-4">
      <ProfileHeader
        name={name}
        roleLabel={ROLE_LABELS[profile.role]}
        subtitle={subtitle}
        email={profile.email}
        avatarUrl={profile.avatarUrl}
        bannerUrl={profile.bannerUrl}
        initials={initials(name)}
        stats={buildStats(profile)}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <ProfileEditor profile={profile} />

          <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
                  Projects · {profile.projects.length}
                </h2>
                <Link
                  href="/projects"
                  className="rounded-md text-[12px] font-semibold text-[#08743d] transition-colors duration-150 hover:text-[#0b5f2c] focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
                >
                  View all
                </Link>
              </div>

              {profile.projects.length ? (
                <ul className="space-y-2">
                  {profile.projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/projects/${project.publicId}`}
                        className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5 transition duration-150 hover:translate-x-0.75 hover:border-[#2fe85c]/50 focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
                      >
                        <span className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-[#2fe85c]/12 font-mono text-[11px] font-semibold text-[#08743d]">
                          {initials(project.name)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-black/80">
                          {project.name}
                        </span>
                        {project.responsibility ? (
                          <span className="shrink-0 truncate text-[11px] text-black/40">
                            {project.responsibility}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-black/40">
                  You are not on a project yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-black/[0.07] bg-[#f8f8f3] py-0 shadow-none">
          <CardContent className="p-5">
            <h2 className="mb-4 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
              Your record
            </h2>

            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2">
              <Cell label="Official name" value={profile.fullName} />
              <Cell label="Email" value={profile.email ?? "Not recorded"} />
              <Cell label="Role" value={ROLE_LABELS[profile.role]} />
              <Cell
                label="Job title"
                value={profile.jobTitle ?? "Not recorded"}
              />
              <Cell label="Phone" value={profile.phone ?? "Not recorded"} />
              <Cell label="Projects" value={String(profile.projects.length)} />

              {employment ? (
                <>
                  <Cell
                    label="Employment"
                    value={
                      employment.employmentType
                        ? EMPLOYMENT_LABELS[employment.employmentType]
                        : "Not recorded"
                    }
                  />
                  <Cell
                    label="Started"
                    value={
                      employment.startDate
                        ? formatDate(employment.startDate)
                        : "Not recorded"
                    }
                  />
                  <Cell
                    label="Salary"
                    value={
                      employment.salaryAmount === null
                        ? "Not recorded"
                        : formatMoney(employment.salaryAmount, "PKR")
                    }
                  />
                  <Cell
                    label="CNIC"
                    value={employment.cnic ?? "Not recorded"}
                  />
                  <Cell
                    label="Bank"
                    value={employment.bankName ?? "Not recorded"}
                  />
                  <Cell
                    label="Account"
                    value={employment.bankAccountNumber ?? "Not recorded"}
                  />
                </>
              ) : null}
            </dl>

            {profile.documents.length ? (
              <>
                <h2 className="mt-6 mb-3 font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
                  Documents · {profile.documents.length}
                </h2>
                <ul className="space-y-2">
                  {profile.documents.map((document) => (
                    <li
                      key={document.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5",
                        CARD_HOVER,
                      )}
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
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-[12px] font-semibold text-black/55 transition-colors duration-150 hover:text-[#08743d] focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
                        >
                          Open
                          <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
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

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3 transition-colors duration-150 hover:bg-[#f8f8f3]">
      <dt className="text-[11px] text-black/42">{label}</dt>
      <dd className="mt-0.75 truncate text-[13px] font-medium text-black/80">
        {value}
      </dd>
    </div>
  );
}
