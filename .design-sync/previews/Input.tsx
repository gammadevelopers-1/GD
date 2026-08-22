import { Input } from "gd-website";

export function Default() {
  return (
    <div className="bg-background max-w-sm space-y-3 p-6">
      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Project name</span>
        <Input defaultValue="Northwind Logistics" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Client email</span>
        <Input type="email" placeholder="ops@northwindlogistics.com" />
      </label>
    </div>
  );
}

export function States() {
  return (
    <div className="bg-background max-w-sm space-y-3 p-6">
      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Retainer amount</span>
        <Input defaultValue="4,200" disabled />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[12px] text-black/55">Work email</span>
        <Input
          defaultValue="not-an-email"
          aria-invalid="true"
          placeholder="name@gammadevelopers.ai"
        />
      </label>
    </div>
  );
}
