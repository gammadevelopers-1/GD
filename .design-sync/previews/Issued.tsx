import { Issued } from "gd-website";

const noop = () => {};

export function ClientAccess() {
  return (
    <div className="bg-background max-w-md p-6">
      <Issued
        issued={{
          name: "Harbor Freight Co",
          email: "ops@harborfreight.co",
          password: "brisk-anchor-4821",
          url: "https://portal.gammadevelopers.ai/p/harbor-freight",
        }}
        onClose={noop}
      />
    </div>
  );
}

export function TeamMember() {
  return (
    <div className="bg-background max-w-md p-6">
      <Issued
        issued={{
          name: "Amara Siddiqui",
          email: "amara@gammadevelopers.ai",
          password: "coral-thicket-9013",
          url: "https://app.gammadevelopers.ai/sign-in",
        }}
        onClose={noop}
      />
    </div>
  );
}
