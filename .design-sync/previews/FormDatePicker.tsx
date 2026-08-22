import { FormDatePicker } from "gd-website";

export function Empty() {
  return (
    <div className="bg-background p-10">
      <FormDatePicker name="startDate" ariaLabel="Start date" />
    </div>
  );
}

export function Filled() {
  return (
    <div className="bg-background p-10">
      <FormDatePicker
        name="dueDate"
        defaultValue="2026-09-04"
        ariaLabel="Due date"
      />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="bg-background p-10">
      <FormDatePicker
        name="lockedDate"
        defaultValue="2026-08-21"
        disabled
        ariaLabel="Locked date"
      />
    </div>
  );
}
