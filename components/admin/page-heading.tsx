export function PageHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="font-display text-[2rem] leading-none font-semibold tracking-[-0.05em] text-[#14171a] sm:text-[2.5rem]">
        {title}
      </h1>
      {action ? (
        <div className="flex w-full sm:w-auto sm:shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
