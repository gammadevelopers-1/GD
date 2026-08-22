import { PortalCard, AuthForm } from "gd-website";

const noop = async () => ({});

export function SignIn() {
  return (
    <PortalCard
      eyebrow="Client access"
      title="Sign in to your project"
      intro="Use the email and password you were sent."
    >
      <AuthForm
        action={noop}
        submit="Sign in"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "name@northwindlogistics.com",
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

export function PasswordSet() {
  return (
    <PortalCard
      eyebrow="Client access"
      title="Your password is set"
      intro="Sign in with it now."
    >
      <AuthForm
        action={noop}
        submit="Sign in"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "name@harborfreight.co",
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
