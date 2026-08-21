import type { InviteEmail } from "@/lib/invites/email";

export function buildClientInviteEmail({
  fullName,
  projectName,
  invitedBy,
}: {
  fullName: string;
  projectName: string;
  invitedBy: string;
}): InviteEmail {
  const firstName = fullName.split(/\s+/)[0] ?? fullName;

  return {
    subject: `${projectName} — your Gamma Developers project`,
    body: [
      `Hi ${firstName},`,
      "",
      `You have been given access to ${projectName} on the Gamma Developers client portal, where you can follow progress week by week.`,
      "",
      "Set a password using the link below, then sign in with this email address and the password you chose.",
      "",
      `— ${invitedBy}`,
    ].join("\n"),
  };
}

export function buildClientReturnEmail({
  fullName,
  projectName,
  invitedBy,
}: {
  fullName: string;
  projectName: string;
  invitedBy: string;
}): InviteEmail {
  const firstName = fullName.split(/\s+/)[0] ?? fullName;

  return {
    subject: `${projectName} — added to your Gamma Developers portal`,
    body: [
      `Hi ${firstName},`,
      "",
      `${projectName} has been added to your Gamma Developers client portal.`,
      "",
      "Sign in with the email address and password you already use. Your password has not changed.",
      "",
      `— ${invitedBy}`,
    ].join("\n"),
  };
}

export function withSignInLink(body: string, url: string) {
  return `${body.trimEnd()}\n\nSign in:\n${url}\n`;
}
