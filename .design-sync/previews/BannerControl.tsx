import { BannerControl } from "gd-website";

const idle = { status: "idle" as const, message: null, warning: null };
const save = async () => idle;
const remove = async () => idle;

export function NoBanner() {
  return (
    <div className="panel-dark p-6">
      <BannerControl
        projectId="northwind-logistics"
        hasBanner={false}
        save={save}
        remove={remove}
      />
    </div>
  );
}

export function HasBanner() {
  return (
    <div className="panel-dark p-6">
      <BannerControl
        projectId="harbor-freight"
        hasBanner={true}
        save={save}
        remove={remove}
      />
    </div>
  );
}
