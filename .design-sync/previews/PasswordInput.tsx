import { Label, PasswordInput } from "gd-website";

export function Default() {
  return (
    <div className="bg-background p-10">
      <div className="grid gap-2" style={{ maxWidth: 320 }}>
        <Label htmlFor="portal-password">Password</Label>
        <PasswordInput
          id="portal-password"
          defaultValue="northwind-2026"
          placeholder="Enter your password"
        />
      </div>
    </div>
  );
}

export function Empty() {
  return (
    <div className="bg-background p-10">
      <div style={{ maxWidth: 320 }}>
        <PasswordInput placeholder="Enter your password" />
      </div>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="bg-background p-10">
      <div style={{ maxWidth: 320 }}>
        <PasswordInput defaultValue="northwind-2026" disabled />
      </div>
    </div>
  );
}
