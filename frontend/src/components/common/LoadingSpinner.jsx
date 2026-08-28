const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

/**
 * Usage:
 *   <LoadingSpinner />                 inline, medium
 *   <LoadingSpinner size="sm" />       inside a button
 *   <LoadingSpinner label="Loading businesses…" centered />   full-block state
 */
export default function LoadingSpinner({
  size = "md",
  label,
  centered = false,
  className = "",
}) {
  const spinner = (
    <span
      role="status"
      aria-label={label || "Loading"}
      className={`inline-block animate-spin rounded-full border-brand-200 border-t-brand-500 ${sizes[size]} ${className}`}
    />
  );

  if (!centered) return spinner;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      {spinner}
      {label && <p className="text-sm text-ink-soft">{label}</p>}
    </div>
  );
}
