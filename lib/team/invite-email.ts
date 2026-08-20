import { ROLE_LABELS, type TeamRole } from "@/lib/team/records";
import type { InviteEmail } from "@/lib/invites/email";

export function buildInviteEmail({
  fullName,
  jobTitle,
  role,
  invitedBy,
}: {
  fullName: string;
  jobTitle: string;
  role: TeamRole;
  invitedBy: string;
}): InviteEmail {
  const firstName = fullName.split(/\s+/)[0] ?? fullName;
  const access =
    role === "finance"
      ? "You will see invoices and expenses when they land there."
      : "You will see the projects you are added to.";

  return {
    subject: `Your Gamma Developers account`,
    body: [
      `Hi ${firstName},`,
      "",
      `You have been added to the Gamma Developers internal platform as ${jobTitle} (${ROLE_LABELS[role]}).`,
      "",
      `${access} Set a password using the link below, then sign in with this email address and the password you chose.`,
      "",
      `— ${invitedBy}`,
    ].join("\n"),
  };
}
