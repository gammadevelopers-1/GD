import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getClientViewer } from "@/data/portal";
import { AuthForm } from "@/components/portal/auth-form";
import { PortalCard } from "@/components/portal/portal-card";
import { signIn } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const REASONS: Record<string, string> = {
  "password-set": "Your password is set. Sign in with it now.",
  access: "Sign in to see your project.",
  expired: "You were signed out after a while away. Sign in again.",
};

export default async function PortalSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const viewer = await getClientViewer();
  if (viewer) redirect("/portal");

  const { reason } = await searchParams;

  return (
    <PortalCard
      eyebrow="Client access"
      title="Sign in to your project"
      intro={
        (reason ? REASONS[reason] : null) ??
        "Use the email and password you were sent."
      }
    >
      <AuthForm
        action={signIn}
        submit="Sign in"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "name@company.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
      />
    </PortalCard>
  );
}
