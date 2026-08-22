import { PageHeading, Button } from "gd-website";
import { Plus } from "lucide-react";

export function Default() {
  return (
    <div className="bg-background p-8">
      <PageHeading title="Projects" />
    </div>
  );
}

export function WithAction() {
  return (
    <div className="bg-background p-8">
      <PageHeading
        title="Clients"
        action={
          <Button>
            <Plus /> New client
          </Button>
        }
      />
    </div>
  );
}
