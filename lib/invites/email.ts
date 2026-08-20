export type InviteEmail = { subject: string; body: string };

export const INVITE_LINK_HEADING = "Set your password:";

export function withInviteLink(body: string, url: string) {
  return `${body.trimEnd()}\n\n${INVITE_LINK_HEADING}\n${url}\n\nThis link is for you alone. Do not forward it.`;
}
