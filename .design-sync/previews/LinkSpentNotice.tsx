import { LinkSpentNotice } from "gd-website";

export function Default() {
  return (
    <div className="bg-[#101214] p-8">
      <div className="mx-auto max-w-sm">
        <LinkSpentNotice signInHref="/sign-in" />
      </div>
    </div>
  );
}

export function Tight() {
  return (
    <div className="bg-[#101214] p-8">
      <div className="mx-auto max-w-sm">
        <LinkSpentNotice signInHref="/sign-in" className="mt-0" />
      </div>
    </div>
  );
}
