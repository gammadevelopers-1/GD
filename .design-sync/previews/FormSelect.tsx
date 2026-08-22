import { FormSelect } from "gd-website";

const environmentOptions = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
  { value: "other", label: "Other" },
];

const memberOptions = [
  { value: "", label: "Choose someone on this project", disabled: true },
  { value: "m1", label: "Amara Chen" },
  { value: "m2", label: "Farrukh Iqbal" },
];

export function Default() {
  return (
    <div className="bg-background p-10">
      <FormSelect
        name="environment"
        defaultValue="production"
        options={environmentOptions}
        ariaLabel="Environment"
      />
    </div>
  );
}

export function Placeholder() {
  return (
    <div className="bg-background p-10">
      <FormSelect
        name="profileId"
        defaultValue=""
        options={memberOptions}
        ariaLabel="Person"
      />
    </div>
  );
}

export function Small() {
  return (
    <div className="bg-background p-10">
      <FormSelect
        name="environment"
        defaultValue="staging"
        options={environmentOptions}
        triggerSize="sm"
        ariaLabel="Environment"
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="bg-background p-10">
      <FormSelect
        name="environment"
        defaultValue="production"
        options={environmentOptions}
        disabled
        ariaLabel="Environment"
      />
    </div>
  );
}
