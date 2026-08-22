import { Input, Label } from "gd-website";

export function WithInput() {
  return (
    <div className="bg-background p-10">
      <div className="grid gap-2" style={{ maxWidth: 320 }}>
        <Label htmlFor="client-name">Client name</Label>
        <Input id="client-name" defaultValue="Northwind Logistics" />
      </div>
    </div>
  );
}

export function DisabledField() {
  return (
    <div className="bg-background p-10">
      <div className="group grid gap-2" data-disabled="true" style={{ maxWidth: 320 }}>
        <Label htmlFor="project-code">Project code</Label>
        <Input id="project-code" defaultValue="NWL-2026-01" disabled />
      </div>
    </div>
  );
}
