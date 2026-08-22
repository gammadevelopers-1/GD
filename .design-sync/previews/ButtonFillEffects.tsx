import { ButtonFillEffects } from "gd-website";

export function OnLight() {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-[#eef0e9] p-8">
      <ButtonFillEffects />
      <button
        type="button"
        data-button-fill
        className="button-fill-fx nav-cta bg-brand relative inline-flex h-10 items-center overflow-hidden rounded-full px-5 text-[13px] font-semibold text-[#101512] shadow-[0_5px_18px_rgba(47,232,92,0.22)]"
      >
        <span className="button-fill-fx__label">Book a call</span>
      </button>
      <button
        type="button"
        data-button-fill
        className="button-fill-fx button-fill-fx--lift inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15181b] px-5 text-sm font-semibold text-white [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
      >
        <span className="button-fill-fx__label">Continue to workspace</span>
      </button>
    </div>
  );
}

export function OnDark() {
  return (
    <div className="panel-dark flex flex-wrap items-center gap-4 p-8">
      <ButtonFillEffects />
      <button
        type="button"
        data-button-fill
        className="button-fill-fx button-fill-fx--lift group bg-brand flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-[#101512] shadow-[0_12px_35px_rgba(47,232,92,0.2)]"
      >
        <span className="button-fill-fx__label">Book the full audit</span>
      </button>
      <button
        type="button"
        data-button-fill
        className="button-fill-fx button-fill-fx--lift inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.045] px-6 text-sm font-medium text-white/65 [--button-fill-color:#2fe85c] [--button-fill-hover-text:#101512]"
      >
        <span className="button-fill-fx__label">Try a different account</span>
      </button>
    </div>
  );
}
