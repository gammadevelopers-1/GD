import { CompanyForm } from "gd-website";

const create = async () => ({ status: "idle" as const, message: null });

export function Create() {
  return (
    <div className="max-w-sm bg-[#f8f8f3] p-6">
      <CompanyForm action={create} submitLabel="Add client" />
    </div>
  );
}

export function Edit() {
  return (
    <div className="max-w-sm bg-[#f8f8f3] p-6">
      <CompanyForm
        action={create}
        clientId="client-1"
        defaults={{
          name: "Northwind Logistics",
          website: "https://northwindlogistics.com",
          notes: "Dispatch and billing contacts differ, always cc both.",
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
