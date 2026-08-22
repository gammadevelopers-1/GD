import { NewsletterForm } from "gd-website";

export function OnFooterSurface() {
  return (
    <div className="bg-[#0f1512] p-10">
      <p className="mb-3 text-[13px] text-[#eceae2]">
        Field notes on shipping AI systems, once a month.
      </p>
      <div style={{ maxWidth: 320 }}>
        <NewsletterForm />
      </div>
    </div>
  );
}
