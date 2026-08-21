import { Button } from "gd-website";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button>Book an audit</Button>
      <Button variant="outline">View case study</Button>
      <Button variant="secondary">Duplicate</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete project</Button>
      <Button variant="link">Read the brief</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function WithIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button>
        <Plus /> New project
      </Button>
      <Button variant="outline">
        Continue <ArrowRight />
      </Button>
      <Button variant="secondary">
        <Check /> Mark shipped
      </Button>
      <Button variant="destructive" size="icon">
        <Trash2 />
      </Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button disabled>Saving…</Button>
      <Button variant="outline" disabled>
        Unavailable
      </Button>
    </div>
  );
}
