import { Label, Switch } from "gd-website";

export function States() {
  return (
    <div className="bg-background flex items-center gap-8 p-10">
      <Switch defaultChecked />
      <Switch />
      <Switch defaultChecked disabled />
      <Switch disabled />
    </div>
  );
}

export function Sizes() {
  return (
    <div className="bg-background flex items-center gap-8 p-10">
      <Switch size="sm" defaultChecked />
      <Switch size="default" defaultChecked />
    </div>
  );
}

export function InSettingsRow() {
  return (
    <div className="bg-background p-10">
      <div
        className="border-border flex items-center justify-between gap-6 rounded-xl border p-4"
        style={{ maxWidth: 380 }}
      >
        <Label htmlFor="notify-client">Notify client on milestone close</Label>
        <Switch id="notify-client" defaultChecked />
      </div>
    </div>
  );
}
