export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[9px] tracking-[0.16em] text-[#057a43] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 text-[2rem] leading-none font-semibold tracking-[-0.05em] text-[#14171a] sm:text-[2.5rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b5148]">
          {description}
        </p>
      </div>
      {action ? (
        <div className="flex w-full sm:w-auto sm:shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
