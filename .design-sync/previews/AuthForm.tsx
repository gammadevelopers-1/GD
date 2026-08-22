import { AuthForm } from "gd-website";

const noop = async () => ({});
const withError = async () => ({ error: "That email and password don't match." });

export function SignIn() {
  return (
    <div className="panel-dark max-w-md p-8">
      <AuthForm
        action={noop}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@northwindlogistics.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        submit="Sign in"
      />
    </div>
  );
}

export function WithError() {
  return (
    <div className="panel-dark max-w-md p-8">
      <AuthForm
        action={withError}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@harborfreight.co",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        submit="Sign in"
      />
    </div>
  );
}

export function SetPassword() {
  return (
    <div className="panel-dark max-w-md p-8">
      <AuthForm
        action={noop}
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            placeholder: "At least 12 characters",
          },
        ]}
        submit="Set password"
      />
    </div>
  );
}
