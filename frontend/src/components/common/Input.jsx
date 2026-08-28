export default function Input({ label, error, id, className = "", ...props }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50
        focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400
        ${error ? "border-danger" : "border-border"} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
