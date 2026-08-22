import { Suspense } from "react";
import { UsersRound } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeading } from "@/components/admin/page-heading";
import { AddMember } from "@/components/admin/team/add-member";
import { TeamList } from "@/components/admin/team/team-list";
import { CardGridSkeleton } from "@/components/admin/skeletons";
import { requireRole, type Viewer } from "@/data/auth";
import { getTeamDirectory } from "@/data/team";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const viewer = await requireRole(["owner"]);

  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeading title="Team" action={<AddMember />} />

      <Suspense fallback={<CardGridSkeleton count={6} height="h-40" />}>
        <TeamDirectory viewer={viewer} />
      </Suspense>
    </div>
  );
}

async function TeamDirectory({ viewer }: { viewer: Viewer }) {
  const members = await getTeamDirectory(viewer);
  const active = members.filter((member) => member.state !== "archived");
  const archived = members.filter((member) => member.state === "archived");

  return (
    <>
      {active.length ? (
        <TeamList members={active} />
      ) : (
        <EmptyState
          icon={UsersRound}
          title="Nobody here yet"
          description="Add the first person and send them an invitation to set a password."
        />
      )}

      {archived.length ? (
        <section className="mt-8">
          <h2 className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
            Archived
          </h2>
          <div className="mt-3">
            <TeamList members={archived} />
          </div>
        </section>
      ) : null}
    </>
  );
}
