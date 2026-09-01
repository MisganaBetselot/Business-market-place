import { useId, useState } from "react";

/**
 * Floating-label input. Label sits inside the field until you focus or
 * type, then it lifts. The border on focus draws in from the label side
 * rather than just changing color, so it reads as a deliberate motion,
 * not a default browser ring.
 */
export default function Input({ label, error, id, className = "", value, onFocus, onBlur, ...props }) {
  const autoId = useId();
  const inputId = id || props.name || autoId;
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== "";
  const floated = focused || hasValue;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          id={inputId}
          value={value}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          placeholder=" "
          className={`peer w-full rounded-xl border-2 bg-white px-4 pt-5 pb-2 text-sm text-ink outline-none
          transition-colors duration-200
          ${error ? "border-danger" : focused ? "border-brand-500" : "border-border hover:border-brand-100"}
          ${className}`}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={`pointer-events-none absolute left-4 transition-all duration-200 ease-out
            ${floated ? "top-1.5 text-[11px] font-medium text-brand-600" : "top-1/2 -translate-y-1/2 text-sm text-ink-soft"}`}
          >
            {label}
          </label>
        )}
      </div>
      {error && <span className="text-xs text-danger animate-fade-in">{error}</span>}
    </div>
  );
}
