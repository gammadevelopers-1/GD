import { AmbientField, HeroAuditCta } from "gd-website";

export function Default() {
  return (
    <div
      className="bg-background text-[13px]  relative isolate flex items-center justify-center overflow-hidden p-10"
      style={{ minHeight: 280 }}
    >
      <AmbientField variant="mint" />
      <div className="relative z-1">
        <HeroAuditCta />
      </div>
    </div>
  );
}
