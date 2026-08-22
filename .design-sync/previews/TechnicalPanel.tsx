import { TechnicalPanel } from "gd-website";

const idle = {
  status: "idle" as const,
  message: null,
  values: null,
  fieldErrors: {},
};
const saveAction = async () => idle;

export function Filled() {
  const details = {
    repositoryUrl: "https://github.com/gamma/northwind-dispatch",
    hostingUrl: "https://vercel.com/gamma/northwind-dispatch",
    liveDomain: "dispatch.northwindlogistics.com",
    stagingDomain: "staging.northwindlogistics.com",
    designUrl: "https://figma.com/file/northwind-dispatch",
    stackNotes: "Next.js 16, Supabase, Twilio for SMS alerts. Deployed on Vercel.",
    onboardingNotes: "Ask Devon for the Harbor WMS sandbox credentials before touching the rate lookup service.",
    updatedBy: "Maya Reyes",
    updatedAt: "2026-08-19T10:00:00.000Z",
  };

  return (
    <div className="max-w-2xl p-6">
      <TechnicalPanel
        projectId="northwind-logistics"
        details={details}
        canEdit={true}
        isArchived={false}
        save={saveAction}
      />
    </div>
  );
}

export function Empty() {
  return (
    <div className="max-w-2xl p-6">
      <TechnicalPanel
        projectId="new-client"
        details={null}
        canEdit={true}
        isArchived={false}
        save={saveAction}
      />
    </div>
  );
}

export function ReadOnlyArchived() {
  const details = {
    repositoryUrl: "https://github.com/gamma/harbor-freight",
    hostingUrl: "",
    liveDomain: "portal.harborfreight.com",
    stagingDomain: "",
    designUrl: "",
    stackNotes: "",
    onboardingNotes: "",
    updatedBy: "Priya Nair",
    updatedAt: "2026-05-02T14:00:00.000Z",
  };

  return (
    <div className="max-w-2xl p-6">
      <TechnicalPanel
        projectId="harbor-freight"
        details={details}
        canEdit={true}
        isArchived={true}
        save={saveAction}
      />
    </div>
  );
}
